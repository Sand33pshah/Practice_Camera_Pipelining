console.log("Script Loaded!")

const startCameraButton = document.getElementById('startCameraButton');
const stopCameraButton = document.getElementById('stopCameraButton');
const captureButton = document.getElementById('captureButton');
const videoFeed = document.getElementById('videoFeed');
const capturedCanvas = document.getElementById('capturedCanvas');
const ctx = capturedCanvas.getContext('2d');
const resultTextElement = document.getElementById('resultText');



let stream = null;

//start camera
startCameraButton.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoFeed.srcObject = stream;
        startCameraButton.disabled = true;
        stopCameraButton.disabled = false;
        captureButton.disabled = false;
    }
    catch (err) {
        alert('Could not access the camera: ' + err.message);
    }
});

//stop the video feed
stopCameraButton.addEventListener('click', () => {
    if (stream) {
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
    if (videoFeed.readyState === videoFeed.HAVE_ENOUGH_DATA) {
        capturedCanvas.width = videoFeed.videoWidth;
        capturedCanvas.height = videoFeed.videoHeight;
        ctx.drawImage(videoFeed, 0, 0, capturedCanvas.width, capturedCanvas.height);
        capturedCanvas.style.display = 'block';

        // --- convert canvas to base64 and send to backend ---
        const imageDataUrl = capturedCanvas.toDataURL('image/jpeg', 0.9);

        fetch('/process_image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageDataUrl })
        })

            .then(response => response.json())
            .then(data => {
                // Check if the server's response was a success
                // console.log('Backend response:', data);
                if (data.status === 'success') {
                    // The server sent an array of results. Join them for display.
                    const results = data.results.join(', ');
                    resultTextElement.textContent = results;
                    alert('Processing done! Results displayed below.');
                } else {
                    // Handle the case where the server returned an error
                    resultTextElement.textContent = `Error: ${data.message}`;
                    alert('Processing failed: ' + data.message);
                }
                console.log('Backend response:', data);
            })
            .catch(err => {
                resultTextElement.textContent = 'Error sending image to server.';
                alert('Error sending image to server: ' + err.message);
                console.error(err);
            });
    }
});