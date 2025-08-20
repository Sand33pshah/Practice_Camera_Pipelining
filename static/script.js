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
// startCameraButton.addEventListener('click', async () => {
//     navigator.mediaDevices.enumerateDevices()
//         .then(devices => {
//             devices.forEach(device => {
//                 console.log(device.kind, device.label, device.deviceId);
//             });
//         });
//     try {
//         stream = await navigator.mediaDevices.getUserMedia({
//             video: { deviceId: { exact: device.deviceId } }
//         });
//         videoFeed.srcObject = stream;
//         startCameraButton.disabled = true;
//         stopCameraButton.disabled = false;
//         captureButton.disabled = false;
//     }
//     catch (err) {
//         alert('Could not access the camera: ' + err.message);
//     }
// });


startCameraButton.addEventListener('click', async () => {
    try {
        // First get the list of devices
        const devices = await navigator.mediaDevices.enumerateDevices();

        // Find the Redmi K20 Pro camera
        const phoneCamera = devices.find(device =>
            device.kind === 'videoinput' &&
            device.label.includes('Redmi K20 Pro')
        );

        let cameraToUSe = phoneCamera;
        // If the specific phone camera is not found, you can choose another one
        if (!cameraToUSe) {
            cameraToUSe = devices.find(device => device.kind === 'videoinput');
            // If no camera is found, alert the user
            if (!cameraToUSe) {
                alert('No camera found!');
                return;
            }
            else {
                alert('Redmi K20 Pro camera not found, using the first available camera instead.');
            }
        }

        // Now start the stream from that device
        stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: cameraToUSe.deviceId } }
        });

        videoFeed.srcObject = stream;
        startCameraButton.disabled = true;
        stopCameraButton.disabled = false;
        captureButton.disabled = false;

    } catch (err) {
        alert('Could not access the camera: ' + err.message);
        console.error(err);
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