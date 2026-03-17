# detection.py

from ultralytics import YOLO
import cv2
import pyttsx3
import threading
from config import MODEL_PATH, CONFIDENCE_THRESHOLD, KNOWN_WIDTHS, FOCAL_LENGTH, CURRENCY_CLASSES
from danger_logic import check_danger

model = YOLO(MODEL_PATH)

engine = pyttsx3.init()
engine.setProperty('rate',160)

latest_results = []
last_spoken = {}

CURRENCY_LABEL_MAP = {
    "10_note": "₹10_note",
    "20_note": "₹20_note",
    "50_note": "₹50_note",
    "100_note": "₹100_note",
    "200_note": "₹200_note",
    "500_note": "₹500_note",
    "2000_note": "₹2000_note",
    "1_coin": "₹1_coin",
    "2_coin": "₹2_coin",
    "5_coin": "₹5_coin",
    "10_coin": "₹10_coin",
    "rs10_note": "₹10_note",
    "rs20_note": "₹20_note",
    "rs50_note": "₹50_note",
    "rs100_note": "₹100_note",
    "rs200_note": "₹200_note",
    "rs500_note": "₹500_note",
    "rs2000_note": "₹2000_note",
    "rs1_coin": "₹1_coin",
    "rs2_coin": "₹2_coin",
    "rs5_coin": "₹5_coin",
    "rs10_coin": "₹10_coin"
}


def speak_async(text):

    def run():
        engine.say(text)
        engine.runAndWait()

    threading.Thread(target=run).start()


def estimate_distance(label, box_width):

    if label in KNOWN_WIDTHS:

        real_width = KNOWN_WIDTHS[label]

        distance = (real_width * FOCAL_LENGTH) / box_width

        return round(distance,2)

    return None


def get_direction(center_x, frame_width):

    if center_x < frame_width/3:
        return "LEFT"

    elif center_x < 2*frame_width/3:
        return "CENTER"

    else:
        return "RIGHT"


def normalize_currency_label(raw_label):
    label = str(raw_label).strip().lower().replace(" ", "_").replace("-", "_")
    label = label.replace("₹", "").replace("rs.", "rs").replace("rupees_", "").replace("rupee_", "")
    label = label.replace("currency_", "")

    if label in CURRENCY_LABEL_MAP:
        return CURRENCY_LABEL_MAP[label]

    if raw_label in CURRENCY_CLASSES:
        return raw_label

    return raw_label


def format_currency_voice_label(label):
    if label.endswith("_note"):
        value = label.replace("₹", "").replace("_note", "")
        return f"₹{value} note"
    if label.endswith("_coin"):
        value = label.replace("₹", "").replace("_coin", "")
        return f"₹{value} coin"
    return label


def detect_objects(frame):

    global latest_results

    results = model(frame, verbose=False)

    h,w,_ = frame.shape

    latest_results = []

    for r in results:

        for box in r.boxes:

            conf = float(box.conf[0])

            if conf < CONFIDENCE_THRESHOLD:
                continue

            cls = int(box.cls[0])
            label = normalize_currency_label(model.names[cls])

            x1,y1,x2,y2 = map(int,box.xyxy[0])

            width = x2-x1
            center_x = (x1+x2)/2

            direction = get_direction(center_x,w)

            distance = estimate_distance(label,width)

            status = check_danger(label)

            color=(0,255,0)

            if status=="DANGER":
                color=(0,0,255)

            cv2.rectangle(frame,(x1,y1),(x2,y2),color,2)

            text=f"{label}"

            if distance:
                text+=f" {distance}m"

            cv2.putText(frame,text,(x1,y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,color,2)

            obj={
                "object":label,
                "distance":distance,
                "direction":direction,
                "status":status
            }

            latest_results.append(obj)

            if label in CURRENCY_CLASSES:
                key = f"currency-{label}-{direction}"
                if key not in last_spoken:
                    currency_text = format_currency_voice_label(label)
                    speak_async(f"{currency_text} detected in front of you.")
                    last_spoken[key] = True

            if status=="DANGER" and distance and distance<4:

                key=f"{label}-{direction}"

                if key not in last_spoken:

                    speak_async(f"Warning {label} on the {direction}")

                    last_spoken[key]=True

    return frame