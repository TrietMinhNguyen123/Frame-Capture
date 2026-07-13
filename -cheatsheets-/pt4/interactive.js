let elements = ["EARTH", "WIND", "FIRE", "WATER"];
let currentElementIndex = 0;

// text scaling vars
let elementScaleAmount = 0.5;
let minElementTextSize = 12;
let maxElementTextSize = 360;

// video vars
let elementVideos = {};
let elementTextLayer;

// audio vars
let elementAudios = {};
let audioStarted = false;

function setupInteractive() {
  for (let i = 0; i < elements.length; i++) {
    let elementName = elements[i];

    // switch out video for each element
    let videoPath = "assets/" + elementName.toLowerCase() + "_640.mp4";

    elementVideos[elementName] = createVideo(videoPath);
    elementVideos[elementName].hide();
    elementVideos[elementName].volume(0);
    elementVideos[elementName].loop();

    // switch out audio for each element
    let audioPath = "assets/" + elementName.toLowerCase() + ".mp3";

    elementAudios[elementName] = new Audio(audioPath);
    elementAudios[elementName].loop = true;
    elementAudios[elementName].volume = 0;
  }

  elementTextLayer = createGraphics(width, height);

  window.addEventListener("pointerdown", function () {
    audioStarted = true;

    for (let i = 0; i < elements.length; i++) {
      elementAudios[elements[i]].play();
    }
  }, { once: true });
}

// go to the next element, looping back to the first element if at the end
function advanceElement() {
  currentElementIndex++;

  if (currentElementIndex >= elements.length) {
    currentElementIndex = 0;
  }
}

function getCurrentElement() {
  return elements[currentElementIndex];
}

function updateElementScale(scaleAmount) {
  if (scaleAmount === null) {
    return;
  }

  elementScaleAmount = scaleAmount;
}

// draw the current element, including its video and text mask
function drawCurrentElement() {
  let elementTextSize = lerp(minElementTextSize, maxElementTextSize, elementScaleAmount);

  elementTextLayer.clear();

  let currentElement = getCurrentElement();
  let currentVideo = elementVideos[currentElement];

  elementTextLayer.image(currentVideo, 0, 0, width, height);

  if (audioStarted === true) {
    for (let i = 0; i < elements.length; i++) {
      let elementName = elements[i];

      if (elementName === currentElement) {
        elementAudios[elementName].volume = elementScaleAmount;
      } else {
        elementAudios[elementName].volume = 0;
      }
    }
  }

  elementTextLayer.drawingContext.globalCompositeOperation = "destination-in";
  elementTextLayer.textAlign(CENTER, CENTER);
  elementTextLayer.textStyle(BOLD);
  elementTextLayer.textSize(elementTextSize);
  elementTextLayer.fill(255);
  elementTextLayer.noStroke();
  elementTextLayer.text(getCurrentElement(), width / 2, height / 2);
  elementTextLayer.drawingContext.globalCompositeOperation = "source-over";

  image(elementTextLayer, 0, 0);

  textAlign(LEFT, BASELINE);
  textStyle(NORMAL);
}
