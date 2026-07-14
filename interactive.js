let elements = ["Hi There!", "MY NAME", "IS", "TRIET NGUYEN","AND","I", "AM", "THE", "GOAT"];

let currentElementIndex = 0;

let elementScaleAmount = 0.5;
let minElementTextSize = 12;
let maxElementTextSize = 160;

let elementVideos = {};
let elementTextLayer;

let elementAudios = {};
let audioStarted = false; 

function setupInteractive(){
    for(let i = 0; i < elements.length; i++){
        let elementName = elements[i];

        let videoPath = "assets/" + elementName.toLowerCase() + "_640.mp4";

        elementVideos[elementName] = createVideo(videoPath);
        elementVideos[elementName].hide();
        elementVideos[elementName].volume(0);
        elementVideos[elementName].loop();
    }

    elementTextLayer = createGraphics(width, height);
}

function advanceElement(){
    currentElementIndex++;
    
    if(currentElementIndex >= elements.length){
        currentElementIndex = 0;
    }
}

function getCurrentElement(){
    return elements[currentElementIndex];
}

function updateElementScale(scaleAmount){
    if(scaleAmount === null){
        return;
    }

    elementScaleAmount = scaleAmount; 
}

function drawCurrentElement(){
    let elementTextSize = lerp(minElementTextSize, maxElementTextSize, elementScaleAmount);

    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(elementTextSize);
    fill(255);
    stroke(0);
    strokeWeight(8);
    text(getCurrentElement(), width /2, height / 2);
    textAlign(LEFT, BASELINE);
    textStyle(NORMAL);
}