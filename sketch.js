let handPose;
let video;
let hands = [];

let canvasWidth = 960;
let canvasHeight = 720;

let thumbTipIndex = 4;
let indexTipIndex = 8;
let fingerTipIndexes = [thumbTipIndex, indexTipIndex];

let minLeftHandDistance = 20;
let maxLeftHandDistance = 220;
let leftHandDistance = null;
let leftHandDistanceNormalized = null;

let minRightHandRotation = 0;
let maxRightHandRotation = Math.PI / 2;
let rightHandRotation = null;
let rightHandRotationNormalized = null;
let rightHandSwitch = false; 
let rightHandWasOverThreshold = false; 

function preload(){
    handPose = ml5.handPose();

}

function setup(){
    createCanvas(canvasWidth, canvasHeight);

    video = createCapture(VIDEO, {flipped: true});
    video.size(canvasWidth, canvasHeight);
    video.hide();

    handPose.detectStart(video, gotHands);
    textFont("monospace");
}

function gotHands(results){
    hands = results;
}

function draw(){
    background(0);
    image(video, 0, 0, width, height);
    
    leftHandDistance = null;
    leftHandDistanceNormalized = null;
    rightHandRotation = null;
    rightHandRotationNormalized = null;

    for (let i = 0; i < hands.length; i++){
        let hand = hands[i];

        drawThumbIndexLine(hand);
        drawFingerTips(hand);

        if(isLeftHand(hand)){
            updateLeftHandDistance(hand);
    }
        if(isRightHand(hand)){
            updateRightHandRotation(hand);
        }
}
    updateElementScale(leftHandDistanceNormalized);
    drawCurrentElement();
}
function drawThumbIndexLine(hand){
    let thumbTip = hand.keypoints[thumbTipIndex];
    let indexTip = hand.keypoints[indexTipIndex];

    stroke(0, 255, 0);
    strokeWeight(4);
    line(width - thumbTip.x, thumbTip.y, width - indexTip.x, indexTip.y);
}

function drawFingerTips(hand){
    for(let i = 0; i < fingerTipIndexes.length; i++){
        let keypointIndex = fingerTipIndexes[i];
        let keypoint = hand.keypoints[keypointIndex];

        fill(255,0,0);
        noStroke();
        circle(width - keypoint.x, keypoint.y, 12);
    }
}

function isLeftHand(hand){
    return hand.handedness.toString().toLowerCase() === "right";
}
function isRightHand(hand){
    return hand.handedness.toString().toLowerCase() === "left";
}

function updateLeftHandDistance(hand){
    let thumbTip = hand.keypoints[thumbTipIndex];
    let indexTip = hand.keypoints[indexTipIndex];

    leftHandDistance = dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y);
    leftHandDistanceNormalized = normalizeValue(leftHandDistance,minLeftHandDistance,maxLeftHandDistance);

    let labelX = width - ((thumbTip.x + indexTip.x)/2);
    let labelY = (thumbTip.y + indexTip.y)/2 ;

    fill(255, 255, 0);
    noStroke();
    textSize(16);
    text("left distance: " + leftHandDistance.toFixed(0), labelX + 16, labelY - 8);
    text("left 0-1" + leftHandDistanceNormalized.toFixed(2), labelX + 16, labelY + 14);
}

function updateRightHandRotation(hand){
    let thumbTip = hand.keypoints[thumbTipIndex];
    let indexTip = hand.keypoints[indexTipIndex];
    let dx = indexTip.x - thumbTip.x;
    let dy = indexTip.y - thumbTip.y;

    rightHandRotation = atan2(abs(dx), -dy);
    rightHandRotationNormalized = normalizeValue(rightHandRotation, 
        minRightHandRotation, 
        maxRightHandRotation
    );

    let rightHandRotationDegrees = rightHandRotation * 180 / Math.PI;
    updateRightHandSwich(rightHandRotationDegrees);


    let labelX = width - ((thumbTip.x + indexTip.x)/2);
    let labelY = (thumbTip.y + indexTip.y)/2 ;
    
    fill(255, 255, 0);
    noStroke();
    textSize(16);
    text("right rotation: " + rightHandRotationDegrees.toFixed(0), labelX + 16, labelY - 8);
    text("right 0-1: " + rightHandRotationNormalized.toFixed(2), labelX + 16, labelY + 14);
    text("right switch: " + rightHandRotationNormalized.toFixed(2), labelX + 16, labelY + 36);
}

function updateRightHandSwich(rotationDeg){
    let isOverThreshold = rotationDeg > rightHandWasOverThreshold;

    if(isOverThreshold && rightHandWasOverThreshold === false){
        rightHandSwitch = !rightHandSwitch; 
        advanceElement();
    }


    rightHandWasOverThreshold = isOverThreshold;
}

function normalizeValue(value, min, max){
    let normalizedValue = (value - min) / (max - min);
    return constrain(normalizedValue, 0, 1);
}