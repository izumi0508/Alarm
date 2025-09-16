import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import AddAlarm from "./components/AddAlarm";
import { getAlarms, deleteAlarm } from "./api";
import AlarmGrid from "./components/AlarmGrid";
import AlarmSound from "./components/AlarmSound";
import "./App.css";

// 建立 WebSocket 連線
const socket = io("http://127.0.0.1:5000");
const audio = new Audio("/iosAlarm.mp3");
audio.volume = 0;

const unlockAudio = () => {
  audio.play().catch(() => {
    audio.pause();
    audio.currentTime = 0;
  });
  document.removeEventListener("click", unlockAudio);
};

document.addEventListener("click", unlockAudio);

function App() {
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    // 1️⃣ 初始化：抓一次後端鬧鐘
    getAlarms()
      .then(setAlarms)
      .catch(console.error);

    // 2️⃣ WebSocket 接收新增/觸發鬧鐘事件
    socket.on("alarms_update", (data) => {
      setAlarms(data.sort((a, b) => a.remaining_seconds - b.remaining_seconds));
    });

    // 每秒倒數
    const interval = setInterval(() => {
      setAlarms(prev => {
        const updated = prev.map(a => ({
          ...a,
          remaining_seconds: Math.max(0, a.remaining_seconds - 1)
        }));
        return updated.sort((a, b) => a.remaining_seconds - b.remaining_seconds);
      });
    }, 1000);

    // 清理
    return () => {
      socket.off("alarms_update");
      clearInterval(interval);
    };
  }, []);

  // 🔹 刪除 API
  const handleDelete = async (id) => {
    try {
      await deleteAlarm(id); // ✅ 呼叫 API
      setAlarms(prev => prev.filter(a => a.id !== id)); // ✅ 更新狀態
    } catch (error) {
      console.error("刪除鬧鐘失敗：", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <AddAlarm />
      <AlarmGrid alarms={alarms} onDelete={handleDelete} /> {/* ✅ 使用卡片 UI */}
      <AlarmSound alarms={alarms} />{/* ✅ 這裡插入，負責播放鈴聲 */}
    </div>
  );
}

export default App;
