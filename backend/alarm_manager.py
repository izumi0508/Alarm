import time
import uuid
import threading
from datetime import datetime, timedelta
from flask_socketio import SocketIO

# 🔒 全域鎖，保護 alarms 列表
alarms_lock = threading.Lock()

# 儲存鬧鐘，每個鬧鐘是一個 dict: {"id", "trigger_time", "message", "triggered_time"}
alarms = []

# 假設你在 app.py 建立了 socketio = SocketIO(app)
socketio = None  # ⚠️ 後續在 app.py 裡初始化

def init_socketio(sio):
    global socketio
    socketio = sio

def add_alarm(seconds_from_now, message):
    """新增鬧鐘"""
    trigger_time = datetime.now() + timedelta(seconds=seconds_from_now)
    alarm_id = str(uuid.uuid4())  # 唯一 ID

    with alarms_lock:
        alarms.append({
            "id": alarm_id,
            "trigger_time": trigger_time,
            "message": message,
            "triggered_time": None,
            "played": False
        })
    print(f"⏰ 鬧鐘已設定：{message} → {trigger_time}")

def get_alarms():
    """取得所有鬧鐘清單，依剩餘時間排序，避免 datetime 序列化錯誤"""
    now = datetime.now()
    with alarms_lock:
        alarm_list = []
        for alarm in alarms:
            remaining = max(0, int((alarm["trigger_time"] - now).total_seconds()))
            alarm_list.append({
                "id": alarm["id"],
                "time": alarm["trigger_time"].strftime("%Y-%m-%d %H:%M:%S"),
                "message": alarm["message"],
                "remaining_seconds": remaining,
                "triggered": alarm["triggered_time"] is not None,
                "played": alarm["played"]  # ✅ 後端同步前端播放狀態
            })
    return sorted(alarm_list, key=lambda a: a["remaining_seconds"])

def check_and_trigger():
    """檢查是否有鬧鐘觸發，triggered 後保留 retain_after_trigger 秒"""
    updated = False
    now = datetime.now()
    with alarms_lock:
        for alarm in alarms:
            if alarm["triggered_time"] is None and now >= alarm["trigger_time"]:
                alarm["triggered_time"] = now
                print(f"🔔 鬧鐘觸發！ {alarm['message']}")
                updated = True
        #移除已觸發且超過 retain_after_trigger 秒的鬧鐘
        retain_after_trigger = 300 
        alarms[:] = [
            a for a in alarms
            if not (a["triggered_time"] and (now - a["triggered_time"]).total_seconds() > retain_after_trigger)
        ]

    # ✅ 如果有更新，主動推送到所有前端
    if updated and socketio:
        socketio.emit("alarms_update", get_alarms())

    time.sleep(1)
    return updated

def mark_played(alarm_id):
    with alarms_lock:
        for alarm in alarms:
            if alarm["id"] == alarm_id:
                alarm["played"] = True
                break

def delete_alarm(alarm_id):
    """手動刪除鬧鐘 (找到就刪，立即跳出)"""
    with alarms_lock:
        for i, alarm in enumerate(alarms):
            if alarm["id"] == alarm_id:
                del alarms[i]
                print(f"❌ 刪除鬧鐘 id={alarm_id}")
                break
