# 👐 HandPose Filter Window Project

<p style="color:#6ee7b7;"><strong>Goal:</strong> Use two hands to create a resizable filter window over the webcam. The midpoint between the thumb and index finger on each hand becomes one corner of the window. A quick right-hand flick stamps the filtered image onto the canvas.</p>

---

<details open>
<summary><strong>🗺️ Big Picture</strong></summary>

This project uses two detected hands as controls:

* The **left-hand pinch point** controls one corner of the filter area.
* The **right-hand pinch point** controls the opposite corner.
* Moving the hands farther apart makes the filter area larger.
* Moving the hands closer together makes it smaller.
* Flicking the right hand quickly stamps the current filtered area in place.
* Number keys change the active filter.
* Pressing `C` removes all stamped filter areas.

The filter is not an ml5 feature. ml5 only gives us the hand positions. The actual visual filter is created using p5.js.

</details>

---

<details>
<summary><strong>🧹 <span style="color:#f87171;">Step 1: Remove The Old Interactive Project</span></strong></summary>

You will no longer need:

* The `elements` array
* Element videos
* Element audio
* Text scaling
* `setupInteractive()`
* `drawCurrentElement()`
* `advanceElement()`
* The `interactive.js` file

Remove this line from your HTML:

```html
<script src="interactive.js"></script>
```

Your new project only needs:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.3/p5.min.js"></script>
<script src="https://unpkg.com/ml5@1/dist/ml5.min.js"></script>
<script src="sketch.js"></script>
```

<p style="color:#fbbf24;"><strong>💡 Important:</strong> You can delete <code>interactive.js</code>, or leave it in your folder without importing it. It should not run in this project.</p>

</details>

---

<details>
<summary><strong>📄 <span style="color:#60a5fa;">Step 2: Create The HTML File</span></strong></summary>

Create or replace your `index.html` with this:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>HandPose Filter Window</title>

    <link rel="stylesheet" href="style.css">
</head>

<body>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.3/p5.min.js"></script>
    <script src="https://unpkg.com/ml5@1/dist/ml5.min.js"></script>
    <script src="sketch.js"></script>

</body>
</html>
```

The order of the script tags matters:

1. p5.js loads first.
2. ml5.js loads second.
3. Your sketch loads last.

</details>

---

<details>
<summary><strong>🎨 <span style="color:#f472b6;">Step 3: Style The Page</span></strong></summary>

Create a file named `style.css`:

```css
html,
body {
    margin: 0;
    min-height: 100%;
}

body {
    min-height: 100vh;
    background: black;
    display: grid;
    place-items: center;
    overflow: hidden;
}

canvas {
    display: block;
    max-width: 100vw;
    max-height: 100vh;
    width: auto !important;
    height: auto !important;
}
```

This centers the canvas and gives the page a black background.

</details>

---

<details>
<summary><strong>🧠 <span style="color:#c084fc;">Step 4: Create The Main HandPose Variables</span></strong></summary>

At the top of `sketch.js`, add:

```js
let handPose;
let video;
let hands = [];

let canvasWidth = 960;
let canvasHeight = 720;
```

These variables store:

* The HandPose model
* The webcam
* The detected hands
* The canvas dimensions

Next, create the fingertip index variables:

```js
let thumbTipIndex = 4;
let indexTipIndex = 8;

let fingerTipIndexes = [
    thumbTipIndex,
    indexTipIndex
];
```

HandPose uses index `4` for the thumb tip and index `8` for the index-finger tip.

</details>

---

<details>
<summary><strong>🎛️ <span style="color:#38bdf8;">Step 5: Create The Filter Variables</span></strong></summary>

Add these variables under the HandPose variables:

```js
let cameraFrame;

let leftControlPoint = null;
let rightControlPoint = null;

let currentFilterArea = null;

let frozenFilterAreas = [];

let minimumFilterAreaSize = 30;
let maximumFrozenAreas = 20;
```

Here is what they do:

* `cameraFrame` stores a clean copy of the webcam frame.
* `leftControlPoint` stores the left-hand pinch position.
* `rightControlPoint` stores the right-hand pinch position.
* `currentFilterArea` stores the rectangle between the two hands.
* `frozenFilterAreas` stores filter areas that have been stamped.
* `minimumFilterAreaSize` prevents tiny accidental filter rectangles.
* `maximumFrozenAreas` prevents the array from becoming too large.

The control point is the midpoint between the thumb and index finger.

</details>

---

<details>
<summary><strong>🌈 <span style="color:#fb7185;">Step 6: Create The Filter List</span></strong></summary>

Add a list of filters:

```js
let filterNames = [
    "grayscale",
    "blur",
    "retro",
    "invert"
];

let currentFilterIndex = 0;
```

The project will support four filters:

1. Grayscale
2. Blur
3. Retro posterization
4. Invert

You will use the number keys to select them.

</details>

---

<details>
<summary><strong>💨 <span style="color:#fb923c;">Step 7: Create The Flick Variables</span></strong></summary>

Add:

```js
let previousRightHandX = null;

let flickThreshold = 55;
let flickCooldown = 650;
let lastFlickTime = -Infinity;
```

The sketch detects a flick by comparing the current right-hand x position with its previous x position.

If the hand moves more than `55` pixels between updates, the movement counts as a flick.

The cooldown prevents one flick from stamping multiple copies.

<p style="color:#fbbf24;"><strong>💡 Tuning:</strong> If the flick activates too easily, increase <code>flickThreshold</code>. If it is difficult to activate, decrease it.</p>

</details>

---

<details>
<summary><strong>📦 <span style="color:#34d399;">Step 8: Load HandPose</span></strong></summary>

Create the `preload()` function:

```js
function preload() {
    handPose = ml5.handPose();
}
```

This prepares the model before the rest of the sketch starts.

</details>

---

<details>
<summary><strong>📷 <span style="color:#22c55e;">Step 9: Set Up The Canvas And Webcam</span></strong></summary>

Create the `setup()` function:

```js
function setup() {
    pixelDensity(1);

    createCanvas(canvasWidth, canvasHeight);

    video = createCapture(VIDEO, {
        flipped: true
    });

    video.size(canvasWidth, canvasHeight);
    video.hide();

    cameraFrame = createGraphics(
        canvasWidth,
        canvasHeight
    );

    cameraFrame.pixelDensity(1);

    handPose.detectStart(video, gotHands);

    textFont("monospace");
}
```

This line:

```js
pixelDensity(1);
```

reduces the amount of pixel processing p5 must perform. This can improve filter performance.

The `cameraFrame` graphics layer stores the clean webcam image.

That matters because stamped filters should capture the webcam—not previously stamped filter areas.

</details>

---

<details>
<summary><strong>📥 <span style="color:#facc15;">Step 10: Save The Detection Results</span></strong></summary>

Create the HandPose callback:

```js
function gotHands(results) {
    hands = results;
}
```

Whenever HandPose finishes analyzing a frame, it sends the detected hand data into this function.

</details>

---

<details>
<summary><strong>🔄 <span style="color:#818cf8;">Step 11: Build The Main Draw Loop</span></strong></summary>

Start your `draw()` function:

```js
function draw() {
    background(0);

    cameraFrame.clear();
    cameraFrame.image(
        video,
        0,
        0,
        width,
        height
    );

    image(cameraFrame, 0, 0);

    leftControlPoint = null;
    rightControlPoint = null;
    currentFilterArea = null;
}
```

Every frame:

1. The canvas is cleared.
2. The current webcam image is copied into `cameraFrame`.
3. The clean camera frame is drawn.
4. The previous hand control points are cleared.

</details>

---

<details>
<summary><strong>👐 <span style="color:#2dd4bf;">Step 12: Find The Left And Right Hands</span></strong></summary>

Still inside `draw()`, loop through the detected hands:

```js
function draw() {
    background(0);

    cameraFrame.clear();
    cameraFrame.image(
        video,
        0,
        0,
        width,
        height
    );

    image(cameraFrame, 0, 0);

    leftControlPoint = null;
    rightControlPoint = null;
    currentFilterArea = null;

    // New code starts here
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
}
```

Now create the two helper functions outside `draw()`:

```js
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
```

The names look reversed because your webcam image is mirrored.

Your previous project used the same reversal.

<p style="color:#f87171;"><strong>🚨 Possible difference:</strong> If the project identifies your hands backward, swap <code>"right"</code> and <code>"left"</code> in these two functions.</p>

</details>

---

<details>
<summary><strong>📍 <span style="color:#86efac;">Step 13: Calculate The Pinch Center</span></strong></summary>

Create this function:

```js
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
```

This function finds the midpoint between the thumb and index fingertips.

The midpoint becomes a control point:

```js
return {
    x: centerX,
    y: centerY
};
```

Each hand produces one control point.

The two points will become opposite corners of the filter rectangle.

</details>

---

<details>
<summary><strong>🔲 <span style="color:#93c5fd;">Step 14: Create The Rectangle Between The Hands</span></strong></summary>

Add this function:

```js
function createFilterArea(pointA, pointB) {
    let areaX = min(pointA.x, pointB.x);
    let areaY = min(pointA.y, pointB.y);

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
```

This function receives two points.

It determines:

* The rectangle's top-left x position
* The rectangle's top-left y position
* Its width
* Its height

Using `min()` allows either hand to be on either side of the canvas.

Using `abs()` makes the width and height positive.

</details>

---

<details>
<summary><strong>🖼️ <span style="color:#f0abfc;">Step 15: Extract A Piece Of The Webcam</span></strong></summary>

Create this function:

```js
function getCameraRegion(area) {
    return cameraFrame.get(
        area.x,
        area.y,
        area.width,
        area.height
    );
}
```

The `get()` function copies a rectangular group of pixels from `cameraFrame`.

For example:

```js
cameraFrame.get(100, 100, 300, 200);
```

copies a `300 × 200` area beginning at position `100, 100`.

</details>

---

<details>
<summary><strong>🌈 <span style="color:#c084fc;">Step 16: Apply The Selected Filter</span></strong></summary>

Create this function:

```js
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
```

The function:

1. Copies a piece of the webcam.
2. Checks which filter is selected.
3. Applies that filter.
4. Returns the filtered image.

### Grayscale

```js
region.filter(GRAY);
```

Removes the color.

### Blur

```js
region.filter(BLUR, 8);
```

Blurs the pixels. Increasing `8` creates a stronger blur, but it can also reduce performance.

### Retro

```js
region.filter(POSTERIZE, 5);
```

Reduces the number of colors, creating a posterized retro-camera effect.

### Invert

```js
region.filter(INVERT);
```

Reverses the pixel colors.

</details>

---

<details>
<summary><strong>👁️ <span style="color:#4ade80;">Step 17: Draw The Live Filter Preview</span></strong></summary>

Create this function:

```js
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
```

This draws the filtered webcam pixels back onto the canvas at the same position they came from.

The result looks like a filter window sitting over the webcam.

Create a border function too:

```js
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
```

The green border shows where the active filter area is located.

</details>

---

<details>
<summary><strong>📌 <span style="color:#fb7185;">Step 18: Store A Frozen Filter Area</span></strong></summary>

Create this function:

```js
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
```

Each frozen area stores:

* Its x position
* Its y position
* Its width
* Its height
* Its filtered image

The image is no longer connected to the live webcam. It stays unchanged while the webcam continues moving.

This line limits the number of saved areas:

```js
frozenFilterAreas.shift();
```

It removes the oldest saved area when there are more than 20.

</details>

---

<details>
<summary><strong>🧊 <span style="color:#38bdf8;">Step 19: Draw The Frozen Areas</span></strong></summary>

Create:

```js
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
```

This loops through every saved filter area and draws it onto the canvas.

Because these images are drawn every frame, they remain visible even after the webcam changes.

</details>

---

<details>
<summary><strong>💨 <span style="color:#fbbf24;">Step 20: Detect The Right-Hand Flick</span></strong></summary>

Create this function:

```js
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
```

This line calculates how far the right hand moved:

```js
let movementX =
    point.x - previousRightHandX;
```

This checks whether the hand moved fast enough:

```js
abs(movementX) > flickThreshold
```

`abs()` means the flick works in either horizontal direction.

When the movement passes the threshold:

```js
stampCurrentFilterArea();
```

the current filter window is frozen in place.

</details>

---

<details>
<summary><strong>🔴 <span style="color:#f87171;">Step 21: Draw The Fingertips And Control Points</span></strong></summary>

Create the fingertip drawing function:

```js
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
```

Create another function for the pinch centers:

```js
function drawControlPoint(point, label) {
    fill(0, 255, 180);
    noStroke();

    circle(point.x, point.y, 18);

    fill(255);
    textSize(14);
    textAlign(LEFT, CENTER);

    text(
        label,
        point.x + 14,
        point.y
    );
}
```

The red dots show the thumb and index fingertips.

The larger green dots show the midpoint used to create the rectangle.

</details>

---

<details>
<summary><strong>⌨️ <span style="color:#60a5fa;">Step 22: Add Keyboard Controls</span></strong></summary>

Create the `keyPressed()` function:

```js
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
```

The controls are:

* `1`: Grayscale
* `2`: Blur
* `3`: Retro
* `4`: Invert
* `C`: Clear all frozen areas
* `S`: Stamp manually for testing

The `S` key is useful while testing the project. It lets you make sure stamping works before debugging the flick gesture.

</details>

---

<details>
<summary><strong>📝 <span style="color:#f472b6;">Step 23: Draw Instructions On The Canvas</span></strong></summary>

Create:

```js
function drawInterface() {
    let filterName =
        filterNames[currentFilterIndex];

    noStroke();
    fill(0, 170);
    rect(16, 16, 350, 100, 10);

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
```

This shows the active filter and the available controls.

</details>

---

<details>
<summary><strong>🧩 <span style="color:#6ee7b7;">Step 24: Finish The Draw Function</span></strong></summary>

Replace your unfinished `draw()` function with this complete version:

```js
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

    // Reset the hand controls.
    leftControlPoint = null;
    rightControlPoint = null;
    currentFilterArea = null;

    // Find the control point for each hand.
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

    // Draw filter areas that were already stamped.
    drawFrozenFilterAreas();

    // Create the live filter when both hands exist.
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

    // Draw fingertips after the filters.
    for (let i = 0; i < hands.length; i++) {
        drawFingerTips(hands[i]);
    }

    // Draw the two rectangle control points.
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
```

The order is important:

1. Draw the webcam.
2. Find both hand positions.
3. Draw frozen areas.
4. Draw the live filter.
5. Detect the flick.
6. Draw fingertip controls.
7. Draw the interface.

</details>

---

<details open>
<summary><strong>✅ <span style="color:#6ee7b7;">Complete <code>sketch.js</code></span></strong></summary>

```js
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
```

</details>

---

<details open>
<summary><strong>🧪 <span style="color:#facc15;">Checkpoint: Test The Project</span></strong></summary>

Start the project using Live Server.

Then test it in this order:

1. Allow camera permission.
2. Hold up both hands.
3. Point the thumb and index finger of each hand toward each other.
4. Move your hands apart.
5. Check whether a green rectangular filter area appears.
6. Press `1`, `2`, `3`, and `4` to change filters.
7. Press `S` to test stamping.
8. Move the right hand quickly sideways to test the flick.
9. Press `C` to clear the frozen images.

Testing with `S` first is important. If the `S` key successfully stamps the image but the flick does not, then the filter system works and only the flick sensitivity needs adjustment.

</details>

---

<details>
<summary><strong>⚙️ <span style="color:#fb923c;">Adjusting The Flick Sensitivity</span></strong></summary>

The flick sensitivity is controlled here:

```js
let flickThreshold = 55;
```

If normal hand movement accidentally stamps the image, increase it:

```js
let flickThreshold = 75;
```

If the flick is too difficult, decrease it:

```js
let flickThreshold = 35;
```

The cooldown is controlled here:

```js
let flickCooldown = 650;
```

This value is measured in milliseconds.

A value of `650` means the sketch waits approximately 0.65 seconds before accepting another flick.

</details>

---

<details>
<summary><strong>🐌 <span style="color:#f87171;">Fixing Slow Performance</span></strong></summary>

Applying filters every frame can be expensive, especially blur.

If the project becomes slow, first reduce the canvas size:

```js
let canvasWidth = 640;
let canvasHeight = 480;
```

You can also reduce the blur strength:

```js
region.filter(BLUR, 4);
```

Instead of:

```js
region.filter(BLUR, 8);
```

A large live filter rectangle takes more processing power than a small one because p5 must modify more pixels.

</details>

---

<details>
<summary><strong>🛠️ <span style="color:#a78bfa;">Common Problems</span></strong></summary>

### The left and right hands are reversed

Swap the values in these functions:

```js
function isLeftHand(hand) {
    return hand.handedness
        .toString()
        .toLowerCase() === "left";
}

function isRightHand(hand) {
    return hand.handedness
        .toString()
        .toLowerCase() === "right";
}
```

Different HandPose and camera-flipping configurations may report handedness differently.

### The rectangle does not appear

Make sure:

* Both hands are visible.
* The thumb and index fingers are visible.
* The hands are far enough apart.
* The rectangle is at least 30 pixels wide and tall.

You can reduce the minimum size:

```js
let minimumFilterAreaSize = 15;
```

### The frozen area disappears

Make sure this function is called after the webcam is drawn:

```js
drawFrozenFilterAreas();
```

The correct order is:

```js
image(cameraFrame, 0, 0);
drawFrozenFilterAreas();
```

Drawing the camera after the frozen images would cover them.

### The flick stamps repeatedly

Increase either:

```js
let flickThreshold = 75;
```

or:

```js
let flickCooldown = 1000;
```

### The filter area flickers

HandPose coordinates naturally shake slightly. This is called tracking jitter.

A future improvement would be to smooth the coordinates using `lerp()`.

</details>

---

<details>
<summary><strong>🧠 <span style="color:#2dd4bf;">How The Full System Works</span></strong></summary>

The project has three main systems.

### 1. Hand tracking

ml5 detects both hands and gives the sketch fingertip positions.

```js
handPose.detectStart(video, gotHands);
```

### 2. Filter rectangle

The midpoint between the thumb and index finger becomes a control point.

```js
let centerX =
    width - (
        (thumbTip.x + indexTip.x) / 2
    );
```

The two hand control points become opposite corners of a rectangle.

```js
currentFilterArea = createFilterArea(
    leftControlPoint,
    rightControlPoint
);
```

### 3. Frozen image stamping

The current webcam pixels are copied:

```js
let filteredImage =
    getFilteredRegion(currentFilterArea);
```

Then the filtered image and its position are stored:

```js
frozenFilterAreas.push({
    x: currentFilterArea.x,
    y: currentFilterArea.y,
    width: currentFilterArea.width,
    height: currentFilterArea.height,
    image: filteredImage
});
```

The image is now independent from the live camera and can remain frozen on the canvas.

</details>
