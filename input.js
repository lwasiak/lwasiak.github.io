var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var currentlyPressedKeys = {};

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }
    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = newX - lastMouseX;
    camRotateHorizontal += deltaX * 0.2;

    var deltaY = newY - lastMouseY;
    camRotateVertical += deltaY * 0.2;

    lastMouseX = newX
    lastMouseY = newY;
}

var speed = 0.0;

function handleKeys() {
    if (currentlyPressedKeys[49]) {     // 1
        moveMode = 4;
    }
    if (currentlyPressedKeys[50]) {     // 2
        moveMode = 3;
    }
    if (currentlyPressedKeys[81]) {     // Q
        camYPos -= 0.25;
    }
    if (currentlyPressedKeys[69]) {     // E
        camYPos += 0.25;
    }
    if (currentlyPressedKeys[65]) {     // A
        camXPos -= 0.5 * Math.cos(degToRad(camRotateHorizontal));
        camZPos -= 0.5 * Math.sin(degToRad(camRotateHorizontal));
    }
    if (currentlyPressedKeys[68]) {     // D
        camXPos += 0.5 * Math.cos(degToRad(camRotateHorizontal));
        camZPos += 0.5 * Math.sin(degToRad(camRotateHorizontal));
    }
    if (currentlyPressedKeys[87]) {     // W
        if (moveMode == 4) {
            camXPos += 0.5 * Math.sin(degToRad(camRotateHorizontal));
            camZPos -= 0.5 * Math.cos(degToRad(camRotateHorizontal));
            camYPos -= 0.5 * Math.sin(degToRad(camRotateVertical));
        } else {
            speed += 0.05;
        }
    }
    if (currentlyPressedKeys[83]) {     // S
        if (moveMode == 4) {
            camXPos -= 0.5 * Math.sin(degToRad(camRotateHorizontal));
            camZPos += 0.5 * Math.cos(degToRad(camRotateHorizontal));
            camYPos += 0.5 * Math.sin(degToRad(camRotateVertical));
        } else {
            speed -= 0.05;
        }
    }
    if (currentlyPressedKeys[82]) {     // R
        speed = 0.0;
    }
}

var batchGrass   = true;
var batchFlower  = [true, true];
var skybox       = true;
var radialBlur   = true;
var depthOfField = true;
var shadows      = true;
var softShadows  = true;
var lighting     = true;

function moveGrassSlider(s) {
    grassDensity = parseFloat(s.value);
    countGrassClusterBuffers();
}

function cbBatchGrass(s) {
    batchGrass = !batchGrass;
    s.checked = batchGrass;
}

function moveFlowerRedSlider(s) {
    flowerDensity[0] = parseFloat(s.value);
    countFlowerClusterBuffers(0);
}

function cbBatchFlowerRed(s) {
    batchFlower[0] = !batchFlower[0];
    s.checked = batchFlower[0];
}

function moveFlowerBlueSlider(s) {
    flowerDensity[1] = parseFloat(s.value);
    countFlowerClusterBuffers(1);
}

function cbBatchFlowerBlue(s) {
    batchFlower[1] = !batchFlower[1];
    s.checked = batchFlower[1];
}

function numTrees(s) {
    var number = s.value;
    if (number > 6) {
        number = 6;
    } else if (number < 0) {
        number = 0;
    }
    numberOfTrees = number;
    s.value = number;
}

function cbSkybox(s) {
    skybox = !skybox;
    s.checked = skybox;
}

function cbRadialBlur(s) {
    radialBlur = !radialBlur;
    s.checked = radialBlur;
}

function cbDepthOfField(s) {
    depthOfField = !depthOfField;
    s.checked = depthOfField;
}

var prevState = true;
function cbShadows(s) {
    shadows = !shadows;
    s.checked = shadows;
    var softShadows = document.getElementById("softShadows");
    if (shadows) {
        softShadows.disabled = false;
        softShadows.checked = prevState;
    } else {
        softShadows.disabled = true;
        prevState = softShadows.checked;
        softShadows.checked = false;
    }
}

function cbSoftShadows(s) {
    softShadows = !softShadows;
    s.checked = softShadows;
}

function cbLighting(s) {
    lighting = !lighting;
    s.checked = lighting;
}
