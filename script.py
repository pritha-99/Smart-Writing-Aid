import requests
import pyautogui
import time
import os
from datetime import datetime

ESP_IP = "172.16.200.166"   # replace with your ESP IP
SAVE_FOLDER = r"/home/pritha/ptt"

os.makedirs(SAVE_FOLDER, exist_ok=True) 

last_state = None
last_shot = False

while True:
    try:
        response = requests.get(f"http://{ESP_IP}/data", timeout=2)
        data = response.text.strip()

        print("Received:", data)

        # ===== PLAY / PAUSE =====
        if data == "PAUSE" and last_state != "PAUSE":
            pyautogui.press("space")
            last_state = "PAUSE"

        elif data == "PLAY" and last_state != "PLAY":
            pyautogui.press("space")
            last_state = "PLAY"

        # ===== SCREENSHOT =====
        elif data == "SHOT" and not last_shot:

            filename = datetime.now().strftime("screenshot_%Y%m%d_%H%M%S.png")
            filepath = os.path.join(SAVE_FOLDER, filename)

            img = pyautogui.screenshot()  # capture
            img.save(filepath)  # explicit write

            print(f"Saved at: {filepath}")
            print("File exists?", os.path.exists(filepath))

            last_shot = True  

        elif data != "SHOT":
            last_shot = False


    except requests.exceptions.RequestException as e:

        print("ESP connection error:", e)


    except Exception as e:

        print("Other error:", e)

    time.sleep(0.2)