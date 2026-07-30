// let elements = ["EARTH", "WIND", "FIRE", "WATER"];

// let currentElementIndex = 0;

// let elementScaleAmount = 0.5;
// let minElementTextSize = 12;
// let maxElementTextSize = 160;

// let elementVideos = {};
// let elementTextLayer;

// let elementAudios = {};
// let audioStarted = false; 

// function setupInteractive(){
//     for(let i = 0; i < elements.length; i++){
//         let elementName = elements[i];

//         let videoPath = "assets/" + elementName.toLowerCase() + "_640.mp4";

//         elementVideos[elementName] = createVideo(videoPath);
//         elementVideos[elementName].hide();
//         elementVideos[elementName].volume(0);
//         elementVideos[elementName].loop();

//         let audioPath = "assets/" + elementName.toLowerCase() + ".mp3";
        
//         elementAudios[elementName] = createAudio(audioPath);
//         elementAudios[elementName].loop = true;
//         elementAudios[elementName].volume = 0;

//         elementTextLayer = createGraphics(width, height);

//         window.addEventListener("pointerdown", function() {
//             audioStarted = true;

//             for(let i = 0; i < elements.length; i++){
//                 elementAudios[elements[i]].play();
//             }
//         }, {once: true});
//     }

//     elementTextLayer = createGraphics(width, height);
// }

// function advanceElement(){
//     currentElementIndex++;
    
//     if(currentElementIndex >= elements.length){
//         currentElementIndex = 0;
//     }
// }

// function getCurrentElement(){
//     return elements[currentElementIndex];
// }

// function updateElementScale(scaleAmount){
//     if(scaleAmount === null){
//         return;
//     }

//     elementScaleAmount = scaleAmount; 
// }

// function drawCurrentElement(){
//     let elementTextSize = lerp(minElementTextSize, maxElementTextSize, elementScaleAmount);

//     elementTextLayer.clear();

//     let currentElement = getCurrentElement();
//     let currentVideo = elementVideos[currentElement];

//     elementTextLayer.image(currentVideo, 0, 0, width, height);

//     if(audioStarted === true){
//         for(i = 0; i < elements.length; i++){
//             elementName = elements[i];
//             if(elementName === currentElement){
//                 elementAudios[elementName].volume = elementScaleAmount;
//             }else{
//                 elementAudios[elementName].volume = 0;
//             }
//         }
//     }

//     elementTextLayer.drawingContext.globalCompositeOperation = "destination-in";
//     elementTextLayer.textAlign(CENTER, CENTER);
//     elementTextLayer.textStyle(BOLD);
//     elementTextLayer.textSize(elementTextSize);
//     elementTextLayer.fill(255);
//     elementTextLayer.noStroke();
//     elementTextLayer.text(getCurrentElement(), width / 2, height / 2);

//     elementTextLayer.drawingContext.globalCompositeOperation = "source-over";

//     image(elementTextLayer,0,0);

//     textAlign(LEFT, BASELINE);
//     textStyle(NORMAL);
// }


//--------------------------------------------------------------------------------------------------THIS IS A SEPARATOR FOR INTERACTIVE ELEMENTS SECTION---------------------------------------------------------------------