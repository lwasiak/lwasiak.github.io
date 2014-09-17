var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var currentlyPressedKeys = [];

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
	
	document.getElementById("wind").checked = wind;
	
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

function cbWind(s) {
    wind = !wind;
    s.checked = wind;
	totalTime = 0.0;
    gl.useProgram(shaderGrassProgram);
    gl.uniform1f(shaderGrassProgram.useWindUniform, wind);
    gl.useProgram(shaderTreeProgram);
    gl.uniform1f(shaderTreeProgram.useWindUniform, wind);
}

function cbRain(s) {
    rain = !rain;
    s.checked = rain;
    resetRain();
    gl.useProgram(shaderGrassProgram);
    gl.uniform1f(shaderGrassProgram.rainDensityUniform, grayed);
    gl.useProgram(shaderGroundProgram);
    gl.uniform1f(shaderGroundProgram.rainDensityUniform, grayed);
    gl.useProgram(shaderTreeProgram);
    gl.uniform1f(shaderTreeProgram.rainDensityUniform, grayed);
    gl.useProgram(shaderSkyboxProgram);
    gl.uniform1f(shaderSkyboxProgram.rainDensityUniform, grayed);
}

function moveRainSlider(s) {
    rainDensity = parseFloat(s.value);
    resetRain();
    gl.useProgram(shaderGrassProgram);
    gl.uniform1f(shaderGrassProgram.rainDensityUniform, grayed);
    gl.useProgram(shaderGroundProgram);
    gl.uniform1f(shaderGroundProgram.rainDensityUniform, grayed);
    gl.useProgram(shaderTreeProgram);
    gl.uniform1f(shaderTreeProgram.rainDensityUniform, grayed);
    gl.useProgram(shaderSkyboxProgram);
    gl.uniform1f(shaderSkyboxProgram.rainDensityUniform, grayed);
}

function cbSkybox(s) {
    skybox = !skybox;
    s.checked = skybox;
}

function cbRadialBlur(s) {
    radialBlur = !radialBlur;
    s.checked = radialBlur;

    gl.useProgram(shaderRadialBlurProgram);
    gl.uniform1i(shaderRadialBlurProgram.useRadialUniform, radialBlur);
    gl.uniform1f(shaderRadialBlurProgram.speedUniform, speed);
}

function cbDepthOfField(s) {
    depthOfField = !depthOfField;
    s.checked = depthOfField;
    gl.useProgram(shaderDofProgram);
    setDepthOfFieldUniforms();
}

function tbDOFN(s) {
    dofSettings[0] = parseFloat(s.value);
    gl.useProgram(shaderDofProgram);
    setDepthOfFieldUniforms();
}

function tbDOFM(s) {
    dofSettings[1] = parseFloat(s.value);
    gl.useProgram(shaderDofProgram);
    setDepthOfFieldUniforms();
}

function tbDOFF(s) {
    dofSettings[2] = parseFloat(s.value);
    gl.useProgram(shaderDofProgram);
    setDepthOfFieldUniforms();
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

    gl.useProgram(shaderGrassProgram);
    gl.uniform1i(shaderGrassProgram.useShadowsUniform, shadows);
    gl.uniform1i(shaderGrassProgram.useSoftShadowsUniform, softShadows);
    gl.useProgram(shaderGroundProgram);
    gl.uniform1i(shaderGroundProgram.useShadowsUniform, shadows);
    gl.uniform1i(shaderGroundProgram.useSoftShadowsUniform, softShadows);
    gl.useProgram(shaderTreeProgram);
    gl.uniform1i(shaderTreeProgram.useShadowsUniform, shadows);
    gl.uniform1i(shaderTreeProgram.useSoftShadowsUniform, softShadows);
}

function cbSoftShadows(s) {
    softShadows = !softShadows;
    s.checked = softShadows;

    gl.useProgram(shaderGrassProgram);
    gl.uniform1i(shaderGrassProgram.useSoftShadowsUniform, softShadows);
    gl.useProgram(shaderGroundProgram);
    gl.uniform1i(shaderGroundProgram.useSoftShadowsUniform, softShadows);
    gl.useProgram(shaderTreeProgram);
    gl.uniform1i(shaderTreeProgram.useSoftShadowsUniform, softShadows);
}

function cbLighting(s) {
    lighting = !lighting;
    s.checked = lighting;
    gl.useProgram(shaderGrassProgram);
    setLightingUniforms(shaderGrassProgram);
    gl.useProgram(shaderGroundProgram);
    setLightingUniforms(shaderGroundProgram);
    gl.useProgram(shaderTreeProgram);
    setLightingUniforms(shaderTreeProgram);
}

function tbLightLocationX(s) {
    lightLocation[0] = parseFloat(s.value);
    gl.useProgram(shaderGrassProgram);
    setLightingUniforms(shaderGrassProgram);
    gl.useProgram(shaderGroundProgram);
    setLightingUniforms(shaderGroundProgram);
    gl.useProgram(shaderTreeProgram);
    setLightingUniforms(shaderTreeProgram);
}

function tbLightLocationY(s) {
    lightLocation[1] = parseFloat(s.value);
    gl.useProgram(shaderGrassProgram);
    setLightingUniforms(shaderGrassProgram);
    gl.useProgram(shaderGroundProgram);
    setLightingUniforms(shaderGroundProgram);
    gl.useProgram(shaderTreeProgram);
    setLightingUniforms(shaderTreeProgram);
}

function tbLightLocationZ(s) {
    lightLocation[2] = parseFloat(s.value);
    gl.useProgram(shaderGrassProgram);
    setLightingUniforms(shaderGrassProgram);
    gl.useProgram(shaderGroundProgram);
    setLightingUniforms(shaderGroundProgram);
    gl.useProgram(shaderTreeProgram);
    setLightingUniforms(shaderTreeProgram);
}

function tbLightR(s) {
    pointLightColor[0] = parseFloat(s.value);
    gl.useProgram(shaderGrassProgram);
    setLightingUniforms(shaderGrassProgram);
    gl.useProgram(shaderGroundProgram);
    setLightingUniforms(shaderGroundProgram);
    gl.useProgram(shaderTreeProgram);
    setLightingUniforms(shaderTreeProgram);
}

function tbLightG(s) {
    pointLightColor[1] = parseFloat(s.value);
    gl.useProgram(shaderGrassProgram);
    setLightingUniforms(shaderGrassProgram);
    gl.useProgram(shaderGroundProgram);
    setLightingUniforms(shaderGroundProgram);
    gl.useProgram(shaderTreeProgram);
    setLightingUniforms(shaderTreeProgram);
}

function tbLightB(s) {
    pointLightColor[2] = parseFloat(s.value);
    gl.useProgram(shaderGrassProgram);
    setLightingUniforms(shaderGrassProgram);
    gl.useProgram(shaderGroundProgram);
    setLightingUniforms(shaderGroundProgram);
    gl.useProgram(shaderTreeProgram);
    setLightingUniforms(shaderTreeProgram);
}

function tbAmbientR(s) {
    ambientColor[0] = parseFloat(s.value);
    gl.useProgram(shaderGrassProgram);
    setLightingUniforms(shaderGrassProgram);
    gl.useProgram(shaderGroundProgram);
    setLightingUniforms(shaderGroundProgram);
    gl.useProgram(shaderTreeProgram);
    setLightingUniforms(shaderTreeProgram);
}

function tbAmbientG(s) {
    ambientColor[1] = parseFloat(s.value);
    gl.useProgram(shaderGrassProgram);
    setLightingUniforms(shaderGrassProgram);
    gl.useProgram(shaderGroundProgram);
    setLightingUniforms(shaderGroundProgram);
    gl.useProgram(shaderTreeProgram);
    setLightingUniforms(shaderTreeProgram);
}

function tbAmbientB(s) {
    ambientColor[2] = parseFloat(s.value);
    gl.useProgram(shaderGrassProgram);
    setLightingUniforms(shaderGrassProgram);
    gl.useProgram(shaderGroundProgram);
    setLightingUniforms(shaderGroundProgram);
    gl.useProgram(shaderTreeProgram);
    setLightingUniforms(shaderTreeProgram);
    setLightingUniforms(shaderGroundProgram);
}
