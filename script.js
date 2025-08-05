const startCameraButton = document.getElementById('startCameraButton');
const stopCameraButton = document.getElementById('stopCameraButton');
const captureButton = document.getElementById('captureButton');
const videoFeed = document.getElementById('videoFeed');
const capturedCanvas = document.getElementById('capturedCanvas');
const ctx = capturedCanvas.getContext('2d');

let stream = null;

//start camera
startCameraButton.addEventListener('click', async () => {
    try{
        stream = await navigator.mediaDevices.getUserMedia({ video: true});
        videoFeed.srcObject = stream;
        startCameraButton.disabled = true;
        stopCameraButton.disabled = false;
        captureButton.disabled = false
    }
    catch(err){
        alert('Could not access the camera: '+ err.message);
    }
});

//stop the video feed
stopCameraButton.addEventListener('click', () => {
    if(stream){
        stream.getTracks().forEach(track => track.stop());
        videoFeed.srcObject = null;
        stream = null;
        startCameraButton.disabled = false;
        stopCameraButton.disabled = true;
        captureButton.disabled = true;
        capturedCanvas.style.display = 'none';
    }
});


//capture the frame out of video feed
captureButton.addEventListener('click', () => {
    if(videoFeed.readyState === videoFeed.HAVE_ENOUGH_DATA) {
        capturedCanvas.width = videoFeed.videoWidth;
        capturedCanvas.height = videoFeed.videoHeight;
        ctx.drawImage(videoFeed, 0, 0, capturedCanvas.width, capturedCanvas.height);
        capturedCanvas.style.display = 'block';
    }
})