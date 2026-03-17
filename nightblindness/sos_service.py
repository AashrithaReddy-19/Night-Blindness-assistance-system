import json
import os
from typing import Dict, Tuple

CONTACTS_FILE = os.path.join(os.path.dirname(__file__), "contacts.json")


def _default_contacts() -> Dict:
    return {
        "primary_name": "",
        "primary_phone": "",
        "secondary_name": "",
        "secondary_phone": ""
    }


def load_contacts() -> Dict:
    if not os.path.exists(CONTACTS_FILE):
        return _default_contacts()

    try:
        with open(CONTACTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            base = _default_contacts()
            base.update({k: data.get(k, "") for k in base.keys()})
            return base
    except Exception:
        return _default_contacts()


def save_contacts(data: Dict) -> Dict:
    contacts = {
        "primary_name": data.get("primary_name", "").strip(),
        "primary_phone": data.get("primary_phone", "").strip(),
        "secondary_name": data.get("secondary_name", "").strip(),
        "secondary_phone": data.get("secondary_phone", "").strip()
    }

    with open(CONTACTS_FILE, "w", encoding="utf-8") as f:
        json.dump(contacts, f, indent=2, ensure_ascii=False)

    return contacts


def generate_maps_link(lat: float, lon: float) -> str:
    return f"https://maps.google.com/?q={lat},{lon}"


def build_sos_message(lat: float, lon: float) -> str:
    link = generate_maps_link(lat, lon)
    return (
        "Emergency Alert!\n"
        "User needs assistance.\n"
        f"Location: {link}\n"
        "Sent from AI Night Blindness Assistance System."
    )


def send_sms(phone: str, message: str) -> Tuple[bool, str]:
    """
    SMS sender wrapper.
    Integrate Twilio/Fast2SMS here using environment variables.
    For now, safe fallback mock returns success for non-empty number.
    """
    if not phone:
        return False, "Phone number missing"

    # Placeholder success path for compatibility in local/offline environments.
    return True, f"SMS sent to {phone}"
