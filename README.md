# Practice Camera Pipelining

This project is a full-stack web app for real-time vehicle license plate recognition and information retrieval.

## What does it do?

- **Lets you access your camera via the browser**
- **Captures images and detects license plate text using image processing and OCR**
- **Fetches vehicle information from an API based on the detected plate**

---

## Key Parts of the Code

### 1. How the Camera is Accessed

The frontend uses JavaScript to access your camera and display the live feed:

```javascript
const videoFeed = document.getElementById('videoFeed');
let stream = null;

startCameraButton.addEventListener('click', async () => {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoFeed.srcObject = stream;
    // Enable capture button etc.
});
```

You can capture a frame, which gets drawn to a canvas and sent to the backend for processing.

### 2. How Text is Detected from the Image

The backend receives the captured image and uses OpenCV and EasyOCR to find and read text on the license plate:

```python
# Decode image and convert to grayscale
gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
bfilter = cv2.bilateralFilter(gray, 11, 17, 17)
edge = cv2.Canny(bfilter, 30, 200)

# Find contours for license plate
keypoints = cv2.findContours(edge.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
contours = imutils.grab_contours(keypoints)
contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

for contour in contours:
    approx = cv2.approxPolyDP(contour, 10, True)
    if len(approx) == 4:
        location = approx
        break

# Crop and OCR
cropped_image = gray[x1: x2+1, y1:y2+1]
reader = easyocr.Reader(['en'], gpu=False)
result = reader.readtext(cropped_image)
detected_text = [res[1] for res in result]
```

### 3. How the API is Called for Vehicle Info

After extracting the license plate text, the backend queries an API for vehicle details:

```python
def get_User_Info(license_plate_texts):
    cleaned_text = re.sub(r'[^a-zA-Z0-9]', '', license_plate_texts[0])
    license_plate = cleaned_text.upper()
    api_url = f"http://127.0.0.1:5001/api/vehicles/{license_plate}"  
    api_key = "your_secret_api_key_here"
    headers = { "x-api-key": api_key }
    response = requests.get(api_url, headers=headers)
    # Parse and return vehicle info from API response
```

## What you get

- **Frontend**: Web UI to interact with the camera, capture images, and view results.
- **Backend**: Python code for image processing, OCR, and API integration.
- **A working demo of building a license plate recognition system with real-time lookup.**

---

**Feel free to explore the code and try it out with your own camera and images!**
