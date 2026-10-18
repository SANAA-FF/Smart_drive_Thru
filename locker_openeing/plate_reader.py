from flask import Flask, request, jsonify
import cv2
import numpy as np
import easyocr
import re
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter

from ultralytics import YOLO

# ---------------- FIREBASE ----------------

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# ---------------- FLASK ----------------

app = Flask(__name__)

# ---------------- OCR ----------------

print("Loading EasyOCR...")
reader = easyocr.Reader(['en'])

print("Loading YOLO...")
model = YOLO("yolov8n.pt")

print("YOLO Ready!")
print("EasyOCR Ready!")


# ---------------- HELPERS ----------------

def clean_plate_text(text):
    cleaned = re.sub(r'[^A-Za-z0-9]', '', text)
    return cleaned.upper()


# ---------------- FIRESTORE ----------------

def update_vehicle_status(plate):

    print(f"Searching Firestore for: {plate}")

    docs = db.collection("orders") \
             .where(filter=FieldFilter("vehicleNumber", "==", plate)) \
             .where(filter=FieldFilter("status", "==", "Ready")) \
             .stream()

    for doc in docs:

        print("Order Found:", doc.id)

        doc.reference.update({
            "status": "Arrived",
            "arrivalTime": datetime.now().strftime("%H:%M")
        })

        print("Firestore Updated")

        return {
            "match": True,
            "locker": "1",
            "order_id": doc.id
        }

    print("Vehicle Not Found")

    return {
        "match": False,
        "locker": ""
    }
@app.route("/process-plate", methods=["POST"])
def process_plate():

    try:

        image_bytes = np.frombuffer(request.data, np.uint8)
        img = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({
                "status": "error",
                "message": "Invalid image"
            }), 400

        cv2.imwrite("last_capture.jpg", img)

        # ---------------- Vehicle Detection ----------------

        results = model(img)

        vehicle_found = False

        for r in results:
            for box in r.boxes:

                cls = int(box.cls[0])
                confidence = float(box.conf[0])

                print(f"Detected: {model.names[cls]} ({confidence:.2f})")

                # car, motorcycle, bus, truck
                if cls in [2, 3, 5, 7]:
                    vehicle_found = True
                    break

            if vehicle_found:
                break

        if not vehicle_found:

            print("No vehicle detected.")

            return jsonify({
                "status": "no_vehicle"
            }), 200

        # ---------------- OCR ----------------

        ocr_results = reader.readtext(img)

        detected_plate = ""
        highest_confidence = 0

        for (bbox, text, prob) in ocr_results:

            cleaned = clean_plate_text(text)

            if prob > 0.35 and len(cleaned) >= 4:

                detected_plate = cleaned
                highest_confidence = float(prob)

                break

        if detected_plate == "":

            print("No Number Plate Found")

            return jsonify({
                "status": "no_plate_found"
            }), 200

        print("\n==============================")
        print("Detected Plate :", detected_plate)
        print("Confidence     :", highest_confidence)
        print("==============================")

        # ---------------- Firestore ----------------

        result = update_vehicle_status(detected_plate)

        return jsonify({

            "status": "success",

            "match": result["match"],

            "locker": result["locker"],

            "plate": detected_plate,

            "confidence": highest_confidence

        }), 200

    except Exception as e:

        print("ERROR:", e)

        return jsonify({

            "status": "error",

            "details": str(e)

        }), 500
@app.route("/mark-collected", methods=["POST"])
def mark_collected():

    data = request.get_json()

    plate = data.get("plate")

    docs = db.collection("orders") \
             .where(filter=FieldFilter("vehicleNumber", "==", plate)) \
             .stream()

    for doc in docs:

        doc.reference.update({
            "status": "Collected"
        })

        print("Order marked as Collected")

        return jsonify({
            "status": "success"
        })

    return jsonify({
        "status": "not_found"
    }), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

@app.route("/mark-collected", methods=["POST"])
def mark_collected():

    data = request.get_json()

    plate = data.get("plate")

    docs = db.collection("orders") \
             .where(filter=FieldFilter("vehicleNumber", "==", plate)) \
             .stream()

    for doc in docs:
        doc.reference.update({
            "status": "Collected"
        })

        return jsonify({"status": "ok"}), 200

    return jsonify({"status": "not_found"}), 404