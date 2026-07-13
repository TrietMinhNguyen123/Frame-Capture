//var to hodl handpose mdoel
let handPose;
// var to hold video
let video;

//store hands
let hands = [];

let canvasWidth = 960;
let canvasHeight = 720;


//preload model and store in handPose to make sure we hve cess to it before setup() and draw() functions
function preload() {
    handPose = ml5.handPose();
}


function setup() {
    //set canvas size
    createCanvas(canvasWidth, canvasHeight);
    // save video capsture to video var
    video = createCapture(VIDEO, { flipped:true });
    // set video size
    video.size(canvasWidth, canvasHeight);
    // hide video
    video.hide();

       // Start detecting hands from the webcam video
    handPose.detectStart(video, gotHands);
}


// Callback function for when handPose outputs data
function gotHands(results) {
  // Save the output to the hands variable
  hands = results;
}


function draw() {
  background(0);
  image(video, 0, 0, width, height);

    // Draw all the tracked hand points
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];

      for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];

      fill(0, 255, 0);
      noStroke();
      circle(width - keypoint.x, keypoint.y, 12);
    }
  }
}			          
