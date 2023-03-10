const THREE = require("three");

const videoElement = document.querySelector("#input-video")
const canvas = document.querySelector("canvas")
canvas.width = 1280 / 4;
canvas.height = 720 / 4;
const ctx = canvas.getContext("2d")


const features = [
    [16, 15], // arm span
    [16, 24], // arm to hip
    [15, 23], // arm to hip
    [26, 25], // knee span
    [30, 29], // heel span
    [24, 28], // leg extension
    [23, 27], // leg extension
]

const renderer = new THREE.WebGLRenderer({
    antialias: true
});
const perspective_camera = new THREE.PerspectiveCamera();
const scene = new THREE.Scene();

const renderTarget = new THREE.WebGLRenderTarget(
    innerWidth,
    innerHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        format: THREE.RGBAFormat
    }
)
let copyTexture = new THREE.DataTexture({
    width: innerWidth,
    height: innerHeight
});

window.plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShaderMaterial({
    fragmentShader: `
    uniform sampler2D webcam;
    uniform sampler2D seg;
    uniform sampler2D feedback;
    uniform float time;
    uniform vec2 resolution;
    uniform float[7] factors;

    varying vec2 vUv;

    #define QUARTER_PI 0.78539813397
    #define HALF_PI 1.570796267
    #define PI 3.1415925359
    #define TWO_PI 6.2831852
    #define MAX_STEPS 128
    #define MAX_DIST 100.
    #define SURFACE_DIST .0007

    float mandeldist(vec3 p){
        vec3 z = p;
        float dr = 1.;
        float pwr = 3.4;
        float r = 0.;

        for(int i = 0; i < 16; i++){
            r = length(z);
            if(r > 1.5)
                break;
            
            float theta = acos(z.z/r);
            float phi = atan(z.y, z.x);
            dr = pow(r, pwr-1.) * pwr * dr + 1.;

            float zr = pow(r, pwr);
            theta *= pwr;
            phi *= pwr;

            z = zr * vec3(sin(theta + (factors[0] + factors[4]) * 1.) * cos(phi + factors[3] * 1.), sin(phi + factors[5] * 1.) * sin(theta + factors[6] * 1.), cos(theta + factors[2] * 1.));
            z+=p;
        }

        return .5 * log(r) * r / dr;
    }

    vec3 mandelNormal(vec3 p) {
        vec2 e = vec2(.0001, 0.);
        float d = mandeldist(p);
    
        return normalize(vec3(d - mandeldist(p - e.xyy), d - mandeldist(p - e.xyx), d - mandeldist(p - e.yyx)));
    }

    vec4 RayMarch(vec3 ro, vec3 rd) {
        float dO = 0.;
        vec3 p;
        for(int i = 0; i < MAX_STEPS; i++) {
            p = ro + rd * dO;
            float ds = mandeldist(p);
            dO += ds * float(i) / float(MAX_STEPS);
            if(dO > MAX_DIST || ds < SURFACE_DIST)
                break;
        }
        return vec4(dO, mandelNormal(p));
    }

    vec3 getRayDirection(vec2 uv, vec3 ro, float angle) {
        float x = uv.x;
        float y = uv.y;
    
        vec3 dir = normalize(vec3(x, y, 1.));
        dir.xz *= mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        return dir;
        normalize(vec3(uv.x + (ro.x * HALF_PI / ro.z), uv.y, 1));
    }

    float mandelAO(vec3 ro, vec3 rd) {
        float occ = 0.;
        float sca = 1.;
        const int steps = 5;
    
        for(int i = 0; i < steps; i++) {
            float hr = .01 + .02 * float(i) / float(steps);
            vec3 pos = ro + rd * hr;
            float dd = mandeldist(pos);
            /* float ao = clamp(-(dd - hr), 0., 1.);
            tally += ao * sca * vec4(1.); */
            occ += -(dd - hr) * sca;
            sca *= .751;
        }
    
        return clamp(1. - 3. * occ, 0., 1.);
    }

    const vec3 light = vec3(.2, .2, 1.);
    const vec3 dark = vec3(0.05);

    vec3 cosineColor(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
        return a + b * cos(6.28318 * (c * t + d));
    }
    vec3 palette(float t) {
        return cosineColor(t, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(0.01, 0.01, 0.01), vec3(0.00, 0.15, 0.20));
    }

    vec4 radBlur(float n, float d, sampler2D tex, vec2 st) {
        vec4 result = vec4(0.);

        for(float i = 0.; i < n; i+= 1.){
            float th = i/n * PI;
            result += texture(tex, st + vec2(cos(th) * d, sin(th) * d));
        }

        return result / n;
    }

    void main(){
        vec2 st = gl_FragCoord.xy / resolution;
        st.x *= resolution.x / resolution.y;
        st.x /= 16./9.;
        vec3 cam = texture(webcam, st).xyz;
        vec4 mask = texture(seg, st);

        mask += texture(seg, st + vec2(1. / resolution.x, 0.));
        mask += texture(seg, st + vec2(-1. / resolution.x, 0.));
        mask += texture(seg, st + vec2(0., 1. / resolution.y));
        mask += texture(seg, st + vec2(0., -1. / resolution.y));
        mask/=4.;

        float angle = 0.;
        float dist = 2.;
        float speed = .2;
        
        vec4 fractal = vec4(0.);
        
        if(mask.x > 0.) {
            vec3 ro = vec3(sin(angle + time*speed) * 1. * dist, 0., cos(angle + time*speed) * 1. * dist);
            vec3 rd = getRayDirection(st-.5, ro, -angle -time*speed + PI);
            fractal = RayMarch(ro,rd);
        }

        vec4 fb = radBlur(4., .005, feedback, gl_FragCoord.xy / resolution + vec2(.01,0.));
        fb = mix(fb, texture(feedback, gl_FragCoord.xy / resolution), mask.x);
        /* vec4 fb = texture(feedback, gl_FragCoord.xy / resolution + vec2(.01, 0.)); */


        gl_FragColor = mix(vec4(cam, 1.), vec4(fractal.yzw, 1.), mask.x);
        gl_FragColor = mix(gl_FragColor, fb, (1. - mask.x) * .99);
        /* gl_FragColor = fb -.01; */
        /* gl_FragColor = vec4(cam, 1.); */
        /* gl_FragColor = vec4(fractal.yzw, 1.); */
        /* gl_FragColor = vec4(factors[0], factors[1], factors[2], 1.); */
    }
    `,
    vertexShader: `
    varying vec2 vUv;
    void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
    `,
    uniforms: {
        webcam: {
            value: new THREE.VideoTexture(videoElement)
        },
        seg: {
            value: new THREE.CanvasTexture(canvas)
        },
        feedback: {
            value: copyTexture
        },
        time: {
            value: 0
        },
        factors: {
            value: []
        },
        resolution: {
            value: new THREE.Vector2(innerWidth, innerHeight)
        }
    }
}))
scene.add(plane)
plane.rotation.x = Math.PI
plane.position.z = 5
perspective_camera.lookAt(plane.position)
const clock = new THREE.Clock();


const setSize = () => {
    renderer.setSize(innerWidth, innerHeight);
    plane.material.uniforms.resolution.value.x = innerWidth
    plane.material.uniforms.resolution.value.y = innerHeight

    processPlane.material.uniforms.resolution.value.x = innerWidth
    processPlane.material.uniforms.resolution.value.y = innerHeight

    renderTarget.setSize(innerWidth, innerHeight)

    copyTexture.copy(renderTarget.texture)

    /* const data = new Uint8Array(innerWidth * innerHeight * 4); */
    /* copyTexture = new THREE.DataTexture(data, innerWidth, innerHeight);
    plane.material.uniforms.feedback.value = copyTexture;
    plane.material.needsUpdate = true; */

}

const processScene = new THREE.Scene();
const processPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.ShaderMaterial({
        fragmentShader: `
        uniform sampler2D tex;
        uniform vec2 resolution;

        void main() {
            vec2 st = gl_FragCoord.xy / resolution;
            /* st.x *= resolution.x / resolution.y; */
            /* st.x *= 16./9.; */
            gl_FragColor = texture(tex, st);
        }
        `,
        uniforms: {
            tex: {
                value: renderTarget.texture
            },
            resolution: {
                value: new THREE.Vector2(innerWidth, innerHeight)
            }
        }
    })
)
processPlane.position.z = 5;
processPlane.rotation.x = Math.PI;
processScene.add(processPlane);

const render = () => {
    requestAnimationFrame(render)


    /* renderer.setRenderTarget(renderTarget); */
    renderer.render(scene, perspective_camera);
    renderer.copyFramebufferToTexture(new THREE.Vector2(), copyTexture, 0)

    renderer.setRenderTarget(null)
    renderer.render(scene, perspective_camera);

    const t = clock.getElapsedTime();

    plane.material.uniforms.time.value = t;
    /* console.log(t) */
}

render()

document.body.appendChild(renderer.domElement);
renderer.domElement.id = "three"
setSize();
window.addEventListener("resize", setSize)

let prevFactors = []

const onResults = results => {

    if (!results.poseLandmarks) {
        console.log("pose error")
        return
    } else {
        /* console.log(results) */
    }

    const factors = []
    for (let f of features) {
        /* console.log(f) */
        factors.push(
            new THREE.Vector3(
                results.poseLandmarks[f[0]].x, results.poseLandmarks[f[0]].y, results.poseLandmarks[f[0]].z)
            .distanceTo(
                new THREE.Vector3(
                    results.poseLandmarks[f[1]].x, results.poseLandmarks[f[1]].y, results.poseLandmarks[f[1]].z
                )
            )
        )
    }
    if (prevFactors.length == factors.length) {
        for (let i = 0; i < factors.length; i++) {
            factors[i] = (prevFactors[i] + factors[i]) / 2
        }
    }
    console.log(factors)

    /* console.log(results.segmentationMask) */

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
    plane.material.uniforms.seg.value.needsUpdate = true
    plane.material.uniforms.factors.value = factors
    /* console.log(factors) */

    /* ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "destination-atop"
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "source-over"
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS,
        { color: "#00FF00", lineWidth: 4 })
    drawLandmarks(ctx, results.poseLandmarks, { color: "#FF0000", lineWidth: 2 })

    ctx.restore(); */

    prevFactors = factors;
}

const pose = new Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    }
})
pose.setOptions({
    modelComplexity: 0,
    smoothLandmarks: true,
    enableSegmentation: true,
    smoothSegmentation: true,
    minDetectionConfidence: .5,
    minTrackingConfidence: .5
})

pose.onResults(onResults)

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({
            image: videoElement
        })
    },
    width: 1280,
    height: 720
});
camera.start();