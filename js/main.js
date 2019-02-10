let canvas = document.querySelector('canvas');
let canvasContext = canvas.getContext("2d");
let videoElement = document.querySelector('video');
let button = document.querySelector('button');
let slider = document.querySelector('input');
let sliderValue = document.getElementById('sliderValue');
let streaming = false;
let refreshIntervalId = null;
let interval = 50; //ms to run clustering
let centroidCnt = [];

let k = 6;
let samples = 1000;

let utils = new CamUtils('errorMessage');

button.addEventListener('click', () => {
    if (!streaming) {
        utils.clearError();
        utils.startCamera('vga', onVideoStarted, videoElement);
    } else {
        utils.stopCamera();
        onVideoStopped();
    }
});

slider.addEventListener('input', () => {
    sliderValue.innerText = 'Number of clusters: ' + slider.value;
    k = slider.value;
});

function onVideoStarted() {
    streaming = true;
    button.innerText = 'Stop Video';
    refreshIntervalId = setInterval('clusterVideo();', 50);
}

function onVideoStopped() {
    streaming = false;
    button.innerText = 'Start Video';
    clearInterval(refreshIntervalId);
}

function clusterVideo(){

    canvasContext.drawImage(videoElement, 0, 0, videoElement.width, videoElement.height);
    let data = canvasContext.getImageData(0, 0, videoElement.width, videoElement.height).data;

    let colors = [];

    for(let i = 0; i < data.length; i=i+4)
    {
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];
        let color = [r,g,b];
        colors.push(color);
    }

    let colorsSample = [];
    // get n ids from colors.length
    for(let i = 0; i < samples; i++){
        let id = getRandomInt(colors.length-1);
        colorsSample.push(colors[id]);
    }

    let res = skmeans(colorsSample,k);

    let imageData = canvasContext.createImageData(videoElement.width, videoElement.height);

    let cnt = 0;
    for(let i = 0; i < colors.length; i++)
    {
        let closestId = -1;
        let closestDist = 10000;
        for(let j = 0; j < res.centroids.length; j++){

            let x1 = colors[i][0];
            let y1 = colors[i][1];
            let z1 = colors[i][2];
            let x2 = res.centroids[j][0];
            let y2 = res.centroids[j][1];
            let z2 = res.centroids[j][2];

            let dist = distance(x1,y1,z1,x2,y2,z2);

            if(dist < closestDist)
            {
                closestDist = dist;
                closestId = j;
            }
        }

        //console.log(closestId);

        centroidCnt[closestId]++;

        imageData.data[cnt] = res.centroids[closestId][0];
        cnt++;
        imageData.data[cnt] = res.centroids[closestId][1];
        cnt++;
        imageData.data[cnt] = res.centroids[closestId][2];
        cnt++;
        imageData.data[cnt] = 255;
        cnt++;

    }

    //console.log(myImageData);

    canvasContext.putImageData(imageData, 0, 0);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

let distance = function(x1, y1, z1, x2, y2, z2){
    let dx = x2 - x1;
    let dy = y2 - y1;
    let dz = z2 - z1;
    
    let dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2));
    
    return dist;
}

let sliderUpdate = function(){}
