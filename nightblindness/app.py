from flask import Flask, render_template, Response, jsonify, request
import cv2
from ultralytics import YOLO
from sos_service import load_contacts, save_contacts, build_sos_message, send_sms

app = Flask(__name__)

camera = cv2.VideoCapture(0)
model = YOLO("yolov8n.pt")

detected_objects = []

def generate_frames():
    global detected_objects

    while True:
        success, frame = camera.read()
        if not success:
            break

        results = model(frame)

        detected_objects = []

        for r in results:
            for box in r.boxes:

                cls = int(box.cls[0])
                label = model.names[cls]

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                width = x2 - x1
                distance = round(1000 / (width + 1), 2)

                direction = "CENTER"
                if x1 < frame.shape[1] / 3:
                    direction = "LEFT"
                elif x1 > frame.shape[1] * 2 / 3:
                    direction = "RIGHT"

                status = "SAFE"
                if distance < 2:
                    status = "DANGER"
                elif distance < 5:
                    status = "WARNING"

                detected_objects.append({
                    "object": label,
                    "distance": str(distance),
                    "direction": direction,
                    "status": status
                })

                cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
                cv2.putText(frame, label, (x1, y1-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/video')
def video():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/results')
def results():
    return jsonify(detected_objects)


@app.route('/contacts', methods=['GET'])
def get_contacts():
    return jsonify(load_contacts())


@app.route('/register_contacts', methods=['POST'])
def register_contacts():
    data = request.get_json(silent=True) or {}

    required = ["primary_name", "primary_phone", "secondary_name", "secondary_phone"]
    missing = [k for k in required if not str(data.get(k, "")).strip()]

    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400

    contacts = save_contacts(data)

    return jsonify({
        "success": True,
        "message": "Contacts registered successfully",
        "contacts": contacts
    })


@app.route('/sos', methods=['POST'])
def sos():
    data = request.get_json(silent=True) or {}

    try:
        lat = float(data.get("lat"))
        lng = float(data.get("lng"))
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid or missing lat/lng"}), 400

    contacts = load_contacts()
    message = build_sos_message(lat, lng)

    primary_phone = contacts.get("primary_phone", "").strip()
    secondary_phone = contacts.get("secondary_phone", "").strip()

    if not primary_phone and not secondary_phone:
        return jsonify({
            "success": False,
            "error": "No emergency contacts registered"
        }), 400

    primary_ok, primary_info = send_sms(primary_phone, message) if primary_phone else (False, "Primary phone missing")

    if primary_ok:
        return jsonify({
            "success": True,
            "sent_to": "primary",
            "detail": primary_info
        })

    secondary_ok, secondary_info = send_sms(secondary_phone, message) if secondary_phone else (False, "Secondary phone missing")

    if secondary_ok:
        return jsonify({
            "success": True,
            "sent_to": "secondary",
            "detail": secondary_info,
            "primary_error": primary_info
        })

    return jsonify({
        "success": False,
        "error": "Failed to send SOS to both contacts",
        "primary_error": primary_info,
        "secondary_error": secondary_info
    }), 500


if __name__ == "__main__":
    app.run(debug=True)