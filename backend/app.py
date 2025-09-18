from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import threading
import alarm_manager

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# 初始化 alarm_manager 的 socketio
alarm_manager.init_socketio(socketio)

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
    
    # 新增鬧鐘後，推送最新清單給前端
    socketio.emit("alarms_update", alarm_manager.get_alarms())
    return jsonify({"status": "ok", "msg": f"鬧鐘已設定：{message}，{total_seconds} 秒後"})

# 查詢鬧鐘
@app.route("/alarms", methods=["GET"])
def list_alarms():
    return jsonify(alarm_manager.get_alarms())

@app.route("/delete_alarm", methods=["POST"])
def delete_alarm():
    data = request.get_json()
    alarm_id = data.get("id")
    alarm_manager.delete_alarm(alarm_id)
    socketio.emit("alarms_update", alarm_manager.get_alarms())
    return jsonify({"status": "ok"})

@app.route("/mark_played/<alarm_id>", methods=["POST"])
def mark_played_route(alarm_id):
    alarm_manager.mark_played(alarm_id)
    # 播放後立即推送更新給前端
    socketio.emit("alarms_update", alarm_manager.get_alarms())
    return {"status":"ok"}

@socketio.on("request_alarms")
def handle_request_alarms():
    emit("alarms_update", alarm_manager.get_alarms())

# 背景 thread 持續檢查鬧鐘
def alarm_background():
    while True:
        try:
            updated = alarm_manager.check_and_trigger()
            # background sleep 1 秒
            import time
            time.sleep(1)
        except Exception as e:
            print("alarm_background error:", e, flush=True)

if __name__ == "__main__":
    threading.Thread(target=alarm_background, daemon=True).start()
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
