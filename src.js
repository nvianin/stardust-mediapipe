const THREE = require("three");

const videoElement = document.querySelector("#input-video")
const canvas = document.querySelector("canvas")
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

const renderer = new THREE.WebGLRenderer({ antialias: true });
const perspective_camera = new THREE.PerspectiveCamera();
const scene = new THREE.Scene();

document.body.appendChild(renderer.domElement);
renderer.domElement.id = "three"
renderer.setSize(innerWidth, innerHeight);

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
    console.log(factors)


    ctx.save();
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

    ctx.restore();
}

const pose = new Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    }
})
pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: true,
    smoothSegmentation: true,
    minDetectionConfidence: .5,
    minTrackingConfidence: .5
})

pose.onResults(onResults)

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({ image: videoElement })
    },
    width: 1280,
    height: 720
});
camera.start();

canvas.width = 1280;
canvas.height = 720;