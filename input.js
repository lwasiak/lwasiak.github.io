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

var softShadowsPrevState = true;
function setInputValues() {
    document.getElementById("batchGrass").checked = batchGrass;

    var grassDensitySlider = document.getElementById("grassDensity");
    grassDensitySlider.value = grassDensitySlider.max - grassDensity + 1.0;

    document.getElementById("batchFlowerRed").checked = batchFlower[0];
    var flowerRedDensitySlider = document.getElementById("flowerRedDensity");
    flowerRedDensitySlider.value = flowerRedDensitySlider.max - flowerDensity[0] + 1.0;

    document.getElementById("batchFlowerBlue").checked = batchFlower[1];
    var flowerBlueDensitySlider = document.getElementById("flowerBlueDensity");
    flowerBlueDensitySlider.value = flowerBlueDensitySlider.max - flowerDensity[1] + 1.0;

    document.getElementById("numberOfTrees").value = numberOfTrees;

    document.getElementById("rain").checked = rain;
    var rainDensitySlider = document.getElementById("rainDensity");
    rainDensitySlider.value = rainDensity;

    document.getElementById("skybox").checked = skybox;

    document.getElementById("radialBlur").checked = radialBlur;

    document.getElementById("depthOfField").checked = depthOfField;
    document.getElementById("near").value = dofSettings[0];
    document.getElementById("middle").value = dofSettings[1];
    document.getElementById("far").value = dofSettings[2];

    document.getElementById("shadows").checked = shadows;
    var softShadowsCheckbox = document.getElementById("softShadows");
    if (shadows) {
        softShadowsCheckbox.disabled = false;
        softShadowsCheckbox.checked = softShadows;
    } else {
        softShadowsCheckbox.disabled = true;
        softShadowsPrevState = softShadows;
        softShadowsCheckbox.checked = false;
    }

    document.getElementById("lighting").checked = lighting;

    document.getElementById("lightLocationX").value = lightLocation[0];
    document.getElementById("lightLocationY").value = lightLocation[1];
    document.getElementById("lightLocationZ").value = lightLocation[2];

    document.getElementById("lightR").value = pointLightColor[0];
    document.getElementById("lightG").value = pointLightColor[1];
    document.getElementById("lightB").value = pointLightColor[2];

    document.getElementById("ambientR").value = ambientColor[0];
    document.getElementById("ambientG").value = ambientColor[1];
    document.getElementById("ambientB").value = ambientColor[2];
}

function moveGrassSlider(s) {
    grassDensity = s.max - parseFloat(s.value) + 1.0;
    countGrassClusterBuffers();
}

function cbBatchGrass(s) {
    batchGrass = !batchGrass;
    s.checked = batchGrass;
}

function moveFlowerRedSlider(s) {
    flowerDensity[0] = s.max - parseFloat(s.value) + 1.0;
    countFlowerClusterBuffers(0);
}

function cbBatchFlowerRed(s) {
    batchFlower[0] = !batchFlower[0];
    s.checked = batchFlower[0];
}

function moveFlowerBlueSlider(s) {
    flowerDensity[1] = s.max - parseFloat(s.value) + 1.0;
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

function cbRain(s) {
    rain = !rain;
    s.checked = rain;
    resetRain();
}

function moveRainSlider(s) {
    rainDensity = parseFloat(s.value);
    resetRain();
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

function tbDOFN(s) {
    dofSettings[0] = parseFloat(s.value);
}

function tbDOFM(s) {
    dofSettings[1] = parseFloat(s.value);
}

function tbDOFF(s) {
    dofSettings[2] = parseFloat(s.value);
}

function cbShadows(s) {
    shadows = !shadows;
    s.checked = shadows;
    var softShadows = document.getElementById("softShadows");
    if (shadows) {
        softShadows.disabled = false;
        softShadows.checked = softShadowsPrevState;
    } else {
        softShadows.disabled = true;
        softShadowsPrevState = softShadows.checked;
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

function tbLightLocationX(s) {
    lightLocation[0] = parseFloat(s.value);
}

function tbLightLocationY(s) {
    lightLocation[1] = parseFloat(s.value);
}

function tbLightLocationZ(s) {
    lightLocation[2] = parseFloat(s.value);
}

function tbLightR(s) {
    pointLightColor[0] = parseFloat(s.value);
}

function tbLightG(s) {
    pointLightColor[1] = parseFloat(s.value);
}

function tbLightB(s) {
    pointLightColor[2] = parseFloat(s.value);
}

function tbAmbientR(s) {
    ambientColor[0] = parseFloat(s.value);
}

function tbAmbientG(s) {
    ambientColor[1] = parseFloat(s.value);
}

function tbAmbientB(s) {
    ambientColor[2] = parseFloat(s.value);
}
