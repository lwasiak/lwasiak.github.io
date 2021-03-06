/**
    Get webGL context from canvas
    @param canvas    HTML canvas element
*/
function initGL(canvas) {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    if (!gl) {
        alert("Could not initialise WebGL");
    }
}

/**
    Gets shader text and compile it.

    @param id    Shader ID
    @return      Compiled shader.
*/
function getShader(id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

/**
    Shader programs variables
*/
var shaderGrassProgram;
var shaderGroundProgram;
var shaderTreeProgram;
var shaderSkyboxProgram;
var shaderRainProgram;
var shaderGlassProgram;
var shaderShadowProgram;
var shaderDofProgram;
var shaderHorizontalBlurDOFProgram;
var shaderVerticalBlurDOFProgram;
var shaderMotionBlurProgram;
var shaderRadialBlurProgram;
var shaderScreenProgram;

var vertexTextureUnits;

function initShaders() {
    /**
        Count perspective matrices
    */
    mat4.perspective(pSceneMatrix, degToRad(45.0), screenWidth / screenHeight, 0.1, 200.0);
    mat4.perspective(pEnvMapMatrix, degToRad(90.0), 1.0, 0.1, 200.0);

    /**
        Count shadow camera matrix
    */
    mat4.identity(camShadowMatrix);
    mat4.rotateX(camShadowMatrix, camShadowMatrix, degToRad(shadowRotateVertical));
    mat4.rotateY(camShadowMatrix, camShadowMatrix, degToRad(shadowRotateHorizontal));
    mat4.translate(camShadowMatrix, camShadowMatrix, [-shadowXPos, -shadowYPos, -shadowZPos]);

    if(rain) {
        countGrayedSkybox();
    }
    
    /**
        Get number of available vertex texture samplers units.
        If vertex texture samplers are not available permanently turns off wind effect.
    */
    vertexTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    
    var vertexShaderID = "vertGrass";
    if (vertexTextureUnits == 0) {
        vertexShaderID = "vertGrassNoSampler";
        wind = false;
        document.getElementById("wind").disabled = true;
    }
    var vertexShader = getShader(vertexShaderID);
    var fragmentShader = getShader("fragGrass");

    /**
        Create program and get all attributes and uniforms locations
    */
    shaderGrassProgram = gl.createProgram();
    gl.attachShader(shaderGrassProgram, vertexShader);
    gl.attachShader(shaderGrassProgram, fragmentShader);
    gl.linkProgram(shaderGrassProgram);

    if (!gl.getProgramParameter(shaderGrassProgram, gl.LINK_STATUS)) {
        alert("Grass: Could not initialise shaders");
    }

    gl.useProgram(shaderGrassProgram);

    shaderGrassProgram.vertexPositionAttribute = gl.getAttribLocation(shaderGrassProgram, "aVertexPosition");
    shaderGrassProgram.vertexNormalAttribute = gl.getAttribLocation(shaderGrassProgram, "aVertexNormal");
    shaderGrassProgram.textureCoordAttribute = gl.getAttribLocation(shaderGrassProgram, "aTextureCoord");

    shaderGrassProgram.pMatrixUniform = gl.getUniformLocation(shaderGrassProgram, "uPMatrix");
    shaderGrassProgram.mvMatrixUniform = gl.getUniformLocation(shaderGrassProgram, "uMVMatrix");
    shaderGrassProgram.camMatrixUniform = gl.getUniformLocation(shaderGrassProgram, "uCamMatrix");
    shaderGrassProgram.shadowCamMatrixUniform = gl.getUniformLocation(shaderGrassProgram, "uShadowCamMatrix");
    shaderGrassProgram.nMatrixUniform = gl.getUniformLocation(shaderGrassProgram, "uNMatrix");
    shaderGrassProgram.samplerUniform = gl.getUniformLocation(shaderGrassProgram, "uSampler");
    shaderGrassProgram.shadowSamplerUniform = gl.getUniformLocation(shaderGrassProgram, "uShadowSampler");
    shaderGrassProgram.useShadowsUniform = gl.getUniformLocation(shaderGrassProgram, "uUseShadows");
    shaderGrassProgram.useSoftShadowsUniform = gl.getUniformLocation(shaderGrassProgram, "uUseSoftShadows");
    shaderGrassProgram.shadowMapResolutionUniform = gl.getUniformLocation(shaderGrassProgram, "uShadowMapResolution");
    shaderGrassProgram.useLightingUniform = gl.getUniformLocation(shaderGrassProgram, "uUseLighting");
    shaderGrassProgram.ambientColorUniform = gl.getUniformLocation(shaderGrassProgram, "uAmbientColor");
    shaderGrassProgram.pointLightLocationUniform = gl.getUniformLocation(shaderGrassProgram, "uPointLightLocation");
    shaderGrassProgram.pointLightColorUniform = gl.getUniformLocation(shaderGrassProgram, "uPointLightColor");
    shaderGrassProgram.rainDensityUniform = gl.getUniformLocation(shaderGrassProgram, "uRainDensity");
    if (vertexTextureUnits != 0) {
        shaderGrassProgram.useWindUniform = gl.getUniformLocation(shaderGrassProgram, "uUseWind");
        shaderGrassProgram.windXSamplerUniform = gl.getUniformLocation(shaderGrassProgram, "uWindXSampler");
        shaderGrassProgram.windZSamplerUniform = gl.getUniformLocation(shaderGrassProgram, "uWindZSampler");
        shaderGrassProgram.timeUniform = gl.getUniformLocation(shaderGrassProgram, "uTime");
        shaderGrassProgram.bendFactorUniform = gl.getUniformLocation(shaderGrassProgram, "uBendFactor");
    }

    /**
        Sets uniforms which won't change during render loop
    */
    gl.uniformMatrix4fv(shaderGrassProgram.shadowCamMatrixUniform, false, camShadowMatrix);
    gl.uniform1i(shaderGrassProgram.useSoftShadowsUniform, softShadows);
    gl.uniform2f(shaderGrassProgram.shadowMapResolutionUniform, 1.0 / (screenWidth * shadowMapQuality), 1.0 / (screenHeight * shadowMapQuality));
    setLightingUniforms(shaderGrassProgram);
    gl.uniform1f(shaderGrassProgram.rainDensityUniform, grayed);
    gl.uniform1f(shaderGrassProgram.useWindUniform, wind);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    
//----------------------------------------------------

    vertexShader = getShader("vertGround");
    fragmentShader = getShader("fragGround");

    shaderGroundProgram = gl.createProgram();
    gl.attachShader(shaderGroundProgram, vertexShader);
    gl.attachShader(shaderGroundProgram, fragmentShader);
    gl.linkProgram(shaderGroundProgram);

    if (!gl.getProgramParameter(shaderGroundProgram, gl.LINK_STATUS)) {
        alert("Ground: Could not initialise shaders");
    }

    gl.useProgram(shaderGroundProgram);

    shaderGroundProgram.vertexPositionAttribute = gl.getAttribLocation(shaderGroundProgram, "aVertexPosition");
    shaderGroundProgram.textureCoordAttribute = gl.getAttribLocation(shaderGroundProgram, "aTextureCoord");

    shaderGroundProgram.pMatrixUniform = gl.getUniformLocation(shaderGroundProgram, "uPMatrix");
    shaderGroundProgram.mvMatrixUniform = gl.getUniformLocation(shaderGroundProgram, "uMVMatrix");
    shaderGroundProgram.camMatrixUniform = gl.getUniformLocation(shaderGroundProgram, "uCamMatrix");
    shaderGroundProgram.shadowCamMatrixUniform = gl.getUniformLocation(shaderGroundProgram, "uShadowCamMatrix");
    shaderGroundProgram.samplerGroundAUniform = gl.getUniformLocation(shaderGroundProgram, "uGroundASampler");
    shaderGroundProgram.samplerGroundBUniform = gl.getUniformLocation(shaderGroundProgram, "uGroundBSampler");
    shaderGroundProgram.shadowSamplerUniform = gl.getUniformLocation(shaderGroundProgram, "uShadowSampler");
    shaderGroundProgram.normalMapSamplerUniform = gl.getUniformLocation(shaderGroundProgram, "uNormalMapSampler");
    shaderGroundProgram.useShadowsUniform = gl.getUniformLocation(shaderGroundProgram, "uUseShadows");
    shaderGroundProgram.useSoftShadowsUniform = gl.getUniformLocation(shaderGroundProgram, "uUseSoftShadows");
    shaderGroundProgram.shadowMapResolutionUniform = gl.getUniformLocation(shaderGroundProgram, "uShadowMapResolution");
    shaderGroundProgram.useLightingUniform = gl.getUniformLocation(shaderGroundProgram, "uUseLighting");
    shaderGroundProgram.ambientColorUniform = gl.getUniformLocation(shaderGroundProgram, "uAmbientColor");
    shaderGroundProgram.pointLightLocationUniform = gl.getUniformLocation(shaderGroundProgram, "uPointLightLocation");
    shaderGroundProgram.pointLightColorUniform = gl.getUniformLocation(shaderGroundProgram, "uPointLightColor");
    shaderGroundProgram.rainDensityUniform = gl.getUniformLocation(shaderGroundProgram, "uRainDensity");

    gl.uniformMatrix4fv(shaderGroundProgram.shadowCamMatrixUniform, false, camShadowMatrix);
    gl.uniform1i(shaderGroundProgram.useSoftShadowsUniform, softShadows);
    gl.uniform2f(shaderGroundProgram.shadowMapResolutionUniform, 1.0 / (screenWidth * shadowMapQuality), 1.0 / (screenHeight * shadowMapQuality));
    setLightingUniforms(shaderGroundProgram);
    gl.uniform1f(shaderGroundProgram.rainDensityUniform, grayed);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    vertexShaderID = "vertTree";
    if (vertexTextureUnits == 0) {
        vertexShaderID = "vertTreeNoSampler";
    }
    vertexShader = getShader(vertexShaderID);
    fragmentShader = getShader("fragTree");

    shaderTreeProgram = gl.createProgram();
    gl.attachShader(shaderTreeProgram, vertexShader);
    gl.attachShader(shaderTreeProgram, fragmentShader);
    gl.linkProgram(shaderTreeProgram);

    if (!gl.getProgramParameter(shaderTreeProgram, gl.LINK_STATUS)) {
        alert("Tree: Could not initialise shaders");
    }

    gl.useProgram(shaderTreeProgram);

    shaderTreeProgram.vertexPositionAttribute = gl.getAttribLocation(shaderTreeProgram, "aVertexPosition");
    shaderTreeProgram.vertexNormalAttribute = gl.getAttribLocation(shaderTreeProgram, "aVertexNormal");
    shaderTreeProgram.textureCoordAttribute = gl.getAttribLocation(shaderTreeProgram, "aTextureCoord");

    shaderTreeProgram.pMatrixUniform = gl.getUniformLocation(shaderTreeProgram, "uPMatrix");
    shaderTreeProgram.mvMatrixUniform = gl.getUniformLocation(shaderTreeProgram, "uMVMatrix");
    shaderTreeProgram.camMatrixUniform = gl.getUniformLocation(shaderTreeProgram, "uCamMatrix");
    shaderTreeProgram.shadowCamMatrixUniform = gl.getUniformLocation(shaderTreeProgram, "uShadowCamMatrix");
    shaderTreeProgram.nMatrixUniform = gl.getUniformLocation(shaderTreeProgram, "uNMatrix");
    shaderTreeProgram.samplerUniform = gl.getUniformLocation(shaderTreeProgram, "uSampler");
    shaderTreeProgram.shadowSamplerUniform = gl.getUniformLocation(shaderTreeProgram, "uShadowSampler");
    shaderTreeProgram.useShadowsUniform = gl.getUniformLocation(shaderTreeProgram, "uUseShadows");
    shaderTreeProgram.useSoftShadowsUniform = gl.getUniformLocation(shaderTreeProgram, "uUseSoftShadows");
    shaderTreeProgram.shadowMapResolutionUniform = gl.getUniformLocation(shaderTreeProgram, "uShadowMapResolution");
    shaderTreeProgram.useLightingUniform = gl.getUniformLocation(shaderTreeProgram, "uUseLighting");
    shaderTreeProgram.ambientColorUniform = gl.getUniformLocation(shaderTreeProgram, "uAmbientColor");
    shaderTreeProgram.pointLightLocationUniform = gl.getUniformLocation(shaderTreeProgram, "uPointLightLocation");
    shaderTreeProgram.pointLightColorUniform = gl.getUniformLocation(shaderTreeProgram, "uPointLightColor");
    shaderTreeProgram.rainDensityUniform = gl.getUniformLocation(shaderTreeProgram, "uRainDensity");
    if (vertexTextureUnits != 0) {
        shaderTreeProgram.useWindUniform = gl.getUniformLocation(shaderTreeProgram, "uUseWind");
        shaderTreeProgram.treeCenterUniform = gl.getUniformLocation(shaderTreeProgram, "uTreeCenter");
        shaderTreeProgram.windXSamplerUniform = gl.getUniformLocation(shaderTreeProgram, "uWindXSampler");
        shaderTreeProgram.windZSamplerUniform = gl.getUniformLocation(shaderTreeProgram, "uWindZSampler");
        shaderTreeProgram.timeUniform = gl.getUniformLocation(shaderTreeProgram, "uTime");
        shaderTreeProgram.bendFactorUniform = gl.getUniformLocation(shaderTreeProgram, "uBendFactor");
    }

    gl.uniformMatrix4fv(shaderTreeProgram.shadowCamMatrixUniform, false, camShadowMatrix);
    gl.uniform1i(shaderTreeProgram.useSoftShadowsUniform, softShadows);
    gl.uniform2f(shaderTreeProgram.shadowMapResolutionUniform, 1.0 / (screenWidth * shadowMapQuality), 1.0 / (screenHeight * shadowMapQuality));
    setLightingUniforms(shaderTreeProgram);
    gl.uniform1f(shaderTreeProgram.rainDensityUniform, grayed);
    gl.uniform1f(shaderTreeProgram.useWindUniform, wind);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    vertexShader = getShader("vertSkybox");
    fragmentShader = getShader("fragSkybox");

    shaderSkyboxProgram = gl.createProgram();
    gl.attachShader(shaderSkyboxProgram, vertexShader);
    gl.attachShader(shaderSkyboxProgram, fragmentShader);
    gl.linkProgram(shaderSkyboxProgram);

    if (!gl.getProgramParameter(shaderSkyboxProgram, gl.LINK_STATUS)) {
        alert("Skybox: Could not initialise shaders");
    }

    gl.useProgram(shaderSkyboxProgram);

    shaderSkyboxProgram.vertexPositionAttribute = gl.getAttribLocation(shaderSkyboxProgram, "aVertexPosition");

    shaderSkyboxProgram.pMatrixUniform = gl.getUniformLocation(shaderSkyboxProgram, "uPMatrix");
    shaderSkyboxProgram.mvMatrixUniform = gl.getUniformLocation(shaderSkyboxProgram, "uMVMatrix");
    shaderSkyboxProgram.camMatrixUniform = gl.getUniformLocation(shaderSkyboxProgram, "uCamMatrix");
    shaderSkyboxProgram.samplerUniform = gl.getUniformLocation(shaderSkyboxProgram, "uSampler");
    shaderSkyboxProgram.rainDensityUniform = gl.getUniformLocation(shaderSkyboxProgram, "uRainDensity");

    gl.uniform1f(shaderSkyboxProgram.rainDensityUniform, grayed);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    vertexShader = getShader("vertRain");
    fragmentShader = getShader("fragRain");

    shaderRainProgram = gl.createProgram();
    gl.attachShader(shaderRainProgram, vertexShader);
    gl.attachShader(shaderRainProgram, fragmentShader);
    gl.linkProgram(shaderRainProgram);

    if (!gl.getProgramParameter(shaderRainProgram, gl.LINK_STATUS)) {
        alert("Rain: Could not initialise shaders");
    }

    gl.useProgram(shaderRainProgram);

    shaderRainProgram.vertexPositionAttribute = gl.getAttribLocation(shaderRainProgram, "aVertexPosition");
    shaderRainProgram.alphaAttribute = gl.getAttribLocation(shaderRainProgram, "aAlpha");

    shaderRainProgram.pMatrixUniform = gl.getUniformLocation(shaderRainProgram, "uPMatrix");
    shaderRainProgram.mvMatrixUniform = gl.getUniformLocation(shaderRainProgram, "uMVMatrix");
    shaderRainProgram.camMatrixUniform = gl.getUniformLocation(shaderRainProgram, "uCamMatrix");

    gl.lineWidth(rainDropsWidth);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    vertexShader = getShader("vertGlass");
    fragmentShader = getShader("fragGlass");

    shaderGlassProgram = gl.createProgram();
    gl.attachShader(shaderGlassProgram, vertexShader);
    gl.attachShader(shaderGlassProgram, fragmentShader);
    gl.linkProgram(shaderGlassProgram);

    if (!gl.getProgramParameter(shaderGlassProgram, gl.LINK_STATUS)) {
        alert("Glass: Could not initialise shaders");
    }

    gl.useProgram(shaderGlassProgram);

    shaderGlassProgram.vertexPositionAttribute = gl.getAttribLocation(shaderGlassProgram, "aVertexPosition");
    shaderGlassProgram.vertexNormalAttribute = gl.getAttribLocation(shaderGlassProgram, "aVertexNormal");

    shaderGlassProgram.pMatrixUniform = gl.getUniformLocation(shaderGlassProgram, "uPMatrix");
    shaderGlassProgram.mvMatrixUniform = gl.getUniformLocation(shaderGlassProgram, "uMVMatrix");
    shaderGlassProgram.camMatrixUniform = gl.getUniformLocation(shaderGlassProgram, "uCamMatrix");
    shaderGlassProgram.nMatrixUniform = gl.getUniformLocation(shaderGlassProgram, "uNMatrix");
    shaderGlassProgram.cameraPositionUniform = gl.getUniformLocation(shaderGlassProgram, "uCameraPosition");
    shaderGlassProgram.samplerUniform = gl.getUniformLocation(shaderGlassProgram, "uSampler");

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    vertexShader = getShader("vertShadow");
    fragmentShader = getShader("fragShadow");

    shaderShadowProgram = gl.createProgram();
    gl.attachShader(shaderShadowProgram, vertexShader);
    gl.attachShader(shaderShadowProgram, fragmentShader);
    gl.linkProgram(shaderShadowProgram);

    if (!gl.getProgramParameter(shaderShadowProgram, gl.LINK_STATUS)) {
        alert("Shadow: Could not initialise shaders");
    }

    gl.useProgram(shaderShadowProgram);

    shaderShadowProgram.vertexPositionAttribute = gl.getAttribLocation(shaderShadowProgram, "aVertexPosition");
    shaderShadowProgram.textureCoordAttribute = gl.getAttribLocation(shaderShadowProgram, "aTextureCoord");

    shaderShadowProgram.mvpMatrixUniform = gl.getUniformLocation(shaderShadowProgram, "uMVPMatrix");
    shaderShadowProgram.samplerUniform = gl.getUniformLocation(shaderShadowProgram, "uSampler");
    shaderShadowProgram.timeUniform = gl.getUniformLocation(shaderShadowProgram, "uTime");
    shaderShadowProgram.bendFactorUniform = gl.getUniformLocation(shaderShadowProgram, "uBendFactor");
    shaderShadowProgram.moveElementUniform = gl.getUniformLocation(shaderShadowProgram, "uMoveElement");

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    vertexShader = getShader("vertDof");
    fragmentShader = getShader("fragDof");

    shaderDofProgram = gl.createProgram();
    gl.attachShader(shaderDofProgram, vertexShader);
    gl.attachShader(shaderDofProgram, fragmentShader);
    gl.linkProgram(shaderDofProgram);

    if (!gl.getProgramParameter(shaderDofProgram, gl.LINK_STATUS)) {
        alert("DOF: Could not initialise shaders");
    }

    gl.useProgram(shaderDofProgram);

    shaderDofProgram.vertexPositionAttribute = gl.getAttribLocation(shaderDofProgram, "aVertexPosition");
    shaderDofProgram.textureCoordAttribute = gl.getAttribLocation(shaderDofProgram, "aTextureCoord");

    shaderDofProgram.mvpMatrixUniform = gl.getUniformLocation(shaderDofProgram, "uMVPMatrix");
    shaderDofProgram.samplerUniform = gl.getUniformLocation(shaderDofProgram, "uSampler");
    shaderDofProgram.DOFSettingsUniform = gl.getUniformLocation(shaderDofProgram, "uDoFSettings");
    shaderDofProgram.timeUniform = gl.getUniformLocation(shaderDofProgram, "uTime");
    shaderDofProgram.bendFactorUniform = gl.getUniformLocation(shaderDofProgram, "uBendFactor");
    shaderDofProgram.moveElementUniform = gl.getUniformLocation(shaderDofProgram, "uMoveElement");

    setDepthOfFieldUniforms();

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    vertexShader = getShader("vertBlur");
    fragmentShader = getShader("fragHorizontalBlurDOF");

    shaderHorizontalBlurDOFProgram = gl.createProgram();
    gl.attachShader(shaderHorizontalBlurDOFProgram, vertexShader);
    gl.attachShader(shaderHorizontalBlurDOFProgram, fragmentShader);
    gl.linkProgram(shaderHorizontalBlurDOFProgram);

    if (!gl.getProgramParameter(shaderHorizontalBlurDOFProgram, gl.LINK_STATUS)) {
        alert("Horizontal blur: Could not initialise shaders");
    }

    gl.useProgram(shaderHorizontalBlurDOFProgram);

    shaderHorizontalBlurDOFProgram.vertexPositionAttribute = gl.getAttribLocation(shaderHorizontalBlurDOFProgram, "aVertexPosition");

    shaderHorizontalBlurDOFProgram.samplerUniform = gl.getUniformLocation(shaderHorizontalBlurDOFProgram, "uSampler");
    shaderHorizontalBlurDOFProgram.depthSamplerUniform = gl.getUniformLocation(shaderHorizontalBlurDOFProgram, "uDepthSampler");

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    vertexShader = getShader("vertBlur");
    fragmentShader = getShader("fragVerticalBlurDOF");

    shaderVerticalBlurDOFProgram = gl.createProgram();
    gl.attachShader(shaderVerticalBlurDOFProgram, vertexShader);
    gl.attachShader(shaderVerticalBlurDOFProgram, fragmentShader);
    gl.linkProgram(shaderVerticalBlurDOFProgram);

    if (!gl.getProgramParameter(shaderVerticalBlurDOFProgram, gl.LINK_STATUS)) {
        alert("Veritcal blur: Could not initialise shaders");
    }

    gl.useProgram(shaderVerticalBlurDOFProgram);

    shaderVerticalBlurDOFProgram.vertexPositionAttribute = gl.getAttribLocation(shaderVerticalBlurDOFProgram, "aVertexPosition");

    shaderVerticalBlurDOFProgram.samplerUniform = gl.getUniformLocation(shaderVerticalBlurDOFProgram, "uSampler");
    shaderVerticalBlurDOFProgram.depthSamplerUniform = gl.getUniformLocation(shaderVerticalBlurDOFProgram, "uDepthSampler");

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    vertexShader = getShader("vertBlur");
    fragmentShader = getShader("fragMotionBlur");

    shaderMotionBlurProgram = gl.createProgram();
    gl.attachShader(shaderMotionBlurProgram, vertexShader);
    gl.attachShader(shaderMotionBlurProgram, fragmentShader);
    gl.linkProgram(shaderMotionBlurProgram);

    if (!gl.getProgramParameter(shaderMotionBlurProgram, gl.LINK_STATUS)) {
        alert("Motion blur: Could not initialise shaders");
    }

    gl.useProgram(shaderMotionBlurProgram);

    shaderMotionBlurProgram.vertexPositionAttribute = gl.getAttribLocation(shaderMotionBlurProgram, "aVertexPosition");

    shaderMotionBlurProgram.samplerUniform = gl.getUniformLocation(shaderMotionBlurProgram, "uSampler");
    shaderMotionBlurProgram.copyTextureSamplerAUniform = gl.getUniformLocation(shaderMotionBlurProgram, "uCopyTextureSamplerA");
    shaderMotionBlurProgram.copyTextureSamplerBUniform = gl.getUniformLocation(shaderMotionBlurProgram, "uCopyTextureSamplerB");
    shaderMotionBlurProgram.copyTextureSamplerCUniform = gl.getUniformLocation(shaderMotionBlurProgram, "uCopyTextureSamplerC");
    shaderMotionBlurProgram.copyTextureSamplerDUniform = gl.getUniformLocation(shaderMotionBlurProgram, "uCopyTextureSamplerD");
    shaderMotionBlurProgram.copyTextureSamplerEUniform = gl.getUniformLocation(shaderMotionBlurProgram, "uCopyTextureSamplerE");

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------
    
    vertexShader = getShader("vertBlur");
    fragmentShader = getShader("fragRadialBlur");
    
    shaderRadialBlurProgram = gl.createProgram();
    gl.attachShader(shaderRadialBlurProgram, vertexShader);
    gl.attachShader(shaderRadialBlurProgram, fragmentShader);
    gl.linkProgram(shaderRadialBlurProgram);

    if (!gl.getProgramParameter(shaderRadialBlurProgram, gl.LINK_STATUS)) {
        alert("Radial blur: Could not initialise shaders");
    }

    gl.useProgram(shaderRadialBlurProgram);

    shaderRadialBlurProgram.vertexPositionAttribute = gl.getAttribLocation(shaderRadialBlurProgram, "aVertexPosition");

    shaderRadialBlurProgram.samplerUniform = gl.getUniformLocation(shaderRadialBlurProgram, "uSampler");
    shaderRadialBlurProgram.speedUniform = gl.getUniformLocation(shaderRadialBlurProgram, "uSpeed");

    gl.uniform1f(shaderRadialBlurProgram.speedUniform, speed);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    //----------------------------------------------------

    vertexShader = getShader("vertScreen");
    fragmentShader = getShader("fragScreen");

    shaderScreenProgram = gl.createProgram();
    gl.attachShader(shaderScreenProgram, vertexShader);
    gl.attachShader(shaderScreenProgram, fragmentShader);
    gl.linkProgram(shaderScreenProgram);

    if (!gl.getProgramParameter(shaderScreenProgram, gl.LINK_STATUS)) {
        alert("Screen: Could not initialise shaders");
    }

    gl.useProgram(shaderScreenProgram);

    shaderScreenProgram.vertexPositionAttribute = gl.getAttribLocation(shaderScreenProgram, "aVertexPosition");

    shaderScreenProgram.samplerUniform = gl.getUniformLocation(shaderScreenProgram, "uSampler");

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
}

/**
    Offscreen FBO variables
*/
var sceneFramebuffer;
var sceneTexture;

var shadowFramebuffer;
var shadowTexture;

var dofFramebuffer;
var dofTexture;

var blurHorizontalSceneFramebuffer;
var blurHorizontalSceneTexture;

var blurVerticalSceneFramebuffer;
var blurVerticalSceneTexture;

var motionBlurFramebuffer;
var motionBlurTexture;

var radialBlurFramebuffer;
var radialBlurTexture;

var environmentFramebuffer;
var environmentTexture;

/**
    Checks if FBO is correctly created

    @param id    FBO variable 
*/
function checkFramebuffer(id) {
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    switch (status) {
        case gl.FRAMEBUFFER_COMPLETE:
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            alert(id + ": FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            alert(id + ": FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            alert(id + ": FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
            break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
            alert(id + ": FRAMEBUFFER_UNSUPPORTED");
            break;
        default:
            alert(id + ": Incomplete framebuffer: " + status);
            break;
    }
}

/**
    Sets color and depth attachment for FBO

    @param fbo              FBO variable 
    @param texture          Texture variable
    @param textureTarget    TEXTURE_2D or TEXTURE_CUBE_MAP
    @param useDepthbuffer   True if framebuffer is drawing with DEPTH_TEST enabled
*/
function attachTextureToFBO(fbo, texture, textureTarget, textureWidth, textureHeight, useDepthbuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(textureTarget, texture);
    gl.texParameteri(textureTarget, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(textureTarget, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(textureTarget, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(textureTarget, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    switch(textureTarget)
    {
        case gl.TEXTURE_2D:
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureWidth, textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            break;
        case gl.TEXTURE_CUBE_MAP:
            for (var i = 0; i < 6; i++) {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, textureWidth, textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            }
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X, texture, 0);
            break;
        default:
            return;
    }

    if (useDepthbuffer) {
        var renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, textureWidth, textureHeight);

        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    }

    checkFramebuffer(fbo);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(textureTarget, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

/**
    Initializes FBOs with proper texture and size
*/
function initFramebuffers() {
    sceneFramebuffer = gl.createFramebuffer();
    sceneTexture = gl.createTexture();
    attachTextureToFBO(sceneFramebuffer, sceneTexture, gl.TEXTURE_2D, screenWidth, screenHeight, true);

    shadowFramebuffer = gl.createFramebuffer();
    shadowTexture = gl.createTexture();
    attachTextureToFBO(shadowFramebuffer, shadowTexture, gl.TEXTURE_2D, screenWidth * shadowMapQuality, screenHeight * shadowMapQuality, true);

    dofFramebuffer = gl.createFramebuffer();
    dofTexture = gl.createTexture();
    attachTextureToFBO(dofFramebuffer, dofTexture, gl.TEXTURE_2D, screenWidth * DOFQuality, screenHeight * DOFQuality, true);

    blurHorizontalSceneFramebuffer = gl.createFramebuffer();
    blurHorizontalSceneTexture = gl.createTexture();
    attachTextureToFBO(blurHorizontalSceneFramebuffer, blurHorizontalSceneTexture, gl.TEXTURE_2D, screenWidth, screenHeight, false);

    blurVerticalSceneFramebuffer = gl.createFramebuffer();
    blurVerticalSceneTexture = gl.createTexture();
    attachTextureToFBO(blurVerticalSceneFramebuffer, blurVerticalSceneTexture, gl.TEXTURE_2D, screenWidth, screenHeight, false);

    motionBlurFramebuffer = gl.createFramebuffer();
    motionBlurTexture = gl.createTexture();
    attachTextureToFBO(motionBlurFramebuffer, motionBlurTexture, gl.TEXTURE_2D, screenWidth, screenHeight, false);

    radialBlurFramebuffer = gl.createFramebuffer();
    radialBlurTexture = gl.createTexture();
    attachTextureToFBO(radialBlurFramebuffer, radialBlurTexture, gl.TEXTURE_2D, screenWidth, screenHeight, false);

    environmentFramebuffer = gl.createFramebuffer();
    environmentTexture = gl.createTexture();
    attachTextureToFBO(environmentFramebuffer, environmentTexture, gl.TEXTURE_CUBE_MAP, sphereTextureSize, sphereTextureSize, true);
}

/**
    Initializes texture and sets it's paremeters

    @param texture       2D Texture variable 
    @param texParam      Texture wrap parameter 
*/
function handleLoadedTexture(texture, texParam) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, texParam);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, texParam);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
    Loads 6 textures and merge them into cubemap

    @param texture       Texture object
    @param faces         Textures dirs
*/
function loadCubeMap(texture, faces) {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    for (var i = 0; i < faces.length; i++) {
        var image = new Image();
        image.onload = function(texture, i, image) {
            return function() {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            }
        } (texture, i, image);
        image.src = faces[i];
    }
}

/**
    Variables to store textures
*/
var grassTexture;
var flowerTypes = 2;
var flowerTextures = [];
var groundTextures = [];
var treeTextures = [];
var skyboxTexture;
var bumpMapTexture;
var windTextures = [];
var copiedTextures = [];

/**
    Loads and creates textures from files
*/
function initTextures() {  
    grassTexture = gl.createTexture();
    grassTexture.image = new Image();
    grassTexture.image.onload = function () {
        handleLoadedTexture(grassTexture, gl.CLAMP_TO_EDGE);
    }
    grassTexture.image.src = "assets/grass.png";

    var flowerTexturesDirs = ["assets/flowerRed.png", "assets/flowerBlue.png"];
    for (var i = 0; i < flowerTypes; i++) {
        flowerTextures[i] = gl.createTexture();
        flowerTextures[i].image = new Image();
        flowerTextures[i].image.onload = function(i) {
            return function() {
                handleLoadedTexture(flowerTextures[i], gl.CLAMP_TO_EDGE);
            }
        }(i);
        flowerTextures[i].image.src = flowerTexturesDirs[i];
    }

    var groundTexturesDirs = ["assets/groundGrass.jpg", "assets/groundEarth.jpg"];
    for (var i = 0; i < groundTexturesDirs.length; i++) {
        groundTextures[i] = gl.createTexture();
        groundTextures[i].image = new Image();
        groundTextures[i].image.onload = function(i) {
            return function() {
                handleLoadedTexture(groundTextures[i], gl.REPEAT);
            }
        }(i);
        groundTextures[i].image.src = groundTexturesDirs[i];
    }

    var treeTexturesDirs = ["assets/tree4.png", "assets/tree1.png", "assets/tree2.png", "assets/tree3.png", "assets/tree5.png", "assets/tree6.png"];
    for (var i = 0; i < 6; i++) {
        treeTextures[i] = gl.createTexture();
        treeTextures[i].image = new Image();
        treeTextures[i].image.onload = function(i) {
            return function() {
                handleLoadedTexture(treeTextures[i], gl.CLAMP_TO_EDGE);
            }
        }(i);
        treeTextures[i].image.src = treeTexturesDirs[i];
    }

    bumpMapTexture = gl.createTexture();
    bumpMapTexture.image = new Image();
    bumpMapTexture.image.onload = function () {
        handleLoadedTexture(bumpMapTexture, gl.CLAMP_TO_EDGE);
    }
    bumpMapTexture.image.src = "assets/map.png";

    var windTexturesDirs = ["assets/windX.jpg", "assets/windZ.jpg"];
    for (var i = 0; i < windTexturesDirs.length; i++) {
        windTextures[i] = gl.createTexture();
        windTextures[i].image = new Image();
        windTextures[i].image.onload = function(i) {
            return function() {
                handleLoadedTexture(windTextures[i], gl.REPEAT);
            }
        }(i);
        windTextures[i].image.src = windTexturesDirs[i];
    }

    var skyboxFaces = ["assets/posx.png", "assets/negx.png", "assets/posy.png", "assets/negy.png", "assets/posz.png", "assets/negz.png"];
    skyboxTexture = gl.createTexture();
    loadCubeMap(skyboxTexture, skyboxFaces);

    for (var i = 0; i < 5; i++) {
        copiedTextures[i] = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, copiedTextures[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);     
    }
}

/**
    Objects vertices buffers variables
*/
var maxClusterSize = 64;

var grassVertexPositionBuffer;
var grassIndicesBuffer;
var grassBatchedVertexPositionBuffer = [];
var grassBatchedIndicesBuffer;

var flowerVertexPositionBuffer;
var flowerIndicesBuffer;
var flowerBatchedVertexPositionBuffer = [[]];
var flowerBatchedIndicesBuffer = [];

var skyboxVertexPositionBuffer;
var skyboxIndicesBuffer;

var rainVertexPositionBuffer;
var rainAlphaBuffer;

var sceneVertexPositionBuffer;

var randomTranslations = [];

/**
    Creates vertices buffers and initializes them with data
*/
function initBuffers() {
    grassVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, grassVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grassVertices), gl.STATIC_DRAW);
    grassVertexPositionBuffer.itemSize = 3;
    grassVertexPositionBuffer.numItems = 12;

    grassIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(grassIndices), gl.STATIC_DRAW);
    grassIndicesBuffer.itemSize = 1;
    grassIndicesBuffer.numItems = 18;

    for (var i = 0; i < 4; i++) {
        grassBatchedVertexPositionBuffer[i] = gl.createBuffer();
    }
    grassBatchedIndicesBuffer = gl.createBuffer();

    flowerVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, flowerVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flowerVertices), gl.STATIC_DRAW);
    flowerVertexPositionBuffer.itemSize = 3;
    flowerVertexPositionBuffer.numItems = 12;

    flowerIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flowerIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flowerIndices), gl.STATIC_DRAW);
    flowerIndicesBuffer.itemSize = 1;
    flowerIndicesBuffer.numItems = 18;

    for (var i = 0; i < flowerTypes; i++) {
        flowerBatchedVertexPositionBuffer[i] = [];
        for (var j = 0; j < 4; j++) {
            flowerBatchedVertexPositionBuffer[i][j] = gl.createBuffer();
        }
        flowerBatchedIndicesBuffer[i] = gl.createBuffer();
    } 

    initTerrain();

    skyboxVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skyboxVertices), gl.STATIC_DRAW);
    skyboxVertexPositionBuffer.itemSize = 3;
    skyboxVertexPositionBuffer.numItems = 24;

    skyboxIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyboxIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(skyboxIndices), gl.STATIC_DRAW);
    skyboxIndicesBuffer.itemSize = 1;
    skyboxIndicesBuffer.numItems = 36;

    rainVertexPositionBuffer = gl.createBuffer();
    rainVertexPositionBuffer.itemSize = 3;

    rainAlphaBuffer = gl.createBuffer();
    rainAlphaBuffer.itemSize = 1;

    sceneVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sceneVertices), gl.STATIC_DRAW);
    sceneVertexPositionBuffer.itemSize = 2;
    sceneVertexPositionBuffer.numItems = 6;

    /**
        Create array filled with random float numbers used for drawing
    */
    seed = 1;
    for (var i = 0; i < 100000; i++) {
        randomTranslations[i] = randomFloat(0.0, 1.0);
    }

    initTree();
    if (rain) {
        resetRain();
    }
    
    initSphere();
}

/**
    Creates array with grass cluster vertices
    @param grassClusterVertices       Output array
    @param x, z                       Position offset
    @param clusterSize                Number of grass object in row, column
*/
function countGrassClusterVertices(grassClusterVertices, x, z, clusterSize) {
    var current = 0;
    for (var i = 0; i < clusterSize; i++) {
        for (var j = 0; j < clusterSize; j++) {
            var randomX = randomFloat(0.0, grassDensity);
            var randomY = randomFloat(0.75, 1.0);
            var randomZ = randomFloat(0.0, grassDensity);
            for (var k = 0; k < 12; k++) {
                var l = k * 8;
                //Positions
                grassClusterVertices[current] = x + grassVertices[l] + (grassDensity * j) + randomX;
                grassClusterVertices[current + 2] = z + -(grassVertices[l + 2] + (grassDensity * i) + randomZ);
                grassClusterVertices[current + 1] = grassVertices[l + 1] * randomY + (getPixelAvg(terrainData, grassClusterVertices[current],
                                                                           -grassClusterVertices[current + 2]) / 255.0) * terrainHeight;

                current += 3;
                //Normals
                grassClusterVertices[current] = grassVertices[l + 3];
                current++;
                grassClusterVertices[current] = grassVertices[l + 4];
                current++;
                grassClusterVertices[current] = grassVertices[l + 5];
                current++;
                //Texture coords
                grassClusterVertices[current] = grassVertices[l + 6];
                current++;
                grassClusterVertices[current] = grassVertices[l + 7];
                current++;
            }
        }
    }
}

/**
    Creates buffers for grass cluster vertices and initializes it with data
*/
function countGrassClusterBuffers() {
    seed = 1;
    var clusterWidth = Math.floor(maxClusterSize / grassDensity);
    var clusterDepth = Math.floor(maxClusterSize / grassDensity);
    var grassInCluster = Math.floor(clusterWidth * clusterDepth);

    var grassClusterVertices;
    for (var i = 0; i < 4; i++) {
        grassClusterVertices = [];

        switch(i) {
            case 0:
                countGrassClusterVertices(grassClusterVertices, 0.0, 0.0, clusterWidth);
                break;
            case 1:
                countGrassClusterVertices(grassClusterVertices, maxClusterSize, 0.0, clusterWidth);
                break;
            case 2:
                countGrassClusterVertices(grassClusterVertices, 0.0, -maxClusterSize, clusterWidth);
                break;
            case 3:
                countGrassClusterVertices(grassClusterVertices, maxClusterSize, -maxClusterSize, clusterWidth);
                break;
            default:
                break;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, grassBatchedVertexPositionBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grassClusterVertices), gl.STATIC_DRAW);
        grassBatchedVertexPositionBuffer[i].itemSize = 3;
        grassBatchedVertexPositionBuffer[i].numItems = 12 * grassInCluster;
    }

    var grassClusterIndices = [];
    for (var i = 0; i < grassInCluster; i++) {
        for (var j = 0; j < 18; j++) {
            grassClusterIndices[i * 18 + j] = grassIndices[j] + i * 12;
        }
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassBatchedIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(grassClusterIndices), gl.STATIC_DRAW);
    grassBatchedIndicesBuffer.itemSize = 1;
    grassBatchedIndicesBuffer.numItems = 18 * grassInCluster;
}

/**
    Creates array with flower cluster vertices
    @param flowerClusterVertices      Output array
    @param x, z                       Position offset
    @param clusterSize                Number of flower object in row, column
    @param clusterSize                Distance between flower objects
*/
function countFlowerClusterVertices(flowerClusterVertices, x, z, clusterSize, flowerDensity) {
    var current = 0;
    for (var i = 0; i < clusterSize; i++) {
        for (var j = 0; j < clusterSize; j++) {
            var randomX = randomFloat(0.0, flowerDensity);
            var randomY = randomFloat(0.9, 1.0);
            var randomZ = randomFloat(0.0, flowerDensity);
            for (var k = 0; k < 12; k++) {
                var l = k * 8;
                //Positions
                flowerClusterVertices[current] = x + flowerVertices[l] + (flowerDensity * j) + randomX;
                flowerClusterVertices[current + 2] = z + -(flowerVertices[l + 2] + (flowerDensity * i) + randomZ);
                flowerClusterVertices[current + 1] = flowerVertices[l + 1] * randomY + (getPixelAvg(terrainData, flowerClusterVertices[current],
                                                                           -flowerClusterVertices[current + 2]) / 255.0) * terrainHeight;
                current += 3;
                //Normals
                flowerClusterVertices[current] = flowerVertices[l + 3];
                current++;
                flowerClusterVertices[current] = flowerVertices[l + 4];
                current++;
                flowerClusterVertices[current] = flowerVertices[l + 5];
                current++;
                //Texture coords
                flowerClusterVertices[current] = flowerVertices[l + 6];
                current++;
                flowerClusterVertices[current] = flowerVertices[l + 7];
                current++;
            }
        }
    }
}

/**
    Creates buffers for flower cluster vertices and initializes it with data

    @param flowerType      0 = red flower, 1 = blue flower
*/
function countFlowerClusterBuffers(flowerType) {
    seed = 2 * (flowerType + 5);
    var density = flowerDensity[flowerType];
    var clusterWidth = Math.floor(maxClusterSize / density);
    var clusterDepth = Math.floor(maxClusterSize / density);
    var flowerInCluster = Math.floor(clusterWidth * clusterDepth);

    var flowerClusterVertices;
    for (var i = 0; i < 4; i++) {
        flowerClusterVertices = [];

        switch(i) {
            case 0:
                countFlowerClusterVertices(flowerClusterVertices, 0.0, 0.0, clusterWidth, density);
                break;
            case 1:
                countFlowerClusterVertices(flowerClusterVertices, maxClusterSize, 0.0, clusterWidth, density);
                break;
            case 2:
                countFlowerClusterVertices(flowerClusterVertices, 0.0, -maxClusterSize, clusterWidth, density);
                break;
            case 3:
                countFlowerClusterVertices(flowerClusterVertices, maxClusterSize, -maxClusterSize, clusterWidth, density);
                break;
            default:
                break;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, flowerBatchedVertexPositionBuffer[flowerType][i]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flowerClusterVertices), gl.STATIC_DRAW);
        flowerBatchedVertexPositionBuffer[flowerType][i].itemSize = 3;
        flowerBatchedVertexPositionBuffer[flowerType][i].numItems = 12 * flowerInCluster;
    }

    var flowerClusterIndices = [];
    for (var i = 0; i < flowerInCluster; i++) {
        for (var j = 0; j < 18; j++) {
            flowerClusterIndices[i * 18 + j] = flowerIndices[j] + i * 12;
        }
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flowerBatchedIndicesBuffer[flowerType]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flowerClusterIndices), gl.STATIC_DRAW);
    flowerBatchedIndicesBuffer[flowerType].itemSize = 1;
    flowerBatchedIndicesBuffer[flowerType].numItems = 18 * flowerInCluster;
}

/**
    Initializes terrain bump map texture and terrain vertices buffers
*/
var terrainVertex = [];
var terrainTextureCoords = [];
var terrainIndices = [];

var terrainVertexPositionBuffer;
var terrainTextureCoordsBuffer;
var terrainIndicesBuffer;

var terrainSize = 128;
var terrainTextureMultipler = 10;
var terrainTexture;
var terrainData;

function initTerrain() {
    terrainTexture = gl.createTexture();
    terrainTexture.image = new Image();
    terrainTexture.image.src = "assets/map.png";
    terrainTexture.width = terrainSize;
    terrainTexture.height = terrainSize;

    terrainTexture.image.onload = function () {
        terrainData = getImageData(terrainTexture.image);

        for (var i = 0; i < terrainSize; i++) {
            for (var j = 0; j < terrainSize; j++) {
                var color = getPixel(terrainData, j, i);
                terrainVertex.push(parseFloat(j));
                terrainVertex.push((color.a / 255.0) * terrainHeight);
                terrainVertex.push(parseFloat(-i));

                terrainTextureCoords.push((j / (terrainSize - 1)) * terrainTextureMultipler);
                terrainTextureCoords.push((i / (terrainSize - 1)) * terrainTextureMultipler);
            }
        }
        for (var i = 0; i < terrainSize - 1; i++) {
            for (var j = 0; j < terrainSize - 1; j++) {
                terrainIndices.push((i * terrainSize) + j);
                terrainIndices.push((i * terrainSize) + (j + 1));
                terrainIndices.push((i * terrainSize) + (j + terrainSize));
                terrainIndices.push((i * terrainSize) + (j + 1));
                terrainIndices.push((i * terrainSize) + (j + terrainSize));
                terrainIndices.push((i * terrainSize) + (j + terrainSize + 1));
            }
        }

        terrainVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, terrainVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(terrainVertex), gl.STATIC_DRAW);
        terrainVertexPositionBuffer.itemSize = 3;
        terrainVertexPositionBuffer.numItems = terrainVertex.length;

        terrainTextureCoordsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, terrainTextureCoordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(terrainTextureCoords), gl.STATIC_DRAW);
        terrainTextureCoordsBuffer.itemSize = 2;
        terrainTextureCoordsBuffer.numItems = terrainTextureCoords.length;

        terrainIndicesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIndicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(terrainIndices), gl.STATIC_DRAW);
        terrainIndicesBuffer.itemSize = 1;
        terrainIndicesBuffer.numItems = terrainIndices.length;

        countGrassClusterBuffers();
        for (var i = 0; i < flowerTypes; i++) {
            countFlowerClusterBuffers(i);
        }
    }
}

/**
    Initializes tree buffers with data from proper arrays
*/
var treeVertexPositionBuffer = [];
var treeIndicesBuffer = [];

function initTree() {
    for (var i = 0; i < 6; i++) {
        treeVertexPositionBuffer[i] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, treeVertexPositionBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(treeVertices[i]), gl.STATIC_DRAW);
        treeVertexPositionBuffer[i].itemSize = 8;
        treeVertexPositionBuffer[i].numItems = treeVertices[i].length;

        treeIndicesBuffer[i] = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, treeIndicesBuffer[i]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(treeIndices[i]), gl.STATIC_DRAW);
        treeIndicesBuffer[i].itemSize = 1;
        treeIndicesBuffer[i].numItems = treeIndices[i].length;
    }
}

/**
    Initializes sphere buffers with calculated data
*/
var sphereVertexPositionBuffer;
var sphereIndicesBuffer;

function initSphere() {
    var latitudeBands = sphereQuality;
    var longitudeBands = sphereQuality;

    var sphereVertices = [];
    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;

            sphereVertices.push(sphereRadius * x, sphereRadius * y, sphereRadius * z, x, y, z);
        }
    }

    var sphereIncides = [];
    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            sphereIncides.push(first, second, first + 1, second, second + 1, first + 1);
        }
    }

    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereVertices), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 6;
    sphereVertexPositionBuffer.numItems = sphereVertices.length / 6;

    sphereIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereIncides), gl.STATIC_DRAW);
    sphereIndicesBuffer.itemSize = 1;
    sphereIndicesBuffer.numItems = sphereIncides.length;    
}

/**
    Initializes rain arrays 
*/
var rainVertices = [];
var rainAlphas = [];

function initRain() {
    seed = 1;
    for (var i = 0; i < rainDensity; i++) {
        var randomX = randomFloat(0.0, terrainSize);
        var randomY = randomFloat(35.0, 20.0);
        var randomZ = randomFloat(0.0, -terrainSize);
        var randomHeight = randomFloat(0.5, 2.0);
        var randomAngle = randomFloat(0.25, 0.75);

        rainVertices.push(randomX, randomY - randomHeight, randomZ, randomX + randomAngle, randomY, randomZ + randomAngle);
        rainAlphas.push(0.4, 0.25);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, rainAlphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rainAlphas), gl.STATIC_DRAW);
}

/**
    Counts skybox gray level
*/
function countGrayedSkybox() {
    grayed = rainDensity / 20000.0;
    if (grayed > 1.0) {
        grayed = 1.0;
    }
}

/**
    Places drops that hit the ground above it
*/
function resetDrop(index){
    var randomX = randomFloat(0.0, terrainSize);
    var randomY = randomFloat(35.0, 20.0);
    var randomZ = randomFloat(0.0, -terrainSize);
    var randomHeight = randomFloat(0.5, 2.0);
    var randomAngle = randomFloat(0.25, 0.75);

    rainVertices[index] = randomX;
    rainVertices[index + 1] = randomY - randomHeight;
    rainVertices[index + 2] = randomZ;
    rainVertices[index + 3] = randomX + randomAngle;
    rainVertices[index + 4] = randomY;
    rainVertices[index + 5] = randomZ + randomAngle;
}

/**
    Moves rain drops down
*/
function updateRain() {
    for (var i = 1; i < rainVertices.length; i += 6) {
        rainVertices[i] -= 5.0;
        rainVertices[i + 3] -= 5.0;
        if (rainVertices[i] < getPixel(terrainData, Math.floor(rainVertices[i-1]), Math.floor(-rainVertices[i+1])).a / 255.0 * terrainHeight) {
            resetDrop(i - 1);
        }
    }
}

/**
    Resets all rain variables and initializes them again
*/
function resetRain() {
    rainVertices = [];
    rainAlphas = [];
    if (rain) {
        initRain();
        countGrayedSkybox();
    } else {
        grayed = 0.0;
    }
}
