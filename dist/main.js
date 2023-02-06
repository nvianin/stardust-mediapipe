/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src.js":
/*!****************!*\
  !*** ./src.js ***!
  \****************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

eval("const THREE = __webpack_require__(/*! three */ \"./node_modules/three/build/three.cjs\");\r\n\r\nconst videoElement = document.querySelector(\"#input-video\")\r\nconst canvas = document.querySelector(\"canvas\")\r\nconst ctx = canvas.getContext(\"2d\")\r\n\r\nconst features = [\r\n    [16, 15], // arm span\r\n    [16, 24], // arm to hip\r\n    [15, 23], // arm to hip\r\n    [26, 25], // knee span\r\n    [30, 29], // heel span\r\n    [24, 28], // leg extension\r\n    [23, 27], // leg extension\r\n]\r\n\r\nconst renderer = new THREE.WebGLRenderer({ antialias: true });\r\nconst perspective_camera = new THREE.PerspectiveCamera();\r\nconst scene = new THREE.Scene();\r\n\r\ndocument.body.appendChild(renderer.domElement);\r\nrenderer.domElement.id = \"three\"\r\nrenderer.setSize(innerWidth, innerHeight);\r\n\r\nconst onResults = results => {\r\n\r\n    if (!results.poseLandmarks) {\r\n        console.log(\"pose error\")\r\n        return\r\n    } else {\r\n        /* console.log(results) */\r\n    }\r\n\r\n    const factors = []\r\n    for (let f of features) {\r\n        /* console.log(f) */\r\n        factors.push(\r\n            new THREE.Vector3(\r\n                results.poseLandmarks[f[0]].x, results.poseLandmarks[f[0]].y, results.poseLandmarks[f[0]].z)\r\n                .distanceTo(\r\n                    new THREE.Vector3(\r\n                        results.poseLandmarks[f[1]].x, results.poseLandmarks[f[1]].y, results.poseLandmarks[f[1]].z\r\n                    )\r\n                )\r\n        )\r\n    }\r\n    console.log(factors)\r\n\r\n\r\n    ctx.save();\r\n    ctx.clearRect(0, 0, canvas.width, canvas.height);\r\n    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);\r\n\r\n    ctx.globalCompositeOperation = \"source-in\";\r\n    ctx.fillStyle = \"#00FF00\";\r\n    ctx.fillRect(0, 0, canvas.width, canvas.height);\r\n\r\n    ctx.globalCompositeOperation = \"destination-atop\"\r\n    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);\r\n\r\n    ctx.globalCompositeOperation = \"source-over\"\r\n    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS,\r\n        { color: \"#00FF00\", lineWidth: 4 })\r\n    drawLandmarks(ctx, results.poseLandmarks, { color: \"#FF0000\", lineWidth: 2 })\r\n\r\n    ctx.restore();\r\n}\r\n\r\nconst pose = new Pose({\r\n    locateFile: (file) => {\r\n        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`\r\n    }\r\n})\r\npose.setOptions({\r\n    modelComplexity: 1,\r\n    smoothLandmarks: true,\r\n    enableSegmentation: true,\r\n    smoothSegmentation: true,\r\n    minDetectionConfidence: .5,\r\n    minTrackingConfidence: .5\r\n})\r\n\r\npose.onResults(onResults)\r\n\r\nconst camera = new Camera(videoElement, {\r\n    onFrame: async () => {\r\n        await pose.send({ image: videoElement })\r\n    },\r\n    width: 1280,\r\n    height: 720\r\n});\r\ncamera.start();\r\n\r\ncanvas.width = 1280;\r\ncanvas.height = 720;\n\n//# sourceURL=webpack:///./src.js?");

/***/ }),

/***/ "./node_modules/three/build/three.cjs":
/*!********************************************!*\
  !*** ./node_modules/three/build/three.cjs ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src.js");
/******/ 	
/******/ })()
;