const startCameraButton = document.getElementById('startCameraButton');
const stopCameraButton = document.getElementById('stopCameraButton');
const captureButton = document.getElementById('captureButton');
const videoFeed = document.getElementById('videoFeed');
const capturedCanvas = document.getElementById('capturedCanvas');
const ctx = capturedCanvas.getContext('2d');

let stream = null;

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