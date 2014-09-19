//Benchmark settings

var camRotateVertical = 0.0;
var camRotateHorizontal = 55.0;
var camXPos = 5.0;
var camYPos = 20.0;
var camZPos = -15.0;
var camHeight = 1.0;
var moveMode = 4;

var shadowRotateVertical = 37.0;
var shadowRotateHorizontal = 35.0;
var shadowXPos = 10.0;
var shadowYPos = 55.0;
var shadowZPos = 40.0;

var terrainHeight = 20.0;

var batchGrass = true;
var grassBendFactor = 0.75;
var grassDensity = 10.0;

var batchFlower  = [true, true];
var flowerBendFactor = [0.5, 0.4];
var flowerDensity = [10.0, 10.0];

var numberOfTrees = 0;
var treeScale = [0.25, 0.2, 0.25, 0.27, 0.25, 0.22];
var treeXPos = [45.0, 20.0, 80.0, 30.0, 40.0, 90.0];
var treeZPos = [-30.0, -60.0, -60.0, -90.0, -95.0, -10.0];
var treeBendFactor = [10.0, 10.0, 10.0, 10.0, 10.0, 10.0];

var wind = false;

var rain = false;
var rainDensity = 10000;
var rainDropsWidth = 3.0;
var grayed = 0.0;
var skybox = true;

var radialBlur = false;

var DOFQuality = 1.0;
var depthOfField = false;
var dofSettings = [0.1, 0.3, 0.5];

var shadowMapQuality = 0.5;
var shadows = false;
var softShadows = false;

var lighting = false;
var lightLocation = [10.0, 30.0, 20.0];
var pointLightColor = [0.8, 0.8, 0.8];
var ambientColor = [0.4, 0.4, 0.4];

function countSceneCameraMatrix() {
    mat4.identity(camSceneMatrix);
    mat4.rotateX(camSceneMatrix, camSceneMatrix, degToRad(camRotateVertical));
    mat4.rotateY(camSceneMatrix, camSceneMatrix, degToRad(camRotateHorizontal));
    mat4.translate(camSceneMatrix, camSceneMatrix, [-camXPos, -camYPos, -camZPos]);
}

function setLightingUniforms(currentProgram) {
    gl.uniform1i(currentProgram.useLightingUniform, lighting);
    if (lighting) {
        gl.uniform3f(
            currentProgram.ambientColorUniform,
            ambientColor[0],
            ambientColor[1],
            ambientColor[2]
        );

        gl.uniform3f(
            currentProgram.pointLightLocationUniform,
            lightLocation[0],
            lightLocation[1],
            lightLocation[2]
        );

        gl.uniform3f(
            currentProgram.pointLightColorUniform,
            pointLightColor[0],
            pointLightColor[1],
            pointLightColor[2]
        );
    }
}

function setDepthOfFieldUniforms() {
    gl.uniform3f(
        shaderDofProgram.DOFSettingsUniform,
        dofSettings[0],
        dofSettings[1],
        dofSettings[2]
    );
}

var mvSceneMatrix = mat4.create();      /**< Model view matrix */
var pSceneMatrix = mat4.create();       /**< Perspective matrix */
var camSceneMatrix = mat4.create();     /**< Eye camera matrix */
var camShadowMatrix = mat4.create();    /**< Shadow samera camera matrix */
var mvpMatrix = mat4.create();          /**< Model view perspective matrix */

/**
    Draws scene to store Z values in texture
*/
function drawShadows() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer);
    gl.useProgram(shaderShadowProgram);
    gl.viewport(0, 0, screenWidth * shadowMapQuality, screenHeight * shadowMapQuality);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform1f(shaderShadowProgram.timeUniform, totalTime);

    gl.enableVertexAttribArray(shaderShadowProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderShadowProgram.textureCoordAttribute);

    //Ground
    mat4.identity(mvSceneMatrix);
    /**
        Count model view perspective matrix
    */
    mat4.mul(mvpMatrix, camShadowMatrix, mvSceneMatrix);
    mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
    gl.uniformMatrix4fv(shaderShadowProgram.mvpMatrixUniform, false, mvpMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, groundTextures[0]);
    gl.uniform1i(shaderShadowProgram.samplerGroundAUniform, 0);

    gl.uniform1i(shaderShadowProgram.moveElementUniform, false);
    gl.uniform1f(shaderShadowProgram.bendFactorUniform, 0.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainVertexPositionBuffer);
    gl.vertexAttribPointer(shaderShadowProgram.vertexPositionAttribute, terrainVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainTextureCoordsBuffer);
    gl.vertexAttribPointer(shaderShadowProgram.textureCoordAttribute, terrainTextureCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, terrainIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    //Grass
    mat4.identity(mvSceneMatrix);

    mat4.mul(mvpMatrix, camShadowMatrix, mvSceneMatrix);
    mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
    gl.uniformMatrix4fv(shaderShadowProgram.mvpMatrixUniform, false, mvpMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, grassTexture);
    gl.uniform1i(shaderShadowProgram.samplerUniform, 0);

    gl.uniform1i(shaderShadowProgram.moveElementUniform, wind);
    gl.uniform1f(shaderShadowProgram.bendFactorUniform, grassBendFactor);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassBatchedIndicesBuffer);
    /**
        Draw 4 grass clusters of size 64x64 on 128x128 terrain
    */
    for (var i = 0; i < 4; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, grassBatchedVertexPositionBuffer[i]);
        gl.vertexAttribPointer(shaderShadowProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
        gl.vertexAttribPointer(shaderShadowProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

        gl.drawElements(gl.TRIANGLES, grassBatchedIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    //Flower
    /**
        Draw 2 flower types
    */
    for (var flowerType = 0; flowerType < flowerTypes; flowerType++) {
        mat4.identity(mvSceneMatrix);

        mat4.mul(mvpMatrix, camShadowMatrix, mvSceneMatrix);
        mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
        gl.uniformMatrix4fv(shaderShadowProgram.mvpMatrixUniform, false, mvpMatrix);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, flowerTextures[flowerType]);
        gl.uniform1i(shaderShadowProgram.samplerUniform, 0);

        gl.uniform1i(shaderShadowProgram.moveElementUniform, wind);
        gl.uniform1f(shaderShadowProgram.bendFactorUniform, flowerBendFactor[flowerType]);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flowerBatchedIndicesBuffer[flowerType]);
        /**
            Draw 4 flowers clusters of size 64x64 on 128x128 terrain
        */
        for (var i = 0; i < 4; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, flowerBatchedVertexPositionBuffer[flowerType][i]);
            gl.vertexAttribPointer(shaderShadowProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
            gl.vertexAttribPointer(shaderShadowProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

            gl.drawElements(gl.TRIANGLES, flowerBatchedIndicesBuffer[flowerType].numItems, gl.UNSIGNED_SHORT, 0);
        }     
    }

    //Tree
    gl.uniform1i(shaderShadowProgram.moveElementUniform, wind);

    for (var i = 0; i < numberOfTrees; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, treeVertexPositionBuffer[i]);
        gl.vertexAttribPointer(shaderShadowProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
        gl.vertexAttribPointer(shaderShadowProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, treeTextures[i]);
        gl.uniform1i(shaderShadowProgram.samplerUniform, 0);
        /**
            Translate the tree to desired position
            X, Z from position array; Y get from terrain data 
        */
        mat4.identity(mvSceneMatrix);
        var translateY = getPixel(terrainData, treeXPos[i], -treeZPos[i]).a;
        mat4.translate(mvSceneMatrix, mvSceneMatrix, [treeXPos[i], translateY / 255.0 * terrainHeight, treeZPos[i]]);
        mat4.scale(mvSceneMatrix, mvSceneMatrix, [treeScale[i], treeScale[i], treeScale[i]]);

        mat4.mul(mvpMatrix, camShadowMatrix, mvSceneMatrix);
        mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
        gl.uniformMatrix4fv(shaderShadowProgram.mvpMatrixUniform, false, mvpMatrix);

        gl.uniform1f(shaderShadowProgram.bendFactorUniform, treeBendFactor[i]);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, treeIndicesBuffer[i]);
        gl.drawElements(gl.TRIANGLES, treeIndicesBuffer[i].numItems, gl.UNSIGNED_SHORT, 0);        
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disableVertexAttribArray(shaderShadowProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(shaderShadowProgram.textureCoordAttribute);
}

/**
    Draws scene to store desired blur level values
*/
function drawDOF() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dofFramebuffer);
    gl.useProgram(shaderDofProgram);
    gl.viewport(0, 0, screenWidth * DOFQuality, screenHeight * DOFQuality);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform1f(shaderDofProgram.timeUniform, totalTime);

    gl.enableVertexAttribArray(shaderDofProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderDofProgram.textureCoordAttribute);

    //Ground
    mat4.identity(mvSceneMatrix);
    /**
        Count model view perspective matrix
    */
    mat4.mul(mvpMatrix, camSceneMatrix, mvSceneMatrix);
    mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
    gl.uniformMatrix4fv(shaderDofProgram.mvpMatrixUniform, false, mvpMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, groundTextures[0]);
    gl.uniform1i(shaderDofProgram.samplerUniform, 0);

    gl.uniform1i(shaderDofProgram.moveElementUniform, false);
    gl.uniform1f(shaderDofProgram.bendFactorUniform, 0.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainVertexPositionBuffer);
    gl.vertexAttribPointer(shaderDofProgram.vertexPositionAttribute, terrainVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainTextureCoordsBuffer);
    gl.vertexAttribPointer(shaderDofProgram.textureCoordAttribute, terrainTextureCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, terrainIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    //Grass
    mat4.identity(mvSceneMatrix);

    mat4.mul(mvpMatrix, camSceneMatrix, mvSceneMatrix);
    mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
    gl.uniformMatrix4fv(shaderDofProgram.mvpMatrixUniform, false, mvpMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, grassTexture);
    gl.uniform1i(shaderDofProgram.samplerUniform, 0);

    gl.uniform1i(shaderDofProgram.moveElementUniform, wind);
    gl.uniform1f(shaderDofProgram.bendFactorUniform, grassBendFactor);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassBatchedIndicesBuffer);
    /**
        Draw 4 grass clusters of size 64x64 on 128x128 terrain
    */
    for (var i = 0; i < 4; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, grassBatchedVertexPositionBuffer[i]);
        gl.vertexAttribPointer(shaderDofProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
        gl.vertexAttribPointer(shaderDofProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

        gl.drawElements(gl.TRIANGLES, grassBatchedIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    //Flower
    /**
        Draw 2 flower types
    */
    for (var flowerType = 0; flowerType < flowerTypes; flowerType++) {
        mat4.identity(mvSceneMatrix);

        mat4.mul(mvpMatrix, camSceneMatrix, mvSceneMatrix);
        mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
        gl.uniformMatrix4fv(shaderDofProgram.mvpMatrixUniform, false, mvpMatrix);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, flowerTextures[flowerType]);
        gl.uniform1i(shaderDofProgram.samplerUniform, 0);

        gl.uniform1i(shaderDofProgram.moveElementUniform, wind);
        gl.uniform1f(shaderDofProgram.bendFactorUniform, flowerBendFactor[flowerType]);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flowerBatchedIndicesBuffer[flowerType]);
        /**
            Draw 4 flowers clusters of size 64x64 on 128x128 terrain
        */
        for (var i = 0; i < 4; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, flowerBatchedVertexPositionBuffer[flowerType][i]);
            gl.vertexAttribPointer(shaderDofProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
            gl.vertexAttribPointer(shaderDofProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);
            gl.drawElements(gl.TRIANGLES, flowerBatchedIndicesBuffer[flowerType].numItems, gl.UNSIGNED_SHORT, 0);
        }        
    }

    //Tree
    gl.uniform1i(shaderDofProgram.moveElementUniform, wind);

    for (var i = 0; i < numberOfTrees; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, treeVertexPositionBuffer[i]);
        gl.vertexAttribPointer(shaderDofProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
        gl.vertexAttribPointer(shaderDofProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, treeTextures[i]);
        gl.uniform1i(shaderDofProgram.samplerUniform, 0);
        /**
            Translate the tree to desired position
            X, Z from position array; Y get from terrain data 
        */
        mat4.identity(mvSceneMatrix);
        var translateY = getPixel(terrainData, treeXPos[i], -treeZPos[i]).a;
        mat4.translate(mvSceneMatrix, mvSceneMatrix, [treeXPos[i], translateY / 255.0 * terrainHeight, treeZPos[i]]);
        mat4.scale(mvSceneMatrix, mvSceneMatrix, [treeScale[i], treeScale[i], treeScale[i]]);

        mat4.mul(mvpMatrix, camSceneMatrix, mvSceneMatrix);
        mat4.mul(mvpMatrix, pSceneMatrix, mvpMatrix);
        gl.uniformMatrix4fv(shaderDofProgram.mvpMatrixUniform, false, mvpMatrix);

        gl.uniform1f(shaderDofProgram.bendFactorUniform, treeBendFactor[i]);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, treeIndicesBuffer[i]);
        gl.drawElements(gl.TRIANGLES, treeIndicesBuffer[i].numItems, gl.UNSIGNED_SHORT, 0);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disableVertexAttribArray(shaderDofProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(shaderDofProgram.textureCoordAttribute);
}

/**
    Draws scene in color
*/
function drawScene() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFramebuffer);
    gl.viewport(0, 0, screenWidth, screenHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawGround();
    drawGrass();
    drawTree();

    if (skybox) {
        drawSkybox();
    }

    if (rain) {
        drawRain();
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, copyTexture);
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, screenWidth, screenHeight, 0);
}

/**
    Draws ground in color
*/
function drawGround() {
    gl.useProgram(shaderGroundProgram);

    gl.uniformMatrix4fv(shaderGroundProgram.camMatrixUniform, false, camSceneMatrix);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
    gl.uniform1i(shaderGroundProgram.shadowSamplerUniform, 2);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, bumpMapTexture);
    gl.uniform1i(shaderGroundProgram.normalMapSamplerUniform, 3);

    mat4.identity(mvSceneMatrix);
    gl.uniformMatrix4fv(shaderGroundProgram.mvMatrixUniform, false, mvSceneMatrix);

    gl.enableVertexAttribArray(shaderGroundProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderGroundProgram.textureCoordAttribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainVertexPositionBuffer);
    gl.vertexAttribPointer(shaderGroundProgram.vertexPositionAttribute, terrainVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

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
    gl.disableVertexAttribArray(shaderGroundProgram.textureCoordAttribute);
}

/**
    Draws grass and flowers in color
*/
function drawGrass() {
    gl.useProgram(shaderGrassProgram);

    gl.uniformMatrix4fv(shaderGrassProgram.camMatrixUniform, false, camSceneMatrix);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
    gl.uniform1i(shaderGrassProgram.shadowSamplerUniform, 1);
    /**
        Don't set uniforms if wind is not available
    */
    if (vertexTextureUnits != 0) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, windTextures[0]);
        gl.uniform1i(shaderGrassProgram.windXSamplerUniform, 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, windTextures[1]);
        gl.uniform1i(shaderGrassProgram.windZSamplerUniform, 3);
        
        gl.uniform1f(shaderGrassProgram.timeUniform, windTextureMove);
    }

    gl.enableVertexAttribArray(shaderGrassProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderGrassProgram.vertexNormalAttribute);
    gl.enableVertexAttribArray(shaderGrassProgram.textureCoordAttribute);

    var randomNumber = 0;

    //Grass
    mat4.identity(mvSceneMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, grassTexture);
    gl.uniform1i(shaderGrassProgram.samplerUniform, 0);

    if (vertexTextureUnits != 0) {
        gl.uniform1f(shaderGrassProgram.bendFactorUniform, grassBendFactor);
    }

    if (batchGrass == true) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassBatchedIndicesBuffer);

        var normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, mvSceneMatrix);

        gl.uniformMatrix4fv(shaderGrassProgram.mvMatrixUniform, false, mvSceneMatrix);
        gl.uniformMatrix3fv(shaderGrassProgram.nMatrixUniform, false, normalMatrix);

        for (var i = 0; i < 4; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, grassBatchedVertexPositionBuffer[i]);
            gl.vertexAttribPointer(shaderGrassProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
            gl.vertexAttribPointer(shaderGrassProgram.vertexNormalAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 3 * 4);
            gl.vertexAttribPointer(shaderGrassProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

            gl.drawElements(gl.TRIANGLES, grassBatchedIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, grassVertexPositionBuffer);
        gl.vertexAttribPointer(shaderGrassProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
        gl.vertexAttribPointer(shaderGrassProgram.vertexNormalAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 3 * 4);
        gl.vertexAttribPointer(shaderGrassProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassIndicesBuffer);

        var numOfGrass = Math.floor((terrainSize - 2) / grassDensity);
        /**
            Count position of each grass object and draw it
        */
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

                gl.drawElements(gl.TRIANGLES, grassIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
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
    
        if (vertexTextureUnits != 0) {
            gl.uniform1f(shaderGrassProgram.bendFactorUniform, flowerBendFactor[flowerType]);
        }

        if (batchFlower[flowerType] == true) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flowerBatchedIndicesBuffer[flowerType]);

            var normalMatrix = mat3.create();
            mat3.normalFromMat4(normalMatrix, mvSceneMatrix);

            gl.uniformMatrix4fv(shaderGrassProgram.mvMatrixUniform, false, mvSceneMatrix);
            gl.uniformMatrix3fv(shaderGrassProgram.nMatrixUniform, false, normalMatrix);

            for (var i = 0; i < 4; i++) {
                gl.bindBuffer(gl.ARRAY_BUFFER, flowerBatchedVertexPositionBuffer[flowerType][i]);
                gl.vertexAttribPointer(shaderGrassProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
                gl.vertexAttribPointer(shaderGrassProgram.vertexNormalAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 3 * 4);
                gl.vertexAttribPointer(shaderGrassProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

                gl.drawElements(gl.TRIANGLES, flowerBatchedIndicesBuffer[flowerType].numItems, gl.UNSIGNED_SHORT, 0);
            }
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, flowerVertexPositionBuffer);
            gl.vertexAttribPointer(shaderGrassProgram.vertexPositionAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
            gl.vertexAttribPointer(shaderGrassProgram.vertexNormalAttribute, 3, gl.FLOAT, gl.FALSE, 8 * 4, 3 * 4);
            gl.vertexAttribPointer(shaderGrassProgram.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flowerIndicesBuffer);

            var numOfFlower = Math.floor((terrainSize - 2) / flowerDensity[flowerType]);
            /**
                Count position of each flower and draw it
            */
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

                    gl.drawElements(gl.TRIANGLES, flowerIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);
                    mvPopMatrix();
                }
                randomNumber += 2;
            }
        }
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (vertexTextureUnits != 0) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    gl.disableVertexAttribArray(shaderGrassProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(shaderGrassProgram.vertexNormalAttribute);
    gl.disableVertexAttribArray(shaderGrassProgram.textureCoordAttribute);
}

/**
    Draws trees in color
*/
function drawTree() {
    gl.useProgram(shaderTreeProgram);

    gl.uniformMatrix4fv(shaderTreeProgram.camMatrixUniform, false, camSceneMatrix);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
    gl.uniform1i(shaderTreeProgram.shadowSamplerUniform, 1);
    
    if (vertexTextureUnits != 0) {   
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, windTextures[0]);
        gl.uniform1i(shaderTreeProgram.windXSamplerUniform, 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, windTextures[1]);
        gl.uniform1i(shaderTreeProgram.windZSamplerUniform, 3);
        
        gl.uniform1f(shaderTreeProgram.timeUniform, windTextureMove);
    }

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
        /**
            Translate the tree to desired position
            X, Z from position array; Y get from terrain data 
        */
        mat4.identity(mvSceneMatrix);
        var translateY = getPixel(terrainData, treeXPos[i], -treeZPos[i]).a;
        mat4.translate(mvSceneMatrix, mvSceneMatrix, [treeXPos[i], translateY / 255.0 * terrainHeight, treeZPos[i]]);
        mat4.scale(mvSceneMatrix, mvSceneMatrix, [treeScale[i], treeScale[i], treeScale[i]]);

        var normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, mvSceneMatrix);

        gl.uniformMatrix4fv(shaderTreeProgram.mvMatrixUniform, false, mvSceneMatrix);
        gl.uniformMatrix3fv(shaderTreeProgram.nMatrixUniform, false, normalMatrix);
        
        if (vertexTextureUnits != 0) {
            gl.uniform1f(shaderTreeProgram.bendFactorUniform, treeBendFactor[i]);
            gl.uniform2f(shaderTreeProgram.treeCenterUniform, treeXPos[i], treeZPos[i]);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, treeIndicesBuffer[i]);
        gl.drawElements(gl.TRIANGLES, treeIndicesBuffer[i].numItems, gl.UNSIGNED_SHORT, 0);     
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (vertexTextureUnits != 0) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    gl.disableVertexAttribArray(shaderTreeProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(shaderTreeProgram.vertexNormalAttribute);
    gl.disableVertexAttribArray(shaderTreeProgram.textureCoordAttribute);
}

/**
    Draws skybox in color
*/
function drawSkybox() {
    gl.useProgram(shaderSkyboxProgram);

    gl.uniformMatrix4fv(shaderSkyboxProgram.camMatrixUniform, false, camSceneMatrix);

    gl.enableVertexAttribArray(shaderSkyboxProgram.vertexPositionAttribute);
    /**
        Move skybox to eye camera position
        Skybox looks the same from each point on the scene
    */
    mat4.identity(mvSceneMatrix);
    mat4.translate(mvSceneMatrix, mvSceneMatrix, [camXPos, camYPos, camZPos]);

    gl.uniformMatrix4fv(shaderSkyboxProgram.mvMatrixUniform, false, mvSceneMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxVertexPositionBuffer);
    gl.vertexAttribPointer(shaderSkyboxProgram.vertexPositionAttribute, skyboxVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
    gl.uniform1i(shaderSkyboxProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyboxIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, skyboxIndicesBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    gl.disableVertexAttribArray(shaderSkyboxProgram.vertexPositionAttribute);
}

/**
    Draws rain in color
*/
function drawRain() {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(shaderRainProgram);

    gl.uniformMatrix4fv(shaderRainProgram.camMatrixUniform, false, camSceneMatrix);

    gl.enableVertexAttribArray(shaderRainProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderRainProgram.alphaAttribute);

    mat4.identity(mvSceneMatrix);

    gl.uniformMatrix4fv(shaderRainProgram.mvMatrixUniform, false, mvSceneMatrix);
    /**
        Count new drops positions
    */
    updateRain();
    /**
        Buffer data with gl.DYNAMIC_DRAW because it changes every frame
    */
    gl.bindBuffer(gl.ARRAY_BUFFER, rainVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rainVertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(shaderRainProgram.vertexPositionAttribute, rainVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, rainAlphaBuffer);
    gl.vertexAttribPointer(shaderRainProgram.alphaAttribute, rainAlphaBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINES, 0, rainVertices.length / 3);

    gl.disableVertexAttribArray(shaderRainProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(shaderRainProgram.alphaAttribute);

    gl.disable(gl.BLEND);
}

/**
    Draws scene rendered in previous passes onscreen
    Adds postprocessing effects
*/
function drawSceneFramebuffer() {
    /**
        Scene is always drawn fullscreen so there is no need for depth test
    */
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    var textureToDraw = sceneTexture;
    if (depthOfField) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, blurHorizontalSceneFramebuffer);
        gl.useProgram(shaderHorizontalBlurDOFProgram);
        gl.viewport(0, 0, screenWidth, screenHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexPositionBuffer);
        gl.vertexAttribPointer(shaderHorizontalBlurDOFProgram.vertexPositionAttribute, sceneVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(shaderHorizontalBlurDOFProgram.vertexPositionAttribute);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureToDraw);
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
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexPositionBuffer);
        gl.vertexAttribPointer(shaderVerticalBlurDOFProgram.vertexPositionAttribute, sceneVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(shaderVerticalBlurDOFProgram.vertexPositionAttribute);

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

    if (radialBlur) {
        gl.uniform1f(shaderRadialBlurProgram.speedUniform, speed);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureToDraw);
    gl.uniform1i(shaderRadialBlurProgram.samplerUniform, 0);

    gl.drawArrays(gl.TRIANGLES, 0, sceneVertexPositionBuffer.numItems);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disableVertexAttribArray(shaderRadialBlurProgram.vertexPositionAttribute);

    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
}
