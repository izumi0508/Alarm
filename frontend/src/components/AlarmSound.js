import { useEffect, useRef, useState } from "react";

export default function AlarmSound({ alarms }) {
  const audioRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(false); // 音效開關狀態
  const [initialized, setInitialized] = useState(false);  // ✅ 新增初始化 state

  // 切換音效開關
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
    setInitialized(true); // ✅ 設定開關初始化過
  };

  useEffect(() => {
    if (!initialized) return; // ✅ 如果開關還沒初始化，直接跳過

    // 找出所有剛觸發且還沒撥放的鬧鐘
    const triggered = alarms.find(a => a.remaining_seconds === 0 && !a.played);

    if (triggered && soundEnabled) {
      // 停掉前一個鈴聲
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // 建立新的 Audio 並播放
      const audio = new Audio("/iosAlarm.mp3");
      audioRef.current = audio;
      audio.play().catch(() => {
        console.warn("無法播放音效，可能是瀏覽器限制或使用者未授權");
      });

      // 標記已撥放，避免重複
      triggered.played = true;

      // 五秒後自動停止
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 5000);
    }
  }, [alarms, soundEnabled]);

  // 這裡回傳一個開關按鈕，UI 可以放到右上角
  return (
    <button
      onClick={toggleSound}
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        zIndex: 9999,
        padding: "5px 10px",
        borderRadius: "5px",
        background: soundEnabled ? "green" : "gray",
        color: "white",
        border: "none",
        cursor: "pointer",
      }}
    >
      {soundEnabled ? "音效開啟" : "音效關閉"}
    </button>
  );
}
