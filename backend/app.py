from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import alarm_manager

app = Flask(__name__)
CORS(app)

@app.route("/add_alarm", methods=["POST"])
def add_alarm():
    data = request.get_json()
    message = data.get("message", "提醒")

    # 讀取小時、分鐘、秒數（預設 0）
    hours = int(data.get("hours", 0))
    minutes = int(data.get("minutes", 0))
    seconds = int(data.get("seconds", 0))

    total_seconds = hours * 3600 + minutes * 60 + seconds

    if total_seconds <= 0:
        return jsonify({"status": "error", "msg": "請設定大於 0 的倒數時間"}), 400

    alarm_manager.add_alarm(total_seconds, message)
    return jsonify({"status": "ok", "msg": f"鬧鐘已設定：{message}，{total_seconds} 秒後"})

# 查詢鬧鐘
@app.route("/alarms", methods=["GET"])
def list_alarms():
    return jsonify(alarm_manager.get_alarms())


if __name__ == "__main__":
    t = threading.Thread(target=alarm_manager.run_alarm_loop, daemon=True)
    t.start()
    app.run(host="0.0.0.0", port=5000, debug=True)
