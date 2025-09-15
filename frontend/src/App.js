import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import AddAlarm from "./components/AddAlarm";
import { getAlarms } from "./api";
import AlarmGrid from "./components/AlarmGrid";
import "./App.css";

// 建立 WebSocket 連線
const socket = io("http://localhost:5000");

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
  const handleDelete = async (time) => {
    try {
      await fetch("http://localhost:5000/delete_alarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time }),
      });
      // 刪除後可選擇直接更新前端列表
      setAlarms(prev => prev.filter(a => a.time !== time));
    } catch (error) {
      console.error("刪除鬧鐘失敗:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      {/* <h1>多鬧鐘系統</h1> */}
      <AddAlarm />
      <AlarmGrid alarms={alarms} onDelete={handleDelete} /> {/* ✅ 使用卡片 UI */}
    </div>
  );
}

export default App;
