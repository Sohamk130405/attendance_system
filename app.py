# from flask import Flask, json, request, jsonify
# import face_recognition
# import numpy as np
# import base64
# from io import BytesIO
# from PIL import ImageEnhance , Image
# import logging

# app = Flask(__name__)

# # In-memory storage for face encodings
# face_db = {}

# # Configure logging
# logging.basicConfig(level=logging.ERROR)

# def encode_face(image):
#     print(f"Image dimensions: {image.shape}")
#     face_encodings = face_recognition.face_encodings(image)

#     if len(face_encodings) == 1:  # Ensure exactly one face is found
#         return face_encodings[0], 'success'
#     elif len(face_encodings) > 1:
#         return None, 'Multiple faces found'
#     else:
#         return None, 'No face found'


# def preprocess_image(image):
#     pil_image = Image.fromarray(image)
#     enhancer = ImageEnhance.Contrast(pil_image)
#     enhanced_image = enhancer.enhance(1.5)  # Adjust contrast
#     return np.array(enhanced_image)


# @app.route('/generate_faceid', methods=['POST'])
# def generate_faceid():
#     if 'face_photo' not in request.files:
#         return jsonify({'error': 'No face photo uploaded'}), 400

#     prn = request.form.get('prn')  # Get PRN from form data
#     face_photo = request.files['face_photo']  # Get the uploaded image

#     if not prn:
#         return jsonify({'error': 'PRN is missing'}), 400

#     # Load the image file from the uploaded image
#     image = face_recognition.load_image_file(face_photo)

#     face_encoding, message = encode_face(image)
#     if face_encoding is not None:
#         # Instead of storing in face_db, return the encoding as JSON response
#         return jsonify({
#             'faceId': face_encoding.tolist(),  # Return the encoding
#             'prn': prn
#         }), 200
#     else:
#         return jsonify({'error': message}), 400


# @app.route('/compare_faces', methods=['POST'])
# def compare_faces():
#     if 'face_photo' not in request.files:
#         return jsonify({'error': 'No face photo uploaded'}), 400

#     face_photo = request.files['face_photo']
    
#     # Log the uploaded file details
#     print(f"Uploaded file name: {face_photo.filename}")
#     print(f"File type: {face_photo.content_type}")
    
#     # Load the image file from the uploaded image
#     image = face_recognition.load_image_file(face_photo)
    
    
    
#     image = preprocess_image(image)

#     face_encoding, message = encode_face(image)
#     if face_encoding is not None:
#         # Extract the face encoding from the multipart form data
#         face_id_encoding = request.form.get('face_id_encoding')  # Use form.get() for multipart

#         if face_id_encoding is not None:
#             # Convert the face_id_encoding from a string back to a numpy array
#             stored_encoding = np.array(json.loads(face_id_encoding))  # Make sure to parse the JSON string
            
#             # Compare the uploaded face encoding with the stored one
#             results = face_recognition.compare_faces([stored_encoding], face_encoding , tolerance=0.6)
#             return jsonify({'match': bool(results[0])}), 200
#         else:
#             return jsonify({'error': 'No face encoding provided'}), 400
#     else:
#         return jsonify({'error': message}), 400

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=8080, debug=True)




from flask import Flask, json, request, jsonify
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import ImageEnhance, Image
import logging
import face_recognition
app = Flask(__name__)

# In-memory storage for face encodings
face_db = {}

# Configure logging
logging.basicConfig(level=logging.ERROR)

def encode_face(image):
    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Load the Haar cascade for face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Detect faces in the image
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    # Log number of faces detected
    print(f"Number of faces detected: {len(faces)}")

    if len(faces) == 0:
        return None, 'No face found'

    # Select the most visible face based on area (width * height)
    best_face = None
    max_area = 0
    for (x, y, w, h) in faces:
        area = w * h
        if area > max_area:
            max_area = area
            best_face = (x, y, w, h)

    # If a best face is found, process it
    if best_face is not None:
        (x, y, w, h) = best_face
        face_image = image[y:y+h, x:x+w]
        
        # Preprocess the face image for encoding
        resized_face = cv2.resize(face_image, (128, 128))
        face_encoding = face_recognition.face_encodings(resized_face)

        if face_encoding:
            return face_encoding[0], 'success'
        else:
            return None, 'No face found in the selected face region'
    
    return None, 'No face found'


def preprocess_image(image):
    # Resize the image to a smaller, more manageable size for faster processing
    resized_image = cv2.resize(image, (640, 480))
    
    # Convert to grayscale
    gray_image = cv2.cvtColor(resized_image, cv2.COLOR_BGR2GRAY)
    
    # Apply contrast enhancement
    pil_image = Image.fromarray(gray_image)
    enhancer = ImageEnhance.Contrast(pil_image)
    enhanced_image = enhancer.enhance(1.5)  # Adjust contrast
    return np.array(enhanced_image)

@app.route('/generate_faceid', methods=['POST'])
def generate_faceid():
    if 'face_photo' not in request.files:
        return jsonify({'error': 'No face photo uploaded'}), 400

    prn = request.form.get('prn')  # Get PRN from form data
    face_photo = request.files['face_photo']  # Get the uploaded image

    if not prn:
        return jsonify({'error': 'PRN is missing'}), 400

    # Load the image file from the uploaded image using OpenCV
    file_bytes = np.asarray(bytearray(face_photo.read()), dtype=np.uint8)
    image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    face_encoding, message = encode_face(image)
    if face_encoding is not None:
        # Instead of storing in face_db, return the encoding as JSON response
        return jsonify({
            'faceId': face_encoding.tolist(),  # Return the encoding
            'prn': prn
        }), 200
    else:
        return jsonify({'error': message}), 400

@app.route('/compare_faces', methods=['POST'])
def compare_faces():
    if 'face_photo' not in request.files:
        return jsonify({'error': 'No face photo uploaded'}), 400

    face_photo = request.files['face_photo']

    # Log the uploaded file details
    print(f"Uploaded file name: {face_photo.filename}")
    print(f"File type: {face_photo.content_type}")

    # Load the image file from the uploaded image
    file_bytes = np.asarray(bytearray(face_photo.read()), dtype=np.uint8)
    image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    # image = preprocess_image(image)

    face_encoding, message = encode_face(image)
    if face_encoding is not None:
        # Extract the face encoding from the multipart form data
        face_id_encoding = request.form.get('face_id_encoding')  # Use form.get() for multipart

        if face_id_encoding is not None:
            # Convert the face_id_encoding from a string back to a numpy array
            stored_encoding = np.array(json.loads(face_id_encoding))  # Make sure to parse the JSON string

            # Debug log the shapes of the encodings
            print(f"Shape of stored encoding: {stored_encoding.shape}")
            print(f"Shape of face encoding: {face_encoding.shape}")

            # Ensure both encodings have the same shape
            if stored_encoding.shape != face_encoding.shape:
                return jsonify({'error': 'Face encodings do not match in shape'}), 400
            
            # Compare the uploaded face encoding with the stored one
            match = face_recognition.compare_faces([stored_encoding], face_encoding, tolerance=0.6)[0]

            # Return the match result in a JSON serializable format
            return jsonify({'match': bool(match)}), 200  # Ensure match is wrapped in JSON
        else:
            return jsonify({'error': 'No face encoding provided'}), 400
    else:
        return jsonify({'error': message}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
