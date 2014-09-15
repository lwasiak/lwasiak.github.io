var seed = 1;
function randomFloat(begin, range) {
    var x = Math.cos(++seed) * 10000;
    x -= Math.floor(x);

    return (x * range + begin);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function getImageData(image) {
    var canvas = document.createElement('canvas');
    canvas.width  = image.width;
    canvas.height = image.height;

    var context = canvas.getContext('2d');
    context.drawImage( image, 0, 0 );

    return context.getImageData(0, 0, image.width, image.height);
}

var mvMatrixStack = [];

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.copy(copy, mvSceneMatrix);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        alert("Invalid popMatrix!");
    }
    mvSceneMatrix = mvMatrixStack.pop();
}

function getPixel(imageData, x, y) {
    var position = (x + imageData.width * y) * 4;
    var data = imageData.data;
    return {r: data[position],
            g: data[position + 1],
            b: data[position + 2],
            a: data[position + 3]};
}

function getPixelAvg(imageData, x, z) {
    var colorXA, colorXB;
    if (x < 0.0) {
        return getPixel(imageData, 0, Math.floor(z)).a;
    } else if (x > terrainSize - 3) {
        return getPixel(imageData, terrainSize - 1, Math.floor(z)).a;
    } else {
        colorXA = getPixel(imageData, Math.floor(x + 1.5), Math.floor(z)).a;
        colorXB = getPixel(imageData, Math.ceil(x + 1.5), Math.floor(z)).a;
        var distanceX = x - Math.floor(x);
        distanceX = 0.5 - distanceX;
        if (distanceX > 0.0) {
            colorXA *= distanceX;
            colorXB *= 1.0 - distanceX;
        } else {
            var multiplier = 1.0 - Math.abs(distanceX);
            colorXA *= multiplier;
            colorXB *= 1.0 - multiplier;
        }
    }

    var colorZA, colorZB;
    if (z < 0.0) {
        return getPixel(imageData, Math.floor(x), 0).a;
    } else if (z > terrainSize - 3) {
        return getPixel(imageData, Math.floor(x), terrainSize - 1).a;
    } else {
        colorZA = getPixel(imageData, Math.floor(x), Math.floor(z + 1.5)).a;
        colorZB = getPixel(imageData, Math.floor(x), Math.ceil(z + 1.5)).a;
        var distanceZ = z - Math.floor(z);
        distanceZ = 0.5 - distanceZ;
        if (distanceZ > 0.0) {
            colorZA *= distanceZ;
            colorZB *= 1.0 - distanceZ;
        } else {
            var multiplier = 1.0 - Math.abs(distanceZ);
            colorZA *= multiplier;
            colorZB *= 1.0 - multiplier;
        }
    }

    return (colorXA + colorXB + colorZA + colorZB) / 2.0;
}

//
// Framerate object
//
// This object keeps track of framerate and displays it as the innerHTML text of the
// HTML element with the passed id. Once created you call snapshot at the end
// of every rendering cycle. Every 500ms the framerate is updated in the HTML element.
//
Framerate = function(id)
{
    this.numFramerates = 20;
    this.framerateUpdateInterval = 500;
    this.id = id;
    this.frameTime = 0;

    this.renderTime = -1;
    this.framerates = [];
    self = this;

    var fr = function() { self.updateFramerate();  }
    setInterval(fr, this.framerateUpdateInterval);
}

Framerate.prototype.updateFramerate = function()
{
    var tot = 0;
    for (var i = 0; i < this.framerates.length; ++i)
        tot += this.framerates[i];

    var framerate = tot / this.framerates.length;
    framerate = Math.round(framerate);
    document.getElementById(this.id).innerHTML = "Framerate: " + framerate + "fps";
    document.getElementById("frameTime").innerHTML = "Frame time: " + self.frameTime + "ms";
}

Framerate.prototype.snapshot = function()
{
    if (this.renderTime < 0)
        this.renderTime = new Date().getTime();
    else {
        var newTime = new Date().getTime();
        var t = newTime - this.renderTime;
        if (t == 0)
            return;
        var framerate = 1000/t;
        this.frameTime = t;
        this.framerates.push(framerate);
        while (this.framerates.length > this.numFramerates)
            this.framerates.shift();
        this.renderTime = newTime;
    }
}

/**
 * Provides requestAnimationFrame in a cross browser way.
 */
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           window.setTimeout(callback, 1000/60);
         };
})();