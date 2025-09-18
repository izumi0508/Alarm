import React from "react";
import "./AlarmGrid.css";

export default function AlarmGrid({ alarms = [], onDelete }) {
  if (!alarms || alarms.length === 0) {
    return <p className="no-alarm">目前沒有鬧鐘</p>;
  }

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
        const isTriggered = a.remaining_seconds === 0;
        return (
          <div className="alarm-card" key={a.id}>
            <div>
              <div className="alarm-top">
                <div>
                  <div className="alarm-time">{a.time.split(' ')[1]}</div>
                  <div className="alarm-remaining">
                    {formatRemaining(a.remaining_seconds)}
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
                  onClick={() => onDelete(a.id)}
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
