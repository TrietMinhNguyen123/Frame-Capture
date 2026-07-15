// let handPose;
// let video;
// let hands = [];

// let canvasWidth = 960;
// let canvasHeight = 720;

// let thumbTipIndex = 4;
// let indexTipIndex = 8;
// let fingerTipIndexes = [thumbTipIndex, indexTipIndex];

// let minLeftHandDistance = 20;
// let maxLeftHandDistance = 220;
// let leftHandDistance = null;
// let leftHandDistanceNormalized = null;

// let minRightHandRotation = 0;
// let RightRotationThreshold = 90;
// let maxRightHandRotation = Math.PI / 2;
// let rightHandRotation = null;
// let rightHandRotationNormalized = null;
// let rightHandSwitch = false; 
// let rightHandWasOverThreshold = false; 

// function preload(){
//     handPose = ml5.handPose();

// }

// function setup(){
//     createCanvas(canvasWidth, canvasHeight);

//     video = createCapture(VIDEO, {flipped: true});
//     video.size(canvasWidth, canvasHeight);
//     video.hide();

//     setupInteractive();

//     handPose.detectStart(video, gotHands);
//     textFont("monospace");
// }

// function gotHands(results){
//     hands = results;
// }

// function draw(){
//     background(0);
//     image(video, 0, 0, width, height);
    
//     leftHandDistance = null;
//     leftHandDistanceNormalized = null;
//     rightHandRotation = null;
//     rightHandRotationNormalized = null;

//     for (let i = 0; i < hands.length; i++){
//         let hand = hands[i];

//         drawThumbIndexLine(hand);
//         drawFingerTips(hand);

//         if(isLeftHand(hand)){
//             updateLeftHandDistance(hand);
//     }
//         if(isRightHand(hand)){
//             updateRightHandRotation(hand);
//         }
// }
//     updateElementScale(leftHandDistanceNormalized);
//     drawCurrentElement();
// }
// function drawThumbIndexLine(hand){
//     let thumbTip = hand.keypoints[thumbTipIndex];
//     let indexTip = hand.keypoints[indexTipIndex];

//     stroke(0, 255, 0);
//     strokeWeight(4);
//     line(width - thumbTip.x, thumbTip.y, width - indexTip.x, indexTip.y);
// }

// function drawFingerTips(hand){
//     for(let i = 0; i < fingerTipIndexes.length; i++){
//         let keypointIndex = fingerTipIndexes[i];
//         let keypoint = hand.keypoints[keypointIndex];

//         fill(255,0,0);
//         noStroke();
//         circle(width - keypoint.x, keypoint.y, 12);
//     }
// }

// function isLeftHand(hand){
//     return hand.handedness.toString().toLowerCase() === "right";
// }
// function isRightHand(hand){
//     return hand.handedness.toString().toLowerCase() === "left";
// }

// function updateLeftHandDistance(hand){
//     let thumbTip = hand.keypoints[thumbTipIndex];
//     let indexTip = hand.keypoints[indexTipIndex];

//     leftHandDistance = dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y);
//     leftHandDistanceNormalized = normalizeValue(leftHandDistance,minLeftHandDistance,maxLeftHandDistance);

//     let labelX = width - ((thumbTip.x + indexTip.x)/2);
//     let labelY = (thumbTip.y + indexTip.y)/2 ;

//     fill(255, 255, 0);
//     noStroke();
//     textSize(16);
//     text("left distance: " + leftHandDistance.toFixed(0), labelX + 16, labelY - 8);
//     text("left 0-1" + leftHandDistanceNormalized.toFixed(2), labelX + 16, labelY + 14);
// }

// function updateRightHandRotation(hand){
//     let thumbTip = hand.keypoints[thumbTipIndex];
//     let indexTip = hand.keypoints[indexTipIndex];
//     let dx = indexTip.x - thumbTip.x;
//     let dy = indexTip.y - thumbTip.y;

//     rightHandRotation = atan2(abs(dx), -dy);
//     rightHandRotationNormalized = normalizeValue(
//         rightHandRotation, 
//         minRightHandRotation, 
//         maxRightHandRotation
//     );

//     let rightHandRotationDegrees = rightHandRotation * 180 / Math.PI;
//     updateRightHandSwich(rightHandRotationDegrees);


//     let labelX = width - ((thumbTip.x + indexTip.x)/2);
//     let labelY = (thumbTip.y + indexTip.y)/2 ;
    
//     fill(255, 255, 0);
//     noStroke();
//     textSize(16);
//     text("right rotation: " + rightHandRotationDegrees.toFixed(0), labelX + 16, labelY - 8);
//     text("right 0-1: " + rightHandRotationNormalized.toFixed(2), labelX + 16, labelY + 14);
//     text("right switch: " + rightHandRotationNormalized.toFixed(2), labelX + 16, labelY + 36);
// }

// function updateRightHandSwich(rotationDeg){
//     let isOverThreshold = rotationDeg > RightRotationThreshold;

//     if(isOverThreshold && rightHandWasOverThreshold === false){
//         rightHandSwitch = !rightHandSwitch; 
//         advanceElement();
//     }


//     rightHandWasOverThreshold = isOverThreshold;
// }

// function normalizeValue(value, min, max){
//     let normalizedValue = (value - min) / (max - min);
//     return constrain(normalizedValue, 0, 1);
// }











//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

let handPose;
let video;
let hands = [];

let canvasWidth = 1440;
let canvasHeight = 1080;

let thumbTipIndex = 4;
let indexTipIndex = 8;
let fingerTipIndexes = [thumbTipIndex, indexTipIndex];

let cameraFrame;

let leftControlPoint = null; 
let rightControlPoint = null;

let currentFilterArea = null; 

let frozenFilterAreas = [];

let minimumFilterAreaSize = 30;

let maximumFrozenAreas = 15;

let filterNames = ["grayscale", "blur", "retro", "invert"];

let currentFilterIndex = 0; 

let previousRightHandY = null;

let flickThreshold = 30;
let flickCooldown = 650;

let animationMode = false;

let lastFlickTime = -Infinity;

function preload(){
    handPose = ml5.handPose();
}

function setup(){
    pixelDensity(1);

    createCanvas(canvasWidth, canvasHeight);

    video = createCapture(VIDEO,{flipped: true});

    video.size(canvasWidth, canvasHeight);
    video.hide();

    cameraFrame = createGraphics(canvasWidth, canvasHeight);

    cameraFrame.pixelDensity(1);

    handPose.detectStart(video, gotHands);

    textFont("monospace");
}

function gotHands(results){
    hands = results;
}

function draw(){
    background(0);

    cameraFrame.clear();
    cameraFrame.image(video, 0, 0, width, height);

    image(cameraFrame, 0, 0);

    leftControlPoint = null;
    rightControlPoint = null;
    currentFilterArea = null;

    for(let i = 0; i < hands.length; i++){
        let hand = hands[i];

        if(isLeftHand(hand)){
            leftControlPoint = getPinchCenter(hand);
        }

        if(isRightHand(hand)){
            rightControlPoint = getPinchCenter(hand);
        }
    }

    drawFrozenFilterAreas();
    if(leftControlPoint !== null && rightControlPoint !== null){
        currentFilterArea = createFilterArea(leftControlPoint, rightControlPoint);
        
        if(currentFilterArea !== null){
            drawLiveFilteredRegion(currentFilterArea);
            drawFilterBorder(currentFilterArea);
            updateRightHandFlick(rightControlPoint);
        }
    }else{
        previousRightHandY = null;
    }

    for(let i = 0; i < hands.length; i++){
        drawFingerTips(hands[i]);
    }

    if(leftControlPoint !== null){
        drawControlPoint(leftControlPoint, "LEFT");
    }
    if(rightControlPoint !== null){
        drawControlPoint(rightControlPoint, "RIGHT");
    }

    drawInterface();

}

function isLeftHand(hand){
    return hand.handedness.toString().toLowerCase() === "right";
}

function isRightHand(hand){
    return hand.handedness.toString().toLowerCase() === "left";
}


function getPinchCenter(hand){
    let thumbTip = hand.keypoints[thumbTipIndex];
    let indexTip = hand.keypoints[indexTipIndex];

    let centerX = width - ((thumbTip.x + indexTip.x) /2);
    let centerY = (thumbTip.y + indexTip.y) / 2;

    return {
        x: centerX,
        y: centerY
    };
}

function createFilterArea(pointA, pointB){
    let areaX = min(pointA.x, pointB.x);
    let areaY = min(pointA.y, pointB.y);

    let areaWidth = abs(pointA.x - pointB.x);
    let areaHeight = abs(pointA.y - pointB.y);

    areaX = constrain(floor(areaX),0,width - 1);

    areaY = constrain(floor(areaY), 0, height - 1);

    areaWidth = constrain(floor(areaWidth), 0, width - areaX);

    areaHeight = constrain(floor(areaHeight), 0, height - areaY);

    if(areaWidth < minimumFilterAreaSize || areaHeight < minimumFilterAreaSize){
        return null;
    }
    return {
        x: areaX,
        y: areaY,
        width: areaWidth,
        height: areaHeight
    };
}

function getCameraRegion(area){
    return cameraFrame.get(area.x, area.y, area.width, area.height);
}

function getFilteredRegion(area){
    let region = getCameraRegion(area);

    let currentFilter = filterNames[currentFilterIndex];

    if(currentFilter === "grayscale"){
        region.filter(GRAY);
    }
    if (currentFilter === "blur") {
        let smallWidth = max(
            1,
            floor(region.width * 0.35)
        );

        let smallHeight = max(
            1,
            floor(region.height * 0.35)
        );

        region.resize(
            smallWidth,
            smallHeight
        );

        region.filter(BLUR, 2);

        region.resize(
            area.width,
            area.height
        );
    }
    if(currentFilter === "retro"){
        region.filter(POSTERIZE, 5);
    }
    if(currentFilter === "invert"){
        region.filter(INVERT);
    }

    return region;
}

function drawLiveFilteredRegion(area){
    let filteredRegion = getFilteredRegion(area);
    image(filteredRegion, area.x, area.y, area.width, area.height);
}
function drawFilterBorder(area){
    noFill();
    stroke(0, 0, 0);
    strokeWeight(3);
    rect(area.x, area.y, area.width, area.height);
}

function stampCurrentFilteredRegion(area){
    if(currentFilterArea === null){
        return; 
    }

    let filteredImage = getFilteredRegion(currentFilterArea);

    frozenFilterAreas.push({x: currentFilterArea.x,
        y: currentFilterArea.y,
        width: currentFilterArea.width,
        height: currentFilterArea.height,
        image: filteredImage
    });

    if(frozenFilterAreas.length > maximumFrozenAreas){
        frozenFilterAreas.shift();
    }
}

function drawFrozenFilterAreas(){
    for(let i = 0; i < frozenFilterAreas.length; i++){
        let frozenArea = frozenFilterAreas[i];
        
        image(frozenArea.image, frozenArea.x, frozenArea.y, frozenArea.width, frozenArea.height);
    }
}

function updateRightHandFlick(point){
    if(!animationMode){
        if(previousRightHandY === null){
            previousRightHandY = point.y;
            return;
        }

        let movementY = point.y - previousRightHandY;

        let enoughTimePassed = (millis() - lastFlickTime) > flickCooldown;

        if(abs(movementY) > flickThreshold && enoughTimePassed){
            stampCurrentFilteredRegion()
            lastFlickTime = millis();
            currentFilterIndex++;

        if (currentFilterIndex >= filterNames.length) {
            currentFilterIndex = 0;
        }
        }

        previousRightHandY= point.y
    }else if(animationMode){
        let thumbTip = hands[0].keypoints[thumbTipIndex];
        let indexTip = hands[0].keypoints[indexTipIndex];
        let cooldown = 500;
        let dy = indexTip.y - thumbTip.y;

        if(abs(dy) < thumbTip.y * 0.5){
            stampCurrentFilteredRegion();
            currentFilterIndex++;
            
            if(currentFilterIndex >= filterNames.length){
                currentFilterIndex = 0;
            }
        }
}
}

function drawFingerTips(hand){
    for(let i = 0; i < fingerTipIndexes.length; i++){
        let keyPointIndex = fingerTipIndexes[i];
        
        let keyPoint = hand.keypoints[keyPointIndex];

        fill(255, 80, 80);
        noStroke();
        circle(width - keyPoint.x, keyPoint.y, 12)
    }
} 

function drawControlPoint(point, label){
    
    fill(255);
    textSize(14)
    textAlign(LEFT, CENTER);
    text(label, point.x + 14, point.y);
}

function keyPressed(){
    if(key ==="1"){
        currentFilterIndex = 0;
    }
    if(key ==="2"){
        currentFilterIndex = 1;
    }
    if(key ==="3"){
        currentFilterIndex = 2;
    }
    if(key ==="4"){
        currentFilterIndex = 3;
    }

    if(key.toLowerCase() === "c"){
        frozenFilterAreas = [];
    }
    if(key.toLowerCase() === "s"){
        stampCurrentFilteredRegion();
    }

    if(key.toLowerCase() === "q"){
        animationMode = !animationMode;
    }
}

function drawInterface(){
    let filterName = filterNames[currentFilterIndex];

    noStroke();
    fill(0, 170);
    rect(16,16,350,100,10);

    fill(255);
    textAlign(LEFT, TOP);
    textSize(16);
    textStyle(BOLD);
    text("FILTER IS: " + filterName.toUpperCase(), 30, 28);

    textStyle(NORMAL);

    textSize(13); 

    text("1 Gray | 2 Blur | 3 Retro | 4 Invert",30,56);

    text("Right-hand flick: stamp | C: clear",30,78);

    text("S: test stamp",30,98);

    if(!animationMode){
    text("Q: animation mode",150,98);
    }else if (animationMode){
        text("Q: capture mode",150,98);
    }
}