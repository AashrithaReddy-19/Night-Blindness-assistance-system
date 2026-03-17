# config.py

MODEL_PATH = "models/yolov8n.pt"

CONFIDENCE_THRESHOLD = 0.5

DANGER_OBJECTS = [
    "car",
    "bus",
    "truck",
    "motorcycle",
    "bicycle"
]

# approximate real object widths in meters
KNOWN_WIDTHS = {
    "person": 0.5,
    "car": 1.8,
    "bicycle": 0.6,
    "motorcycle": 0.8
}

FOCAL_LENGTH = 700

# Indian currency classes to support in detection pipeline
CURRENCY_CLASSES = [
    "₹10_note", "₹20_note", "₹50_note", "₹100_note", "₹200_note", "₹500_note", "₹2000_note",
    "₹1_coin", "₹2_coin", "₹5_coin", "₹10_coin"
]

# Optional approximate real widths in meters for distance estimation
KNOWN_WIDTHS.update({
    "₹10_note": 0.123,
    "₹20_note": 0.129,
    "₹50_note": 0.135,
    "₹100_note": 0.142,
    "₹200_note": 0.146,
    "₹500_note": 0.150,
    "₹2000_note": 0.166,
    "₹1_coin": 0.020,
    "₹2_coin": 0.027,
    "₹5_coin": 0.023,
    "₹10_coin": 0.027
})
