function initGL(canvas) {
    var gl;
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }

    return gl;
}

function getShader(gl, id) {
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

var shaderGrassProgram;
var shaderGroundProgram;
var shaderTreeProgram;
var shaderSkyboxProgram;
var shaderRainProgram;
var shaderShadowProgram;
var shaderDofProgram;
var shaderHorizontalBlurDOFProgram;
var shaderVerticalBlurDOFProgram;
var shaderRadialBlurProgram;

var vertexTextureUnits;

function initShaders() {
    mat4.perspective(pSceneMatrix, 45, screenWidth / screenHeight, 0.1, 200.0);
    
    vertexTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    
    var fragmentShader = getShader(gl, "fragGrass");
    var vertexShaderID = "vertGrass";
    if (vertexTextureUnits == 0) {
        vertexShaderID = "vertGrassNoSampler";
        wind = false;
        document.getElementById("wind").disabled = true;
    }
    var vertexShader = getShader(gl, vertexShaderID);

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

    gl.uniformMatrix4fv(shaderGrassProgram.pMatrixUniform, false, pSceneMatrix);
    gl.uniform2f(shaderGrassProgram.shadowMapResolutionUniform, 1.0 / (screenWidth * shadowMapQuality), 1.0 / (screenHeight * shadowMapQuality));

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    
//----------------------------------------------------

    fragmentShader = getShader(gl, "fragGround");
    vertexShader = getShader(gl, "vertGround");

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

    gl.uniformMatrix4fv(shaderGroundProgram.pMatrixUniform, false, pSceneMatrix);
    gl.uniform2f(shaderGroundProgram.shadowMapResolutionUniform, 1.0 / (screenWidth * shadowMapQuality), 1.0 / (screenHeight * shadowMapQuality));

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    fragmentShader = getShader(gl, "fragTree");
    vertexShaderID = "vertTree";
    if (vertexTextureUnits == 0) {
        vertexShaderID = "vertTreeNoSampler";
    }
    vertexShader = getShader(gl, vertexShaderID);

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

    gl.uniformMatrix4fv(shaderTreeProgram.pMatrixUniform, false, pSceneMatrix);
    gl.uniform2f(shaderTreeProgram.shadowMapResolutionUniform, 1.0 / (screenWidth * shadowMapQuality), 1.0 / (screenHeight * shadowMapQuality));

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    fragmentShader = getShader(gl, "fragSkybox");
    vertexShader = getShader(gl, "vertSkybox");

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

    gl.uniformMatrix4fv(shaderSkyboxProgram.pMatrixUniform, false, pSceneMatrix);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    fragmentShader = getShader(gl, "fragRain");
    vertexShader = getShader(gl, "vertRain");

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

    gl.uniformMatrix4fv(shaderRainProgram.pMatrixUniform, false, pSceneMatrix);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    fragmentShader = getShader(gl, "fragShadow");
    vertexShader = getShader(gl, "vertShadow");

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

    fragmentShader = getShader(gl, "fragDof");
    vertexShader = getShader(gl, "vertDof");

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

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    fragmentShader = getShader(gl, "fragHorizontalBlurDOF");
    vertexShader = getShader(gl, "vertBlur");

    shaderHorizontalBlurDOFProgram = gl.createProgram();
    gl.attachShader(shaderHorizontalBlurDOFProgram, vertexShader);
    gl.attachShader(shaderHorizontalBlurDOFProgram, fragmentShader);
    gl.linkProgram(shaderHorizontalBlurDOFProgram);

    if (!gl.getProgramParameter(shaderHorizontalBlurDOFProgram, gl.LINK_STATUS)) {
        alert("Horizontal blur: Could not initialise shaders");
    }

    gl.useProgram(shaderHorizontalBlurDOFProgram);

    shaderHorizontalBlurDOFProgram.vertexPositionAttribute = gl.getAttribLocation(shaderHorizontalBlurDOFProgram, "aVertexPosition");

    shaderHorizontalBlurDOFProgram.useDOFUniform = gl.getUniformLocation(shaderHorizontalBlurDOFProgram, "uUseDOF");
    shaderHorizontalBlurDOFProgram.samplerUniform = gl.getUniformLocation(shaderHorizontalBlurDOFProgram, "uSampler");
    shaderHorizontalBlurDOFProgram.depthSamplerUniform = gl.getUniformLocation(shaderHorizontalBlurDOFProgram, "uDepthSampler");

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    fragmentShader = getShader(gl, "fragVerticalBlurDOF");
    vertexShader = getShader(gl, "vertBlur");

    shaderVerticalBlurDOFProgram = gl.createProgram();
    gl.attachShader(shaderVerticalBlurDOFProgram, vertexShader);
    gl.attachShader(shaderVerticalBlurDOFProgram, fragmentShader);
    gl.linkProgram(shaderVerticalBlurDOFProgram);

    if (!gl.getProgramParameter(shaderVerticalBlurDOFProgram, gl.LINK_STATUS)) {
        alert("Veritcal blur: Could not initialise shaders");
    }

    gl.useProgram(shaderVerticalBlurDOFProgram);

    shaderVerticalBlurDOFProgram.vertexPositionAttribute = gl.getAttribLocation(shaderVerticalBlurDOFProgram, "aVertexPosition");

    shaderVerticalBlurDOFProgram.useDOFUniform = gl.getUniformLocation(shaderVerticalBlurDOFProgram, "uUseDOF");
    shaderVerticalBlurDOFProgram.samplerUniform = gl.getUniformLocation(shaderVerticalBlurDOFProgram, "uSampler");
    shaderVerticalBlurDOFProgram.depthSamplerUniform = gl.getUniformLocation(shaderVerticalBlurDOFProgram, "uDepthSampler");

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

//----------------------------------------------------

    fragmentShader = getShader(gl, "fragRadialBlur");
    vertexShader = getShader(gl, "vertBlur");

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
    shaderRadialBlurProgram.useRadialUniform = gl.getUniformLocation(shaderRadialBlurProgram, "uUseRadial");

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
}

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

function attachTextureToFBO(fbo, texture, textureWidth, textureHeight, color) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, color, textureWidth, textureHeight, 0, color, gl.UNSIGNED_BYTE, null);

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, textureWidth, textureHeight);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    checkFramebuffer(fbo);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function initFramebuffers() {
    sceneFramebuffer = gl.createFramebuffer();
    sceneTexture = gl.createTexture();
    attachTextureToFBO(sceneFramebuffer, sceneTexture, screenWidth, screenHeight, gl.RGBA);

    shadowFramebuffer = gl.createFramebuffer();
    shadowTexture = gl.createTexture();
    attachTextureToFBO(shadowFramebuffer, shadowTexture, screenWidth * shadowMapQuality, screenHeight * shadowMapQuality, gl.RGB);

    dofFramebuffer = gl.createFramebuffer();
    dofTexture = gl.createTexture();
    attachTextureToFBO(dofFramebuffer, dofTexture, screenWidth * DOFQuality, screenHeight * DOFQuality, gl.RGB);

    blurHorizontalSceneFramebuffer = gl.createFramebuffer();
    blurHorizontalSceneTexture = gl.createTexture();
    attachTextureToFBO(blurHorizontalSceneFramebuffer, blurHorizontalSceneTexture, screenWidth, screenHeight, gl.RGBA);

    blurVerticalSceneFramebuffer = gl.createFramebuffer();
    blurVerticalSceneTexture = gl.createTexture();
    attachTextureToFBO(blurVerticalSceneFramebuffer, blurVerticalSceneTexture, screenWidth, screenHeight, gl.RGBA);
}

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

function loadCubeMap(texture, faces) {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    for (var i = 0; i < faces.length; i++) {
        var face = faces[i][1];
        var image = new Image();
        image.onload = function(texture, face, image) {
            return function() {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            }
        } (texture, face, image);
        image.src = faces[i][0];
    }
}

var grassTexture;

var flowerTypes = 2;
var flowerTextures = [];

var groundTextures = [];

var treeTextures = [];

var skyboxTexture;

var bumpMapTexture;

var windTextures = [];

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
    for (var i = 0; i < numberOfTrees; i++) {
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

    var skyboxFaces = [["assets/posx.png", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
                       ["assets/negx.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
                       ["assets/posy.png", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
                       ["assets/negy.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
                       ["assets/posz.png", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
                       ["assets/negz.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]];
    skyboxTexture = gl.createTexture();
    loadCubeMap(skyboxTexture, skyboxFaces);
}

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

    seed = 1;
    for (var i = 0; i < 40000; i++) {
        randomTranslations[i] = randomFloat(0.0, 1.0);
    }

    initTree();
    if (rain) {
        resetRain();
    }
}

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

var treeVertexPositionBuffer = [];
var treeIndicesBuffer = [];

function initTree() {
    for (var i = 0; i < numberOfTrees; i++) {
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

function countGrayedSkybox() {
    grayed = rainDensity / 20000.0;
    if (grayed > 1.0) {
        grayed = 1.0;
    }
}

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

function updateRain() {
    for (var i = 1; i < rainVertices.length; i += 6) {
        rainVertices[i] -= 5.0;
        rainVertices[i + 3] -= 5.0;
        if (rainVertices[i] < getPixel(terrainData, Math.floor(rainVertices[i-1]), Math.floor(-rainVertices[i+1])).a / 255.0 * terrainHeight) {
            resetDrop(i - 1);
        }
    }
}

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
