from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import eventlet
import time
import uuid
from datetime import datetime, timedelta

# 🔹 Eventlet 必須先 patch
eventlet.monkey_patch()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# 🔒 全域鎖
alarms_lock = eventlet.semaphore.Semaphore()
alarms = []

# 背景檢查鬧鐘
def alarm_background():
    while True:
        now = datetime.now()
        updated = False
        with alarms_lock:
            for alarm in alarms:
                if alarm["triggered_time"] is None and now >= alarm["trigger_time"]:
                    alarm["triggered_time"] = now
                    updated = True
                    print(f"🔔 鬧鐘觸發！{alarm['message']}")
            # 移除超過 retain 的鬧鐘
            retain_after_trigger = 300
            alarms[:] = [
                a for a in alarms
                if not (a["triggered_time"] and (now - a["triggered_time"]).total_seconds() > retain_after_trigger)
            ]
        # 🔹 有更新就推送前端
        if updated:
            socketio.emit("alarms_update", get_alarms(), broadcast=True)
        eventlet.sleep(1)

# 新增鬧鐘
@app.route("/add_alarm", methods=["POST"])
def add_alarm_route():
    data = request.get_json()
    message = data.get("message", "提醒")
    hours = int(data.get("hours", 0))
    minutes = int(data.get("minutes", 0))
    seconds = int(data.get("seconds", 0))
    total_seconds = hours*3600 + minutes*60 + seconds
    if total_seconds <= 0:
        return jsonify({"status":"error","msg":"請設定大於 0 的時間"}), 400
    
    trigger_time = datetime.now() + timedelta(seconds=total_seconds)
    alarm_id = str(uuid.uuid4())
    with alarms_lock:
        alarms.append({
            "id": alarm_id,
            "trigger_time": trigger_time,
            "message": message,
            "triggered_time": None,
            "played": False
        })
    
    socketio.emit("alarms_update", get_alarms(), broadcast=True)
    print(f"⏰ 鬧鐘已設定：{message} → {trigger_time}")

    return jsonify({"status":"ok","msg":"鬧鐘已設定"})

# 查詢鬧鐘
@app.route("/alarms", methods=["GET"])
def list_alarms():
    return jsonify(get_alarms())

# 刪除鬧鐘
@app.route("/delete_alarm", methods=["POST"])
def delete_alarm_route():
    data = request.get_json()
    alarm_id = data.get("id")
    with alarms_lock:
        for i, a in enumerate(alarms):
            if a["id"] == alarm_id:
                del alarms[i]
                print(f"❌ 刪除鬧鐘 id={alarm_id}")
                break
    socketio.emit("alarms_update", get_alarms(), broadcast=True)
    return jsonify({"status":"ok"})

# 標記已播放
@app.route("/mark_played/<alarm_id>", methods=["POST"])
def mark_played_route(alarm_id):
    with alarms_lock:
        for a in alarms:
            if a["id"] == alarm_id:
                a["played"] = True
                break
    socketio.emit("alarms_update", get_alarms(), broadcast=True)
    return jsonify({"status":"ok"})

# 取得所有鬧鐘，排序
def get_alarms():
    now = datetime.now()
    with alarms_lock:
        alarm_list = []
        for a in alarms:
            remaining = max(0, int((a["trigger_time"] - now).total_seconds()))
            alarm_list.append({
                "id": a["id"],
                "time": a["trigger_time"].strftime("%Y-%m-%d %H:%M:%S"),
                "message": a["message"],
                "remaining_seconds": remaining,
                "triggered": a["triggered_time"] is not None,
                "played": a["played"]
            })
    return sorted(alarm_list, key=lambda x: x["remaining_seconds"])

# 啟動背景檢查
socketio.start_background_task(alarm_background)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
