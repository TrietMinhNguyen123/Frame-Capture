let handPose;
let video;
let hands = [];

let canvasWidth = 960;
let canvasHeight = 720;

let thumbTipIndex = 4;
let indexTipIndex = 8;
let fingerTipIndexes = [thumbTipIndex, indexTipIndex];

let leftHandDistance = null;
let leftHandDistanceNormalized = null;

let minLeftHandDistance = 20;
let maxLeftHandDistance = 220;

let minRightHandRotation = 0;
let maxRightHandRotation = Math.PI / 2;
let rightHandSwitchThreshold = 90;
let rightHandRotation = null;
let rightHandRotationNormalized = null;
let rightHandSwitch = false;
let rightHandWasOverThreshold = false;

function preload() {
    handPose = ml5.handPose();
}

function setup() {
    createCanvas(canvasWidth, canvasHeight);

    video = createCapture(VIDEO, { flipped: true });
    video.size(canvasWidth, canvasHeight);
    video.hide();
    setupInteractive();

    handPose.detectStart(video, gotHands);
}

function gotHands(results) {
    hands = results;
}

function draw() {
    background(0);
    image(video, 0, 0, width, height);

    for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
         drawThumbIndexLine(hand);
        drawFingerTipDots(hand);

         if (isLeftHand(hand)) {
            updateLeftHandDistance(hand);
            }

            if (isRightHand(hand)) {
            updateRightHandRotation(hand);
        }
    }
    updateElementScale(leftHandDistanceNormalized);
    drawCurrentElement();
}

function drawThumbIndexLine(hand) {
  let thumbTip = hand.keypoints[thumbTipIndex];
  let indexTip = hand.keypoints[indexTipIndex];

  stroke(0, 255, 0);
  strokeWeight(4);
  line(width - thumbTip.x, thumbTip.y, width - indexTip.x, indexTip.y);
}

function drawFingerTipDots(hand) {
  for (let j = 0; j < fingerTipIndexes.length; j++) {
    let keypointIndex = fingerTipIndexes[j];
    let keypoint = hand.keypoints[keypointIndex];

    fill(0, 255, 0);
    noStroke();
    circle(width - keypoint.x, keypoint.y, 12);
  }
}

function isLeftHand(hand) {
  return hand.handedness.toString().toLowerCase() === "right";
}

function isRightHand(hand) {
  return hand.handedness.toString().toLowerCase() === "left";
}

function updateLeftHandDistance(hand) {
  let thumbTip = hand.keypoints[thumbTipIndex];
  let indexTip = hand.keypoints[indexTipIndex];

  leftHandDistance = dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y);

  leftHandDistanceNormalized = normalizeValue(
    leftHandDistance,
    minLeftHandDistance,
    maxLeftHandDistance
  );

   let labelX = width - ((thumbTip.x + indexTip.x) / 2);
  let labelY = (thumbTip.y + indexTip.y) / 2;

    fill(255, 255, 0);
    noStroke();
    textSize(16);
    text("L dist: " + leftHandDistance.toFixed(0), labelX + 16, labelY - 8);
    text("L 0-1: " + leftHandDistanceNormalized.toFixed(2), labelX + 16, labelY + 14);
}

function normalizeValue(value, minValue, maxValue) {
  let normalizedValue = (value - minValue) / (maxValue - minValue);
  return constrain(normalizedValue, 0, 1);
}

function updateRightHandRotation(hand) {
  let thumbTip = hand.keypoints[thumbTipIndex];
  let indexTip = hand.keypoints[indexTipIndex];
  let dx = indexTip.x - thumbTip.x;
  let dy = indexTip.y - thumbTip.y;

  rightHandRotation = atan2(abs(dx), -dy);
  rightHandRotationNormalized = normalizeValue(
    rightHandRotation,
    minRightHandRotation,
    maxRightHandRotation
  );

  let rightHandRotationDegrees = rightHandRotation * 180 / Math.PI;
    updateRightHandSwitch(rightHandRotationDegrees);

     let labelX = width - ((thumbTip.x + indexTip.x) / 2);
  let labelY = (thumbTip.y + indexTip.y) / 2;

  fill(0, 255, 255);
  noStroke();
  textSize(16);
  text("R rot: " + rightHandRotationDegrees.toFixed(0), labelX + 16, labelY - 8);
  text("R 0-1: " + rightHandRotationNormalized.toFixed(2), labelX + 16, labelY + 14);
  text("R switch: " + rightHandSwitch, labelX + 16, labelY + 36);

}

function updateRightHandSwitch(rotationDegrees) {
  let isOverThreshold = rotationDegrees > rightHandSwitchThreshold;

  if (isOverThreshold && rightHandWasOverThreshold === false) {
    rightHandSwitch = !rightHandSwitch;
     advanceElement();
  }

  rightHandWasOverThreshold = isOverThreshold;
}
