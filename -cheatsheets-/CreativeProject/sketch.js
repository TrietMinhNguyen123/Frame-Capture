let handPose;
let video;
let hands = [];

let canvasWidth = 960;
let canvasHeight = 720;

let thumbTipIndex = 4;
let indexTipIndex = 8;

let fingerTipIndexes = [
    thumbTipIndex,
    indexTipIndex
];

// Clean webcam graphics layer
let cameraFrame;

// Hand control positions
let leftControlPoint = null;
let rightControlPoint = null;

// Current live filter rectangle
let currentFilterArea = null;

// Saved filter rectangles
let frozenFilterAreas = [];

let minimumFilterAreaSize = 30;
let maximumFrozenAreas = 20;

// Available filters
let filterNames = [
    "grayscale",
    "blur",
    "retro",
    "invert"
];

let currentFilterIndex = 0;

// Flick detection
let previousRightHandX = null;

let flickThreshold = 55;
let flickCooldown = 650;
let lastFlickTime = -Infinity;

function preload() {
    handPose = ml5.handPose();
}

function setup() {
    pixelDensity(1);

    createCanvas(
        canvasWidth,
        canvasHeight
    );

    video = createCapture(VIDEO, {
        flipped: true
    });

    video.size(
        canvasWidth,
        canvasHeight
    );

    video.hide();

    cameraFrame = createGraphics(
        canvasWidth,
        canvasHeight
    );

    cameraFrame.pixelDensity(1);

    handPose.detectStart(
        video,
        gotHands
    );

    textFont("monospace");
}

function gotHands(results) {
    hands = results;
}

function draw() {
    background(0);

    // Save a clean version of the webcam.
    cameraFrame.clear();

    cameraFrame.image(
        video,
        0,
        0,
        width,
        height
    );

    // Draw the webcam.
    image(cameraFrame, 0, 0);

    // Reset the current hand controls.
    leftControlPoint = null;
    rightControlPoint = null;
    currentFilterArea = null;

    // Find each hand's pinch center.
    for (let i = 0; i < hands.length; i++) {
        let hand = hands[i];

        if (isLeftHand(hand)) {
            leftControlPoint =
                getPinchCenter(hand);
        }

        if (isRightHand(hand)) {
            rightControlPoint =
                getPinchCenter(hand);
        }
    }

    // Draw filter areas that were stamped.
    drawFrozenFilterAreas();

    // Create the live filter window.
    if (
        leftControlPoint !== null &&
        rightControlPoint !== null
    ) {
        currentFilterArea = createFilterArea(
            leftControlPoint,
            rightControlPoint
        );

        if (currentFilterArea !== null) {
            drawLiveFilterArea(
                currentFilterArea
            );

            drawFilterBorder(
                currentFilterArea
            );

            updateRightHandFlick(
                rightControlPoint
            );
        }
    } else {
        previousRightHandX = null;
    }

    // Draw the hand fingertip markers.
    for (let i = 0; i < hands.length; i++) {
        drawFingerTips(hands[i]);
    }

    // Draw the rectangle control points.
    if (leftControlPoint !== null) {
        drawControlPoint(
            leftControlPoint,
            "LEFT"
        );
    }

    if (rightControlPoint !== null) {
        drawControlPoint(
            rightControlPoint,
            "RIGHT"
        );
    }

    drawInterface();
}

function isLeftHand(hand) {
    return hand.handedness
        .toString()
        .toLowerCase() === "right";
}

function isRightHand(hand) {
    return hand.handedness
        .toString()
        .toLowerCase() === "left";
}

function getPinchCenter(hand) {
    let thumbTip =
        hand.keypoints[thumbTipIndex];

    let indexTip =
        hand.keypoints[indexTipIndex];

    let centerX =
        width - (
            (thumbTip.x + indexTip.x) / 2
        );

    let centerY =
        (thumbTip.y + indexTip.y) / 2;

    return {
        x: centerX,
        y: centerY
    };
}

function createFilterArea(pointA, pointB) {
    let areaX = min(
        pointA.x,
        pointB.x
    );

    let areaY = min(
        pointA.y,
        pointB.y
    );

    let areaWidth = abs(
        pointB.x - pointA.x
    );

    let areaHeight = abs(
        pointB.y - pointA.y
    );

    areaX = constrain(
        floor(areaX),
        0,
        width - 1
    );

    areaY = constrain(
        floor(areaY),
        0,
        height - 1
    );

    areaWidth = constrain(
        floor(areaWidth),
        1,
        width - areaX
    );

    areaHeight = constrain(
        floor(areaHeight),
        1,
        height - areaY
    );

    if (
        areaWidth < minimumFilterAreaSize ||
        areaHeight < minimumFilterAreaSize
    ) {
        return null;
    }

    return {
        x: areaX,
        y: areaY,
        width: areaWidth,
        height: areaHeight
    };
}

function getCameraRegion(area) {
    return cameraFrame.get(
        area.x,
        area.y,
        area.width,
        area.height
    );
}

function getFilteredRegion(area) {
    let region = getCameraRegion(area);

    let currentFilter =
        filterNames[currentFilterIndex];

    if (currentFilter === "grayscale") {
        region.filter(GRAY);
    }

    if (currentFilter === "blur") {
        region.filter(BLUR, 8);
    }

    if (currentFilter === "retro") {
        region.filter(POSTERIZE, 5);
    }

    if (currentFilter === "invert") {
        region.filter(INVERT);
    }

    return region;
}

function drawLiveFilterArea(area) {
    let filteredRegion =
        getFilteredRegion(area);

    image(
        filteredRegion,
        area.x,
        area.y,
        area.width,
        area.height
    );
}

function drawFilterBorder(area) {
    noFill();
    stroke(0, 255, 180);
    strokeWeight(3);

    rect(
        area.x,
        area.y,
        area.width,
        area.height
    );
}

function stampCurrentFilterArea() {
    if (currentFilterArea === null) {
        return;
    }

    let filteredImage =
        getFilteredRegion(currentFilterArea);

    frozenFilterAreas.push({
        x: currentFilterArea.x,
        y: currentFilterArea.y,
        width: currentFilterArea.width,
        height: currentFilterArea.height,
        image: filteredImage
    });

    if (
        frozenFilterAreas.length >
        maximumFrozenAreas
    ) {
        frozenFilterAreas.shift();
    }
}

function drawFrozenFilterAreas() {
    for (
        let i = 0;
        i < frozenFilterAreas.length;
        i++
    ) {
        let frozenArea =
            frozenFilterAreas[i];

        image(
            frozenArea.image,
            frozenArea.x,
            frozenArea.y,
            frozenArea.width,
            frozenArea.height
        );
    }
}

function updateRightHandFlick(point) {
    if (previousRightHandX === null) {
        previousRightHandX = point.x;
        return;
    }

    let movementX =
        point.x - previousRightHandX;

    let enoughTimePassed =
        millis() - lastFlickTime >
        flickCooldown;

    if (
        abs(movementX) > flickThreshold &&
        enoughTimePassed
    ) {
        stampCurrentFilterArea();
        lastFlickTime = millis();
    }

    previousRightHandX = point.x;
}

function drawFingerTips(hand) {
    for (
        let i = 0;
        i < fingerTipIndexes.length;
        i++
    ) {
        let keypointIndex =
            fingerTipIndexes[i];

        let keypoint =
            hand.keypoints[keypointIndex];

        fill(255, 80, 80);
        noStroke();

        circle(
            width - keypoint.x,
            keypoint.y,
            12
        );
    }
}

function drawControlPoint(point, label) {
    fill(0, 255, 180);
    noStroke();

    circle(
        point.x,
        point.y,
        18
    );

    fill(255);
    textSize(14);
    textAlign(LEFT, CENTER);

    text(
        label,
        point.x + 14,
        point.y
    );
}

function drawInterface() {
    let filterName =
        filterNames[currentFilterIndex];

    noStroke();
    fill(0, 170);

    rect(
        16,
        16,
        350,
        100,
        10
    );

    fill(255);
    textAlign(LEFT, TOP);
    textSize(16);
    textStyle(BOLD);

    text(
        "FILTER: " +
        filterName.toUpperCase(),
        30,
        28
    );

    textStyle(NORMAL);
    textSize(13);

    text(
        "1 Gray | 2 Blur | 3 Retro | 4 Invert",
        30,
        56
    );

    text(
        "Right-hand flick: stamp | C: clear",
        30,
        78
    );

    text(
        "S: test stamp",
        30,
        98
    );
}

function keyPressed() {
    if (key === "1") {
        currentFilterIndex = 0;
    }

    if (key === "2") {
        currentFilterIndex = 1;
    }

    if (key === "3") {
        currentFilterIndex = 2;
    }

    if (key === "4") {
        currentFilterIndex = 3;
    }

    if (
        key === "c" ||
        key === "C"
    ) {
        frozenFilterAreas = [];
    }

    if (
        key === "s" ||
        key === "S"
    ) {
        stampCurrentFilterArea();
    }
}