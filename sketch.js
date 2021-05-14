/*
 * Resources
 *
 * https://p5js.org/
 * https://github.com/spite/ccapture.js
 * https://en.wikipedia.org/wiki/Maurer_rose
 * https://en.wikipedia.org/wiki/Perlin_noise
 * https://bleuje.github.io/
 * https://www.youtube.com/watch?v=nBKwCCtWlUg
 */

// SETTINGS
// Mess with values here.
const s = {
  // Starting point values for d/n.
  dMin: 2,
  dMax: 20,
  nMin: 10,
  nMax: 80,

  // Deviation from starting d/n values
  dLeashMin: 5,
  dLeashMax: 8,
  nLeashMin: 0.6,
  nLeashMax: 1,

  // Perlin noise sample circle radius
  dNoiseRadius: 0.002,
  nNoiseRadius: 0.001,

  runtime: 10, // Animation length in seconds
  side: 1024, // Square dimension
  scale: 0.4, // Magic scale value
  debug: true, // Show/hide the HUD. Frames are recorded before HUD is drawn, so it won't appear in recordings
}

//
//
// Modifying below here might break stuff!
// Have fun.
//
//

const framerate = 60; // FPS. Leave at 60 for CCapture.js
const totalFrames = framerate * s.runtime;
const leashPlaces = 2;
const leashMult = Math.pow(10, leashPlaces);

let seedNum;
let capturer;
let canvas;
let nNoise;
let dNoise;
let exported = false;
let counter = 0;
let frameNumber = 0;
let recording = false;
let will_record = false;
let message = 'Click to record';

function mousePressed() {
  will_record = true;
}

function setup() {
  canvas = document.getElementById("defaultCanvas0");
  capturer = new CCapture( {
    name: 'spirograph-' + Date.now(),
    format: 'webm',
  });

  createCanvas(s.side, s.side);
  frameRate(framerate)
  angleMode(RADIANS)
  textFont('monospace')
  smooth();

  // Create a seed value to use for debugging just in case
  seedNum = Math.floor(random(100000,999999))
  noiseSeed(seedNum)
  randomSeed(seedNum)

  d = Math.round(random(s.dMin, s.dMax));
  n = Math.round(random(s.nMin, s.nMax));
  dLeash = Math.round(random(s.dLeashMin, s.dLeashMax) * leashMult) / leashMult;
  nLeash = Math.round(random(s.nLeashMin, s.nLeashMax) * leashMult) / leashMult;
  dNoise = new NoiseLoop(s.dNoiseRadius, -dLeash, dLeash);
  nNoise = new NoiseLoop(s.nNoiseRadius, -nLeash, nLeash);
}

function draw() {
  background(20);

  let progress = float(counter % totalFrames) / totalFrames;

  if (will_record && frameNumber == 0) {
    will_record = false;
    recording = true;
    capturer.start();
  }

  spirograph(progress);

  if (recording) {
    message = 'Recording...';
    capturer.capture( canvas );

    if (frameNumber == totalFrames) {
      message = 'Recording complete';
      recording = false;
      capturer.stop();
      capturer.save();
    }
  }

  if (s.debug) {
    hud();
  }

  counter++;
  frameNumber++;

  if (frameNumber > totalFrames) {
    frameNumber = 0;
  }
}

function spirograph(progress) {
  push();
    translate(width/2,height/2);

    beginShape();
    for (let theta = 0; theta <= 360; theta++) {
      let k = theta * (d + dNoise.value(progress));
      let r = (s.side * s.scale) * sin((n + nNoise.value(progress) * k));

      let x = -r * cos(k);
      let y = -r * sin(k);

      vertex(x,y);
    }

    strokeWeight(1);
    scale(1);
    stroke(255,255,255,map(0.65, 0, 1, 0, 255));
    noFill();
    endShape();
  pop();
}

function hud() {
  fill(180)
  textSize(20)

  // PERCENT PROGRESS
  fill(100)
  if (recording) {
    fill(255,0,0)
    message = 'Recording...'
  }
  if (will_record) {
    fill(40,80,255)
    message = 'Recording will start at beginning of loop...'
  }
  text(frameNumber + ' / ' + totalFrames, 10, 40)

  // MESSAGE
  text(message, 10, height - 10)

  // PROGRESS BAR
  rect(0, 0, map(frameNumber / totalFrames, 0, 1, 0, width), 10)

  // FRAME INDICATOR
  fill(255)
  noStroke()
  rect(map(frameNumber / totalFrames, 0, 1, 0, width), 0, width / totalFrames, 10)
}

class NoiseLoop {
  constructor(diameter, min, max) {
    this.diameter = diameter;
    this.min = min;
    this.max = max;
    this.cx = random(1);
    this.cy = random(1) + max; // value add is arbitrary
  }

  value(angle) {
    let xOff = map(cos(TWO_PI * angle), -1, 1, this.cx, this.cx + this.diameter);
    let yOff = map(sin(TWO_PI * angle), -1, 1, this.cy, this.cy + this.diameter);
    let r = noise(xOff, yOff);

    return map(r, 0, 1, this.min, this.max);
  }
}
