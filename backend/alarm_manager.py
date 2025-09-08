import heapq
import time
from datetime import datetime, timedelta

# 儲存鬧鐘 (trigger_time, message)
alarms = []

def add_alarm(seconds_from_now, message):
    """新增鬧鐘"""
    trigger_time = datetime.now() + timedelta(seconds=seconds_from_now)
    heapq.heappush(alarms, (trigger_time, message))
    print(f"⏰ 鬧鐘已設定：{message} → {trigger_time.strftime('%Y-%m-%d %H:%M:%S')}")

def get_alarms():
    """取得所有鬧鐘清單，依剩餘時間排序"""
    now = datetime.now()
    alarm_list = []
    for trigger_time, message in sorted(alarms):
        remaining = int((trigger_time - now).total_seconds())
        if remaining < 0:
            remaining = 0
        alarm_list.append({
            "time": trigger_time.strftime("%Y-%m-%d %H:%M:%S"),
            "message": message,
            "remaining_seconds": remaining
        })
    return alarm_list

def run_alarm_loop():
    """單線程迴圈檢查鬧鐘"""
    while True:
        if alarms:
            trigger_time, message = alarms[0]
            now = datetime.now()
            if now >= trigger_time:
                heapq.heappop(alarms)
                print(f"🔔 鬧鐘觸發！ {message} ({now.strftime('%Y-%m-%d %H:%M:%S')})")
            else:
                # 等到下一秒再檢查
                time.sleep(1)
        else:
            # 沒鬧鐘時也不要一直占 CPU
            time.sleep(1)
