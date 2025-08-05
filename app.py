from flask import Flask, request, jsonify, send_from_directory
import base64
import numpy as np
import cv2




app = Flask(__name__)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/process_image', methods=['POST'])
def process_image():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'status':'error', 'message':'No Image data provided'}), 400
        
        #Remove the prefix, e.g, "data:image/jpeg;base64,"
        image_b64 = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_b64)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        image_np = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image_np is None:
            return jsonify({'staus':'error','message':'Image decode failed!'}), 400
        
        # --- We'll add edge detection and returning image in next step ---
        return jsonify({'status':'success','message':'Image received!'}), 200
        
    except Exception as e:
        return jsonify({'status':'error', 'message': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
        