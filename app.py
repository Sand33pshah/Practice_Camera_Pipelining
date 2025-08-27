from flask import Flask, request, jsonify, send_from_directory
import base64
import numpy as np
import cv2
import imutils
import easyocr
import re
import requests

app = Flask(__name__)


@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

#New API Call Function
def get_User_Info(license_plate_texts):
    if not license_plate_texts or not license_plate_texts[0]:
        return {'found': False, 'message': 'No license plate text provided.'}
    
    cleaned_text = re.sub(r'[^a-zA-Z0-9]', '', license_plate_texts[0])
    license_plate = cleaned_text.upper()
    print("Cleaned License Plate:", license_plate)
    
    #API Details
    api_url = f"http://127.0.0.1:5001/api/vehicles/{license_plate}"  
    api_key = "your_secret_api_key_here"
    
    headers = {
        "x-api-key": api_key
    }
    
    try:
        response = requests.get(api_url, headers=headers)
        if response.status_code == 200:
            vehicle_data =  response.json()
            return{
                'found': True,
                'license_plate' : vehicle_data.get("licence_plate", "N/A"),
                'owner_name' : vehicle_data.get("owner_name", "N/A"),
                'vehicle_model' : vehicle_data.get("make_model", "N/A"),
                'registration_year' :  vehicle_data.get("registration_date", "N/A") 
            }    
        elif response.status_code == 404:
            print("Vehicle not found in the database.")
            return {'found': False, 'message': 'Vehicle not found in database'}
        else:
            print(f"API Error: {response.status_code} - {response.text}")
            return {'found': False, 'message': f"API Error: {response.status_code}"}
        
    except requests.exceptions.RequestException as e:
        return {'found': False, 'message': "API request failed: " + str(e)}


@app.route('/process_image', methods=['POST'])
def process_image():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'status': 'error', 'message': 'No Image data provided', 'results': []}), 400

        # Remove the prefix, e.g, "data:image/jpeg;base64,"
        image_b64 = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_b64)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        image_np = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image_np is None:
            return jsonify({'staus': 'error', 'message': 'Image decode failed!', 'results':[]}), 400

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
            detected_text = [res[1] for res in result]
            print("Detected Text:", result)
            print("Detected license plate Text Extract:", detected_text)
            
            if not detected_text:
                return jsonify({'status': 'error', 'message': 'No text detected on license plate', 'results': []}), 404
            
            #Calling API only if text is found
            user_info = get_User_Info(detected_text)
            print("User Info:", user_info)
            return jsonify({
                'status': 'success',
                'results': detected_text,
                'user_info': user_info
            }), 200
        else:
            return jsonify({'status': 'error', 'message': 'No license plate contour found', 'results': []}), 404
        # --- End Object Detection and OCR ---

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e), 'results':[]}), 500


if __name__ == '__main__':
    app.run(debug=True)
