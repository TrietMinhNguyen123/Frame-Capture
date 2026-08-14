let mainCanvas;

let capturedFrames = [];

let maximumCapturedFrames = 10;

let selectedCapturedFrame = null;

let isSendingEmail = false;

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

    mainCanvas = createCanvas(
    canvasWidth,
    canvasHeight
);

    video = createCapture(VIDEO,{flipped: true});

    video.size(canvasWidth, canvasHeight);
    video.hide();

    cameraFrame = createGraphics(canvasWidth, canvasHeight);

    cameraFrame.pixelDensity(1);

    handPose.detectStart(video, gotHands);

    textFont("monospace");

    document
    .getElementById("close-frame-modal")
    .addEventListener(
        "click",
        closeFrameModal
    );

    document
    .getElementById(
        "download-frame-button"
    )
    .addEventListener(
        "click",
        downloadSelectedFrame
    );

    document
    .getElementById(
        "email-frame-button"
    )
    .addEventListener(
        "click",
        sendSelectedFrameEmail
    );

    let emailButton =
        document.getElementById(
            "email-frame-button"
        );

    emailButton.addEventListener(
        "click",
        sendSelectedFrameEmail
    );
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
            captureCurrentFrame();
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

function captureCurrentFrame() {

    let imageData =
        mainCanvas.elt.toDataURL("image/png");

    let newFrame = {
        id: Date.now(),
        image: imageData
    };

    capturedFrames.push(newFrame);

    if (
        capturedFrames.length >
        maximumCapturedFrames
    ) {
        capturedFrames.shift();
    }

    updateCaptureSidebars();
}

function updateCaptureSidebars() {

    let leftSidebar =
        document.getElementById(
            "left-captures"
        );

    let rightSidebar =
        document.getElementById(
            "right-captures"
        );

    leftSidebar.innerHTML = "";
    rightSidebar.innerHTML = "";

    for (
        let i = 0;
        i < capturedFrames.length;
        i++
    ) {

        let frame = capturedFrames[i];

        let thumbnail =
            document.createElement("img");

        thumbnail.src = frame.image;

        thumbnail.classList.add(
            "capture-thumbnail"
        );

        thumbnail.addEventListener(
            "click",
            function () {
                openFrameModal(frame);
            }
        );

        /*
            Alternate sides:

            frame 0 → left
            frame 1 → right
            frame 2 → left
            frame 3 → right
        */

        if (i % 2 === 0) {
            leftSidebar.appendChild(
                thumbnail
            );
        } else {
            rightSidebar.appendChild(
                thumbnail
            );
        }
    }
}

function openFrameModal(frame) {

    selectedCapturedFrame = frame;

    let modal =
        document.getElementById(
            "frame-modal"
        );

    let image =
        document.getElementById(
            "selected-frame-image"
        );

    image.src = frame.image;

    modal.classList.remove("hidden");
}

function closeFrameModal() {

    let modal =
        document.getElementById(
            "frame-modal"
        );

    modal.classList.add("hidden");

    selectedCapturedFrame = null;
}

function downloadSelectedFrame() {

    if (
        selectedCapturedFrame === null
    ) {
        return;
    }

    let link =
        document.createElement("a");

    link.href =
        selectedCapturedFrame.image;

    link.download =
        "AFH-Summer-Show-Frame.png";

    link.click();
}

async function sendSelectedFrameEmail() {

    // Prevent multiple sends at the same time
    if (isSendingEmail) {
        return;
    }

    // Make sure a frame was selected
    if (selectedCapturedFrame === null) {
        console.log("No frame selected");
        return;
    }

    let emailInput =
        document.getElementById("frame-email");

    let status =
        document.getElementById("frame-email-status");

    let sendButton =
        document.getElementById("email-frame-button");

    let email = emailInput.value.trim();

    // Make sure user entered an email
    if (email === "") {
        status.textContent =
            "Please enter your email.";
        return;
    }

    // Start sending
    isSendingEmail = true;
    sendButton.disabled = true;
    status.textContent = "Sending...";

    console.log("Sending frame to:", email);

    try {

        const response = await fetch(
            "http://localhost:5001/api/send-frame",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    image: selectedCapturedFrame.image
                })
            }
        );

        console.log(
            "Backend responded:",
            response.status
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Email failed"
            );
        }

        console.log("Email sent!", data);

        status.textContent =
            "Your frame was sent!";

    } catch (error) {

        console.error(
            "SEND EMAIL ERROR:",
            error
        );

        status.textContent =
            "Could not send your frame.";

    } finally {

        isSendingEmail = false;
        sendButton.disabled = false;
    }
}