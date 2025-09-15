import React from "react";
import "./AlarmGrid.css";

// AlarmGrid - 卡片式鬧鐘列表 (類似 iPad 鬧鐘 app)
// 使用方式：
// <AlarmGrid alarms={alarms} onDelete={(timeStr) => handleDelete(timeStr)} />
// 此組件會自行將 alarms 依 remaining_seconds 升序排序，並以 CSS Grid 左到右、上到下排列卡片。

export default function AlarmGrid({ alarms = [], onDelete }) {
  if (!alarms || alarms.length === 0) {
    return <p className="no-alarm">目前沒有鬧鐘</p>;
  }

  // 由左到右、上到下顯示：只要按 remaining_seconds 排序即可
  const sorted = [...alarms].sort((a, b) => a.remaining_seconds - b.remaining_seconds);

  const formatRemaining = (s) => {
    if (s <= 0) return "到時間";
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) return `${hrs}小時 ${mins}分 ${secs}秒`;
    if (mins > 0) return `${mins}分 ${secs}秒`;
    return `${secs}秒`;
  };

  return (
    <div className="alarm-grid">
      {sorted.map((a) => {
        const isTriggered = a.triggered_time !== null && a.triggered_time !== undefined;
        return (
          <div className="alarm-card" key={a.time}>
            <div>
              <div className="alarm-top">
                <div>
                    <div className="alarm-time">{a.time.split(' ')[1]}</div>
                    <div className="alarm-remaining">
                    {!isTriggered ? formatRemaining(a.remaining_seconds) : "\u00A0"}
                    </div>
                </div>
                <div>
                  <div className={`pill ${isTriggered ? 'pill-triggered' : 'pill-upcoming'}`}>
                    {isTriggered ? '已觸發' : '即將'}
                  </div>
                </div>
              </div>

              <div className="alarm-message">{a.message || '提醒'}</div>
            </div>

            <div className="alarm-bottom">
              <div className="meta"></div>
              <div className="actions">
                <button
                  className="delete-btn"
                  onClick={() => onDelete && onDelete(a.time)}
                  aria-label={`刪除 ${a.message}`}
                >刪除</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
