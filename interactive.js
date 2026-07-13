let elements = ["I", "AM", "THE", "GOAT", "THIS", "IS", "AT", "TEST", "RUN"];

let currentElementIndex = 0;

let elementScaleAmount = 0.5;
let minElementTextSize = 12;
let maxElementTextSize = 360;

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