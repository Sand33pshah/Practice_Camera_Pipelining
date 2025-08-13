from flask import Flask, request, jsonify, send_from_directory
import base64
import numpy as np
import cv2
import imutils
import easyocr

app = Flask(__name__)


@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')


@app.route('/process_image', methods=['POST'])
def process_image():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'status': 'error', 'message': 'No Image data provided'}), 400

        # Remove the prefix, e.g, "data:image/jpeg;base64,"
        image_b64 = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_b64)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        image_np = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image_np is None:
            return jsonify({'staus': 'error', 'message': 'Image decode failed!'}), 400

        # object detection begins
        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
        bfilter = cv2.bilateralFilter(gray, 11, 17, 17)
        edge = cv2.Canny(bfilter, 30, 200)
        keypoints = cv2.findContours(
            edge.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        contours = imutils.grab_contours(keypoints)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

        location = None
        for contour in contours:
            approx = cv2.approxPolyDP(contour, 10, True)
            if len(approx) == 4:
                location = approx
                break

        if location is not None:
            mask = np.zeros(gray.shape, np.uint8)
            newImage = cv2.drawContours(mask, [location], 0, 255, -1)
            newImage = cv2.bitwise_and(image_np, image_np, mask=mask)

            (x, y) = np.where(mask == 255)
            (x1, y1) = (np.min(x), np.min(y))
            (x2, y2) = (np.max(x), np.max(y))

            cropped_image = gray[x1: x2+1, y1:y2+1]

            reader = easyocr.Reader(['en'], gpu=False)
            result = reader.readtext(cropped_image)
            # Optionally, extract only the text parts:
            text_results = [res[1] for res in result]
            return jsonify({'status': 'success', 'results': text_results}), 200
        else:
            return jsonify({'status': 'error', 'message': 'No license plate contour found'}), 200
        # --- End Object Detection and OCR ---

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
