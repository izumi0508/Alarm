import heapq
import time
from datetime import datetime, timedelta

# 儲存鬧鐘 (trigger_time, message)
alarms = []

def add_alarm(seconds_from_now, message):
    trigger_time = datetime.now() + timedelta(seconds=seconds_from_now)
    alarms.append({"trigger_time": trigger_time, "message": message, "triggered_time": None})
    print(f"⏰ 鬧鐘已設定：{message} → {trigger_time.strftime('%Y-%m-%d %H:%M:%S')}")

def get_alarms():
    now = datetime.now()
    alarm_list = []
    for alarm in alarms:
        remaining = int((alarm["trigger_time"] - now).total_seconds())
        if remaining < 0:
            remaining = 0
        alarm_list.append({
            "time": alarm["trigger_time"].strftime("%Y-%m-%d %H:%M:%S"),
            "message": alarm["message"],
            "remaining_seconds": remaining,
            "triggered_time": alarm["triggered_time"]
        })
    # 依剩餘時間排序
    return sorted(alarm_list, key=lambda a: a["remaining_seconds"])

def check_and_trigger():
    """檢查是否有鬧鐘觸發，triggered 後保留 retain_after_trigger 秒"""
    updated = False
    now = datetime.now()
    for alarm in alarms:
        if alarm["triggered_time"] is None and now >= alarm["trigger_time"]:
            alarm["triggered_time"] = now
            print(f"🔔 鬧鐘觸發！ {alarm['message']} ({now.strftime('%Y-%m-%d %H:%M:%S')})")
            updated = True

    retain_after_trigger = 300
    # 移除已觸發且超過 retain_after_trigger 秒的鬧鐘
    alarms[:] = [a for a in alarms if not (a["triggered_time"] and (now - a["triggered_time"]).total_seconds() > retain_after_trigger)]
    time.sleep(1)
    return updated

def delete_alarm(trigger_time_str):
    """手動刪除鬧鐘"""
    alarms[:] = [a for a in alarms if a["trigger_time"].strftime("%Y-%m-%d %H:%M:%S") != trigger_time_str]
