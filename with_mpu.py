import requests
import pyautogui
import time
import os
from datetime import datetime

ESP_IP = "10.251.100.160"
SAVE_FOLDER = "/home/pritha/ptt/screenshots"

os.makedirs(SAVE_FOLDER, exist_ok=True)

last_state = None
last_shot = False
last_forward_time = 0

forward_cooldown = 0.001  

pyautogui.FAILSAFE = False

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

            img = pyautogui.screenshot()
            img.save(filepath)

            print(f"Saved at: {filepath}")
            print("File exists?", os.path.exists(filepath))

            last_shot = True  

        elif data != "SHOT":
            last_shot = False

        # ===== FORWARD =====
        if data == "FORWARD":
            now = time.time()
            if now - last_forward_time > forward_cooldown:
                pyautogui.press("l")
                last_forward_time = now

    except requests.exceptions.RequestException as e:
        print("ESP connection error:", e)

    except Exception as e:
        print("Other error:", e)

    time.sleep(0.2)