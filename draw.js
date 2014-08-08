var camRotateVertical = 0.0;
var camRotateHorizontal = 45.0;
var camXPos = 5.0;
var camYPos = 20.0;
var camZPos = -5.0;
var camHeight = 1.0;
var moveMode = 4;

var shadowRotateVertical = 35.0;
var shadowRotateHorizontal = 35.0;
var shadowXPos = 10.0;
var shadowYPos = 50.0;
var shadowZPos = 35.0;

var terrainHeight = 20.0;

var grassTranslation = [0.5, 0.0, -0.5];
var grassBendFactor = 0.4;
var grassDensity = 1.0;

var flowerTranslation = [[0.5, 0.0, -0.5], [0.5, 0.0, -0.5]];
var flowerBendFactor = [0.3, 0.2];
var flowerDensity = [5.3, 4.7];

var numberOfTrees = 6;
var treeScale = [[0.25, 0.3, 0.25], [0.2, 0.2, 0.2], [0.2, 0.25, 0.25], [0.25, 0.27, 0.25], [0.25, 0.25, 0.25], [0.2, 0.2, 0.2]];
var treeXPos = [45.0, 20.0, 80.0, 30.0, 40.0, 90.0];
var treeZPos = [-30.0, -60.0, -60.0, -90.0, -95.0, -10.0];

var shadowMapQuality = 1.0;
var DOFQuality = 0.5;

function setLightingUniforms(currentProgram) {
    gl.uniform1i(currentProgram.useLightingUniform, lighting);
    if (lighting) {
        gl.uniform3f(
            currentProgram.ambientColorUniform,
            parseFloat(document.getElementById("ambientR").value),
            parseFloat(document.getElementById("ambientG").value),
            parseFloat(document.getElementById("ambientB").value)
        );

        gl.uniform3f(
            currentProgram.lightingDirectionUniform,
            parseFloat(document.getElementById("lightLocationX").value),
            parseFloat(document.getElementById("lightLocationY").value),
            parseFloat(document.getElementById("lightLocationZ").value)
        );

        gl.uniform3f(
            currentProgram.directionalColorUniform,
            parseFloat(document.getElementById("lightR").value),
            parseFloat(document.getElementById("lightG").value),
            parseFloat(document.getElementById("lightB").value)
        );
    }
}

function setDepthOfFieldUniforms() {
    if (depthOfField) {
        gl.uniform3f(
            shaderDofProgram.DOFSettingsUniform,
            parseFloat(document.getElementById("near").value),
            parseFloat(document.getElementById("middle").value),
            parseFloat(document.getElementById("far").value)
        );
    }
}

var mvSceneMatrix = mat4.create();
var pSceneMatrix = mat4.create();
var camSceneMatrix = mat4.create();
var camShadowMatrix = mat4.create();
var mvpMatrix = mat4.create();

function drawShadows() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer);
    gl.useProgram(shaderShadowProgram);
    gl.viewport(0, 0, screenWidth * shadowMapQuality, screenHeight * shadowMapQuality);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.identity(camShadowMatrix);
    mat4.rotateX(camShadowMatrix, camShadowMatrix, degToRad(shadowRotateVertical));
    mat4.rotateY(camShadowMatrix, camShadowMatrix, degToRad(shadowRotateHorizontal));
    mat4.translate(camShadowMatrix, camShadowMatrix, [-shadowXPos, -shadowYPos, -shadowZPos]);

    gl.uniform1f(shaderShadowProgram.timeUniform, totalTime);

    gl.enableVertexAttribArray(shaderShadowProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderShadowProgram.textureCoordAttribute);

    //Ground
    mat4.identity(mvSceneMatrix);

    mat4.identity(mvpMatrix);
    mat4.mul(mvpMatrix, camShadowMatrix, mvSceneMatrix);
    mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
    gl.uniformMatrix4fv(shaderShadowProgram.mvpMatrixUniform, false, mvpMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, groundTextures[0]);
    gl.uniform1i(shaderShadowProgram.samplerGroundAUniform, 0);

    gl.uniform1f(shaderShadowProgram.bendFactorUniform, 0.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainVertexPositionBuffer);
    gl.vertexAttribPointer(shaderShadowProgram.vertexPositionAttribute, terrainVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainTextureCoordsBuffer);
    gl.vertexAttribPointer(shaderShadowProgram.textureCoordAttribute, terrainTextureCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, terrainIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);

    //Grass
    mat4.identity(mvSceneMatrix);
    mat4.translate(mvSceneMatrix, mvSceneMatrix, grassTranslation);

    mat4.identity(mvpMatrix);
    mat4.mul(mvpMatrix, camShadowMatrix, mvSceneMatrix);
    mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
    gl.uniformMatrix4fv(shaderShadowProgram.mvpMatrixUniform, false, mvpMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, grassATexture);
    gl.uniform1i(shaderShadowProgram.samplerUniform, 0);

    gl.uniform1f(shaderShadowProgram.bendFactorUniform, grassBendFactor);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassBatchedVertexIndicesBuffer);

    for (var i = 0; i < 4; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, grassBatchedVertexPositionBuffer[i]);
        gl.vertexAttribPointer(shaderShadowProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
        gl.vertexAttribPointer(shaderShadowProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

        gl.drawElements(gl.TRIANGLES, grassBatchedVertexIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);

    //Flower
    for (var flowerType = 0; flowerType < flowerTypes; flowerType++) {
        mat4.identity(mvSceneMatrix);
        mat4.translate(mvSceneMatrix, mvSceneMatrix, flowerTranslation[flowerType]);

        mat4.identity(mvpMatrix);
        mat4.mul(mvpMatrix, camShadowMatrix, mvSceneMatrix);
        mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
        gl.uniformMatrix4fv(shaderShadowProgram.mvpMatrixUniform, false, mvpMatrix);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, flowerTextures[flowerType]);
        gl.uniform1i(shaderShadowProgram.samplerUniform, 0);

        gl.uniform1f(shaderShadowProgram.bendFactorUniform, flowerBendFactor[flowerType]);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flowerBatchedVertexIndicesBuffer[flowerType]);

        for (var i = 0; i < 4; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, flowerBatchedVertexPositionBuffer[flowerType][i]);
            gl.vertexAttribPointer(shaderShadowProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
            gl.vertexAttribPointer(shaderShadowProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

            gl.drawElements(gl.TRIANGLES, flowerBatchedVertexIndicesBuffer[flowerType].numItems, gl.UNSIGNED_SHORT, 0);
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);       
    }

    //Tree
    gl.uniform1f(shaderShadowProgram.bendFactorUniform, 0.0);

    for (var i = 0; i < numberOfTrees; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, treeVertexPositionBuffer[i]);
        gl.vertexAttribPointer(shaderShadowProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
        gl.vertexAttribPointer(shaderShadowProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, treeTextures[i]);
        gl.uniform1i(shaderShadowProgram.samplerUniform, 0);

        mat4.identity(mvSceneMatrix);
        var translateY = getPixel(terrainData, treeXPos[i], -treeZPos[i]).a;
        mat4.translate(mvSceneMatrix, mvSceneMatrix, [treeXPos[i], translateY / 255.0 * terrainHeight, treeZPos[i]]);
        mat4.rotateY(mvSceneMatrix, mvSceneMatrix, degToRad(i * 180));
        mat4.scale(mvSceneMatrix, mvSceneMatrix, treeScale[i]);

        mat4.identity(mvpMatrix);
        mat4.mul(mvpMatrix, camShadowMatrix, mvSceneMatrix);
        mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
        gl.uniformMatrix4fv(shaderShadowProgram.mvpMatrixUniform, false, mvpMatrix);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, treeIndicesBuffer[i]);
        gl.drawElements(gl.TRIANGLES, treeIndicesBuffer[i].numItems, gl.UNSIGNED_SHORT, 0);        
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disableVertexAttribArray(shaderShadowProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(shaderShadowProgram.textureCoordAttribute);
}

function drawDOF() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dofFramebuffer);
    gl.useProgram(shaderDofProgram);
    gl.viewport(0, 0, screenWidth * DOFQuality, screenHeight * DOFQuality);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    setDepthOfFieldUniforms();

    mat4.identity(camSceneMatrix);
    mat4.rotateX(camSceneMatrix, camSceneMatrix, degToRad(camRotateVertical));
    mat4.rotateY(camSceneMatrix, camSceneMatrix, degToRad(camRotateHorizontal));
    mat4.translate(camSceneMatrix, camSceneMatrix, [-camXPos, -camYPos, -camZPos]);

    gl.uniform1f(shaderDofProgram.timeUniform, totalTime);

    gl.enableVertexAttribArray(shaderDofProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderDofProgram.textureCoordAttribute);

    //Ground
    mat4.identity(mvSceneMatrix);

    mat4.identity(mvpMatrix);
    mat4.mul(mvpMatrix, camSceneMatrix, mvSceneMatrix);
    mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
    gl.uniformMatrix4fv(shaderDofProgram.mvpMatrixUniform, false, mvpMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, groundTextures[0]);
    gl.uniform1i(shaderDofProgram.samplerUniform, 0);

    gl.uniform1f(shaderDofProgram.bendFactorUniform, 0.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainVertexPositionBuffer);
    gl.vertexAttribPointer(shaderDofProgram.vertexPositionAttribute, terrainVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainTextureCoordsBuffer);
    gl.vertexAttribPointer(shaderDofProgram.textureCoordAttribute, terrainTextureCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, terrainIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    //Grass
    mat4.identity(mvSceneMatrix);
    mat4.translate(mvSceneMatrix, mvSceneMatrix, grassTranslation);

    mat4.identity(mvpMatrix);
    mat4.mul(mvpMatrix, camSceneMatrix, mvSceneMatrix);
    mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
    gl.uniformMatrix4fv(shaderDofProgram.mvpMatrixUniform, false, mvpMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, grassATexture);
    gl.uniform1i(shaderDofProgram.samplerUniform, 0);

    gl.uniform1f(shaderDofProgram.bendFactorUniform, grassBendFactor);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassBatchedVertexIndicesBuffer);


    for (var i = 0; i < 4; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, grassBatchedVertexPositionBuffer[i]);
        gl.vertexAttribPointer(shaderDofProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
        gl.vertexAttribPointer(shaderDofProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

        gl.drawElements(gl.TRIANGLES, grassBatchedVertexIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    //Flower
    for (var flowerType = 0; flowerType < flowerTypes; flowerType++) {
        mat4.identity(mvSceneMatrix);
        mat4.translate(mvSceneMatrix, mvSceneMatrix, flowerTranslation[flowerType]);

        mat4.identity(mvpMatrix);
        mat4.mul(mvpMatrix, camSceneMatrix, mvSceneMatrix);
        mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
        gl.uniformMatrix4fv(shaderDofProgram.mvpMatrixUniform, false, mvpMatrix);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, flowerTextures[flowerType]);
        gl.uniform1i(shaderDofProgram.samplerUniform, 0);

        gl.uniform1f(shaderDofProgram.bendFactorUniform, flowerBendFactor[flowerType]);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flowerBatchedVertexIndicesBuffer[flowerType]);

        for (var i = 0; i < 4; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, flowerBatchedVertexPositionBuffer[flowerType][i]);
            gl.vertexAttribPointer(shaderDofProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
            gl.vertexAttribPointer(shaderDofProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

            gl.drawElements(gl.TRIANGLES, flowerBatchedVertexIndicesBuffer[flowerType].numItems, gl.UNSIGNED_SHORT, 0);
        }        
    }

    //Tree
    gl.uniform1f(shaderDofProgram.bendFactorUniform, 0.0);

    for (var i = 0; i < numberOfTrees; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, treeVertexPositionBuffer[i]);
        gl.vertexAttribPointer(shaderDofProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
        gl.vertexAttribPointer(shaderDofProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, treeTextures[i]);
        gl.uniform1i(shaderDofProgram.samplerUniform, 0);
        
        mat4.identity(mvSceneMatrix);
        var translateY = getPixel(terrainData, treeXPos[i], -treeZPos[i]).a;
        mat4.translate(mvSceneMatrix, mvSceneMatrix, [treeXPos[i], translateY / 255.0 * terrainHeight, treeZPos[i]]);
        mat4.rotateY(mvSceneMatrix, mvSceneMatrix, degToRad(i * 180));
        mat4.scale(mvSceneMatrix, mvSceneMatrix, treeScale[i]);

        mat4.identity(mvpMatrix);
        mat4.mul(mvpMatrix, camSceneMatrix, mvSceneMatrix);
        mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
        gl.uniformMatrix4fv(shaderDofProgram.mvpMatrixUniform, false, mvpMatrix);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, treeIndicesBuffer[i]);
        gl.drawElements(gl.TRIANGLES, treeIndicesBuffer[i].numItems, gl.UNSIGNED_SHORT, 0);
    }

    gl.disableVertexAttribArray(shaderDofProgram.vertexPositionAttribute);
}

function drawScene() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFramebuffer);
    gl.viewport(0, 0, screenWidth, screenHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.identity(camSceneMatrix);
    mat4.rotateX(camSceneMatrix, camSceneMatrix, degToRad(camRotateVertical));
    mat4.rotateY(camSceneMatrix, camSceneMatrix, degToRad(camRotateHorizontal));
    mat4.translate(camSceneMatrix, camSceneMatrix, [-camXPos, -camYPos, -camZPos]);

    drawGround();
    drawGrass();
    drawTree();

    if (skybox) {
        drawSkybox();
    }
}

function drawGround() {
    gl.useProgram(shaderGroundProgram);
    setLightingUniforms(shaderGroundProgram);

    gl.uniformMatrix4fv(shaderGroundProgram.camMatrixUniform, false, camSceneMatrix);
    gl.uniformMatrix4fv(shaderGroundProgram.shadowCamMatrixUniform, false, camShadowMatrix);

    gl.uniform1i(shaderGroundProgram.useShadowsUniform, shadows);
    gl.uniform1i(shaderGroundProgram.useSoftShadowsUniform, softShadows);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
    gl.uniform1i(shaderGroundProgram.shadowSamplerUniform, 2);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, bumpMapTexture);
    gl.uniform1i(shaderGroundProgram.normalMapSamplerUniform, 3);

    mat4.identity(mvSceneMatrix);

    var normalMatrix = mat3.create();
    gl.uniformMatrix4fv(shaderGroundProgram.mvMatrixUniform, false, mvSceneMatrix);
    mat3.normalFromMat4(normalMatrix, mvSceneMatrix);

    gl.uniformMatrix3fv(shaderGroundProgram.nMatrixUniform, false, normalMatrix);

    gl.enableVertexAttribArray(shaderGroundProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderGroundProgram.vertexNormalAttribute);
    gl.enableVertexAttribArray(shaderGroundProgram.textureCoordAttribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainVertexPositionBuffer);
    gl.vertexAttribPointer(shaderGroundProgram.vertexPositionAttribute, terrainVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainNormalsBuffer);
    gl.vertexAttribPointer(shaderGroundProgram.vertexNormalAttribute, terrainNormalsBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainTextureCoordsBuffer);
    gl.vertexAttribPointer(shaderGroundProgram.textureCoordAttribute, terrainTextureCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, groundTextures[0]);
    gl.uniform1i(shaderGroundProgram.samplerGroundAUniform, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, groundTextures[1]);
    gl.uniform1i(shaderGroundProgram.samplerGroundBUniform, 1);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, terrainIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disableVertexAttribArray(shaderGroundProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(shaderGroundProgram.vertexNormalAttribute);
    gl.disableVertexAttribArray(shaderGroundProgram.textureCoordAttribute);
}

function drawGrass() {
    gl.useProgram(shaderGrassProgram);
    setLightingUniforms(shaderGrassProgram);

    gl.uniformMatrix4fv(shaderGrassProgram.camMatrixUniform, false, camSceneMatrix);
    gl.uniformMatrix4fv(shaderGrassProgram.shadowCamMatrixUniform, false, camShadowMatrix);

    gl.uniform1i(shaderGrassProgram.useShadowsUniform, shadows);
    gl.uniform1i(shaderGrassProgram.useSoftShadowsUniform, softShadows);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
    gl.uniform1i(shaderGrassProgram.shadowSamplerUniform, 1);

    gl.uniform1f(shaderGrassProgram.timeUniform, totalTime);

    gl.enableVertexAttribArray(shaderGrassProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderGrassProgram.vertexNormalAttribute);
    gl.enableVertexAttribArray(shaderGrassProgram.textureCoordAttribute);

    var randomNumber = 0;

    //Grass
    mat4.identity(mvSceneMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, grassATexture);
    gl.uniform1i(shaderGrassProgram.samplerUniform, 0);

    gl.uniform1f(shaderGrassProgram.bendFactorUniform, grassBendFactor);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    if (batchGrass == true) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassBatchedVertexIndicesBuffer);

        mat4.translate(mvSceneMatrix, mvSceneMatrix, grassTranslation);

        var normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, mvSceneMatrix);

        gl.uniformMatrix4fv(shaderGrassProgram.mvMatrixUniform, false, mvSceneMatrix);
        gl.uniformMatrix3fv(shaderGrassProgram.nMatrixUniform, false, normalMatrix);

        for (var i = 0; i < 4; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, grassBatchedVertexPositionBuffer[i]);
            gl.vertexAttribPointer(shaderGrassProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
            gl.vertexAttribPointer(shaderGrassProgram.vertexNormalAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 3 * 4);
            gl.vertexAttribPointer(shaderGrassProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

            gl.drawElements(gl.TRIANGLES, grassBatchedVertexIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, grassVertexPositionBuffer);
        gl.vertexAttribPointer(shaderGrassProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
        gl.vertexAttribPointer(shaderGrassProgram.vertexNormalAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 3 * 4);
        gl.vertexAttribPointer(shaderGrassProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassVertexIndicesBuffer);

        mat4.translate(mvSceneMatrix, mvSceneMatrix, grassTranslation);

        var numOfGrass = Math.floor((terrainSize - 2) / grassDensity);
        var xReturn = grassDensity * numOfGrass;

        for (var i = 0; i < numOfGrass; i++) {
            for (var j = 0; j < numOfGrass ; j++) {
                mvPushMatrix();
                var positionX = (grassDensity * j) + randomTranslations[randomNumber];
                var positionZ = (grassDensity * i) + randomTranslations[randomNumber + 1];
                mat4.translate(mvSceneMatrix,
                               mvSceneMatrix,
                               [ positionX,
                                 getPixelAvg(terrainData, positionX, positionZ) / 255.0 * terrainHeight,
                                 -positionZ ]);
                mat4.scale(mvSceneMatrix, mvSceneMatrix, [1.0, randomTranslations[randomNumber] + 0.75, 1.0]);
                randomNumber += 2;
                var normalMatrix = mat3.create();
                mat3.normalFromMat4(normalMatrix, mvSceneMatrix);

                gl.uniformMatrix4fv(shaderGrassProgram.mvMatrixUniform, false, mvSceneMatrix);
                gl.uniformMatrix3fv(shaderGrassProgram.nMatrixUniform, false, normalMatrix);

                gl.drawElements(gl.TRIANGLES, grassVertexIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
                mvPopMatrix();
            }
            randomNumber += 2;
        }
    }

    //Flower
    for (var flowerType = 0; flowerType < flowerTypes; flowerType++) {
        mat4.identity(mvSceneMatrix);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, flowerTextures[flowerType]);
        gl.uniform1i(shaderGrassProgram.samplerUniform, 0);

        gl.uniform1f(shaderGrassProgram.bendFactorUniform, flowerBendFactor[flowerType]);

        if (batchFlower[flowerType] == true) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flowerBatchedVertexIndicesBuffer[flowerType]);

            mat4.translate(mvSceneMatrix, mvSceneMatrix, flowerTranslation[flowerType]);

            var normalMatrix = mat3.create();
            mat3.normalFromMat4(normalMatrix, mvSceneMatrix);

            gl.uniformMatrix4fv(shaderGrassProgram.mvMatrixUniform, false, mvSceneMatrix);
            gl.uniformMatrix3fv(shaderGrassProgram.nMatrixUniform, false, normalMatrix);

            for (var i = 0; i < 4; i++) {
                gl.bindBuffer(gl.ARRAY_BUFFER, flowerBatchedVertexPositionBuffer[flowerType][i]);
                gl.vertexAttribPointer(shaderGrassProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
                gl.vertexAttribPointer(shaderGrassProgram.vertexNormalAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 3 * 4);
                gl.vertexAttribPointer(shaderGrassProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

                gl.drawElements(gl.TRIANGLES, flowerBatchedVertexIndicesBuffer[flowerType].numItems, gl.UNSIGNED_SHORT, 0);
            }
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, flowerVertexPositionBuffer);
            gl.vertexAttribPointer(shaderGrassProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
            gl.vertexAttribPointer(shaderGrassProgram.vertexNormalAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 3 * 4);
            gl.vertexAttribPointer(shaderGrassProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flowerVertexIndicesBuffer);

            mat4.translate(mvSceneMatrix, mvSceneMatrix, flowerTranslation[flowerType]);

            var numOfFlower = Math.floor((terrainSize - 2) / flowerDensity[flowerType]);
            var xReturn = flowerDensity[flowerType] * numOfFlower;

            for (var i = 0; i < numOfFlower; i++) {
                for (var j = 0; j < numOfFlower ; j++) {
                    mvPushMatrix();
                    var positionX = (flowerDensity[flowerType] * j) + randomTranslations[randomNumber] * 5.0;
                    var positionZ = (flowerDensity[flowerType] * i) + randomTranslations[randomNumber + 1] * 5.0;
                    mat4.translate(mvSceneMatrix,
                                   mvSceneMatrix,
                                   [ positionX,
                                     getPixelAvg(terrainData, positionX, positionZ) / 255.0 * terrainHeight,
                                     -positionZ ]);
                    mat4.scale(mvSceneMatrix, mvSceneMatrix, [1.0, randomTranslations[randomNumber] + 0.5, 1.0]);
                    randomNumber += 2;
                    var normalMatrix = mat3.create();
                    mat3.normalFromMat4(normalMatrix, mvSceneMatrix);

                    gl.uniformMatrix4fv(shaderGrassProgram.mvMatrixUniform, false, mvSceneMatrix);
                    gl.uniformMatrix3fv(shaderGrassProgram.nMatrixUniform, false, normalMatrix);

                    gl.drawElements(gl.TRIANGLES, flowerVertexIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
                    mvPopMatrix();
                }
                randomNumber += 2;
            }
        }
    }


    gl.disable(gl.BLEND);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disableVertexAttribArray(shaderGrassProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(shaderGrassProgram.vertexNormalAttribute);
    gl.disableVertexAttribArray(shaderGrassProgram.textureCoordAttribute);
}

function drawTree() {
    gl.useProgram(shaderTreeProgram);
    setLightingUniforms(shaderTreeProgram);

    gl.uniformMatrix4fv(shaderTreeProgram.camMatrixUniform, false, camSceneMatrix);
    gl.uniformMatrix4fv(shaderTreeProgram.shadowCamMatrixUniform, false, camShadowMatrix);

    gl.uniform1i(shaderTreeProgram.useShadowsUniform, shadows);
    gl.uniform1i(shaderTreeProgram.useSoftShadowsUniform, softShadows);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
    gl.uniform1i(shaderTreeProgram.shadowSamplerUniform, 1);

    gl.enableVertexAttribArray(shaderTreeProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderTreeProgram.vertexNormalAttribute);
    gl.enableVertexAttribArray(shaderTreeProgram.textureCoordAttribute);

    for (var i = 0; i < numberOfTrees; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, treeVertexPositionBuffer[i]);
        gl.vertexAttribPointer(shaderTreeProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
        gl.vertexAttribPointer(shaderTreeProgram.vertexNormalAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 3 * 4);
        gl.vertexAttribPointer(shaderTreeProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, treeTextures[i]);
        gl.uniform1i(shaderTreeProgram.samplerUniform, 0);

        mat4.identity(mvSceneMatrix);
        var translateY = getPixel(terrainData, treeXPos[i], -treeZPos[i]).a;
        mat4.translate(mvSceneMatrix, mvSceneMatrix, [treeXPos[i], translateY / 255.0 * terrainHeight, treeZPos[i]]);
        mat4.rotateY(mvSceneMatrix, mvSceneMatrix, degToRad(i * 180));
        mat4.scale(mvSceneMatrix, mvSceneMatrix, treeScale[i]);

        var normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, mvSceneMatrix);

        gl.uniformMatrix4fv(shaderTreeProgram.mvMatrixUniform, false, mvSceneMatrix);
        gl.uniformMatrix3fv(shaderTreeProgram.nMatrixUniform, false, normalMatrix);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, treeIndicesBuffer[i]);
        gl.drawElements(gl.TRIANGLES, treeIndicesBuffer[i].numItems, gl.UNSIGNED_SHORT, 0);        
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disableVertexAttribArray(shaderTreeProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(shaderTreeProgram.vertexNormalAttribute);
    gl.disableVertexAttribArray(shaderTreeProgram.textureCoordAttribute);
}

function drawSkybox() {
    gl.useProgram(shaderSkyboxProgram);

    gl.uniformMatrix4fv(shaderSkyboxProgram.pMatrixUniform, false, pSceneMatrix);
    gl.uniformMatrix4fv(shaderSkyboxProgram.camMatrixUniform, false, camSceneMatrix);

    gl.enableVertexAttribArray(shaderSkyboxProgram.vertexPositionAttribute);

    mat4.identity(mvSceneMatrix);
    mat4.translate(mvSceneMatrix, mvSceneMatrix, [camXPos, camYPos, camZPos]);

    gl.uniformMatrix4fv(shaderSkyboxProgram.mvMatrixUniform, false, mvSceneMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxVertexPositionBuffer);
    gl.vertexAttribPointer(shaderSkyboxProgram.vertexPositionAttribute, skyboxVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
    gl.uniform1i(shaderSkyboxProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyboxVertexIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, skyboxVertexIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    gl.disableVertexAttribArray(shaderSkyboxProgram.vertexPositionAttribute);
}

function drawSceneFramebuffer() {
    var textureToDraw = sceneTexture;
    if (depthOfField) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, blurHorizontalSceneFramebuffer);
        gl.useProgram(shaderHorizontalBlurDOFProgram);

        gl.viewport(0, 0, screenWidth, screenHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexPositionBuffer);
        gl.vertexAttribPointer(shaderHorizontalBlurDOFProgram.vertexPositionAttribute, sceneVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(shaderHorizontalBlurDOFProgram.vertexPositionAttribute);

        gl.uniform1i(shaderHorizontalBlurDOFProgram.useDOFUniform, depthOfField);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
        gl.uniform1i(shaderHorizontalBlurDOFProgram.samplerUniform, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, dofTexture);
        gl.uniform1i(shaderHorizontalBlurDOFProgram.depthSamplerUniform, 1);

        gl.drawArrays(gl.TRIANGLES, 0, sceneVertexPositionBuffer.numItems);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.disableVertexAttribArray(shaderHorizontalBlurDOFProgram.vertexPositionAttribute);

        textureToDraw = blurHorizontalSceneTexture;

        gl.bindFramebuffer(gl.FRAMEBUFFER, blurVerticalSceneFramebuffer);
        gl.useProgram(shaderVerticalBlurDOFProgram);

        gl.viewport(0, 0, screenWidth, screenHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexPositionBuffer);
        gl.vertexAttribPointer(shaderVerticalBlurDOFProgram.vertexPositionAttribute, sceneVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(shaderVerticalBlurDOFProgram.vertexPositionAttribute);

        gl.uniform1i(shaderVerticalBlurDOFProgram.useDOFUniform, depthOfField);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureToDraw);
        gl.uniform1i(shaderVerticalBlurDOFProgram.samplerUniform, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, dofTexture);
        gl.uniform1i(shaderVerticalBlurDOFProgram.depthSamplerUniform, 1);

        gl.drawArrays(gl.TRIANGLES, 0, sceneVertexPositionBuffer.numItems);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.disableVertexAttribArray(shaderVerticalBlurDOFProgram.vertexPositionAttribute);

        textureToDraw = blurVerticalSceneTexture;
    }


    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(shaderRadialBlurProgram);

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexPositionBuffer);
    gl.vertexAttribPointer(shaderRadialBlurProgram.vertexPositionAttribute, sceneVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(shaderRadialBlurProgram.vertexPositionAttribute);

    gl.uniform1i(shaderRadialBlurProgram.useRadialUniform, radialBlur);
    gl.uniform1f(shaderRadialBlurProgram.speedUniform, speed);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureToDraw);
    gl.uniform1i(shaderRadialBlurProgram.samplerUniform, 0);

    gl.drawArrays(gl.TRIANGLES, 0, sceneVertexPositionBuffer.numItems);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disableVertexAttribArray(shaderRadialBlurProgram.vertexPositionAttribute);
}