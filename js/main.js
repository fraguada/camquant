//variables
// get the first canvas element in index.html
let canvas = document.querySelector('canvas');

// get the 2d drawing context of the canvas.
// this is where the resulting image will go
let canvasContext = canvas.getContext("2d");

// gets the first video element in index.html
let videoElement = document.querySelector('video');

// gets the first button element in index.html
let button = document.querySelector('button');

// gets the first input element in index.html
let slider = document.querySelector('input');

// gets the div with id 'sliderValue' from index.html
let sliderValue = document.getElementById('sliderValue');

// boolean for knowing if video is streaming or not
let streaming = false;

// the id of the timer created in the setInterval() api call
let refreshIntervalId = null;

// varialble, how often to run the clustering function
let interval = 50; //ms to run clustering

// initial number of clusters/colors to extract from video
let k = 6;

// initial number of samples to extract from the video for generating the cluster centers
let samples = 1000;

// camera utilities to start and stop video stream and report errors
let utils = new CamUtils('errorMessage');

// what happens when the button is clicked
button.addEventListener('click', () => {
    if (!streaming) {
        utils.clearError();
        utils.startCamera('vga', onVideoStarted, videoElement);
    } else {
        utils.stopCamera();
        onVideoStopped();
    }
});

// what happens when the input/range/slider is changed
slider.addEventListener('input', () => {
    sliderValue.innerText = 'Number of clusters: ' + slider.value;
    k = slider.value;
});

// what happens when video is started. here is where we set up a timer to run the kmeans on the video.
function onVideoStarted() {
    streaming = true;
    button.innerText = 'Stop Video';

    // start the timer
    refreshIntervalId = setInterval('clusterVideo();', 50);
}

// what happens when video is stopped
function onVideoStopped() {
    streaming = false;
    button.innerText = 'Start Video';

    // stop the timer
    clearInterval(refreshIntervalId);
}

// run kmeans on the video input
function clusterVideo(){

    // draw the video onto the canvas. probably can be avoided somehow.
    canvasContext.drawImage(videoElement, 0, 0, videoElement.width, videoElement.height);

    // get the pixel data which is [r,g,b,a,r,g,b,a...]
    let data = canvasContext.getImageData(0, 0, videoElement.width, videoElement.height).data;

    // will be a flat array [r,g,b,r,g,b...] of the pixel data
    let colors = [];

    // fill the colors array with just rgb, omitting a
    for(let i = 0; i < data.length; i=i+4)
    {
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];
        let color = [r,g,b];
        colors.push(color);
    }

    // will be an array of n random colors from our video stream, where n is the number of samples
    let colorsSample = [];

    // fill up the colorSample array with the color of random pixels from the video stream
    for(let i = 0; i < samples; i++){
        let id = getRandomInt(colors.length-1);
        colorsSample.push(colors[id]);
    }

    // run the kmeans on the sampled colors. return an object 'res' with information on the clustering
    let res = skmeans(colorsSample,k);

    // convert all of the video pixels to the closest centriod / color

    // create an image data object to fill with the result of the clustering
    let imageData = canvasContext.createImageData(videoElement.width, videoElement.height);

    let cnt = 0;

    // go through all of the pixels
    for(let i = 0; i < colors.length; i++)
    {
        let closestId = -1;
        let closestDist = 10000;

        // go through the centroids/resulting colors and compare with the pixel color to find closest centroid
        for(let j = 0; j < res.centroids.length; j++){

            let x1 = colors[i][0];
            let y1 = colors[i][1];
            let z1 = colors[i][2];
            let x2 = res.centroids[j][0];
            let y2 = res.centroids[j][1];
            let z2 = res.centroids[j][2];

            // calculate the 3d distance from video pixel to this centroid
            let dist = distance(x1,y1,z1,x2,y2,z2);

            // sort the distances, keep if distance is smaller than previous
            if(dist < closestDist)
            {
                closestDist = dist;
                closestId = j;
            }
        }

        // fill the image data object [r,g,b,a,r,g,b,a...]
        // counter keeps moving the position on the array fwd

        //r
        imageData.data[cnt] = res.centroids[closestId][0];
        cnt++;
        //g
        imageData.data[cnt] = res.centroids[closestId][1];
        //b
        cnt++;
        imageData.data[cnt] = res.centroids[closestId][2];
        cnt++;
        //a
        imageData.data[cnt] = 255;
        cnt++;

    }

    // paint the canvas element with the resulting image data
    canvasContext.putImageData(imageData, 0, 0);
}

// utility function to get a random integer
let getRandomInt = function (max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

// utility function to calculate the 3d distance between two vectors / colors, etc
let distance = function(x1, y1, z1, x2, y2, z2){
    let dx = x2 - x1;
    let dy = y2 - y1;
    let dz = z2 - z1;
    
    // hi Pythegoras
    let dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2));
    
    return dist;
}
