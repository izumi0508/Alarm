import { useEffect, useRef } from "react";

export default function AlarmSound({ alarms }) {
  const audioRef = useRef(null);

  useEffect(() => {
    // 找出所有剛觸發且還沒撥放的鬧鐘
    const triggered = alarms.find(a => a.remaining_seconds === 0 && !a.played);

    if (triggered) {
      // 停掉前一個鈴聲
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // 建立新的 Audio 並播放
      const audio = new Audio("/iosAlarm.mp3"); // 鈴聲路徑
      audioRef.current = audio;
      audio.play();

      // 標記已撥放，避免重複
      triggered.played = true;

      // 五秒後自動停止
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 5000);
    }
  }, [alarms]);

  return null; // 不渲染任何 DOM
}
