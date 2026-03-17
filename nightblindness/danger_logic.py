from config import DANGER_OBJECTS

def check_danger(obj):

    if obj in DANGER_OBJECTS:
        return "DANGER"

    return "SAFE"