import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import AddAlarm from "./components/AddAlarm";
import { getAlarms, deleteAlarm } from "./api";
import AlarmGrid from "./components/AlarmGrid";
import AlarmSound from "./components/AlarmSound";
import "./App.css";

// 建立 WebSocket 連線
const socket = io("http://127.0.0.1:5000");

function App() {
  const [alarms, setAlarms] = useState([]);

  // 🔹 新增函式：從後端抓最新鬧鐘
  const refreshAlarms = () => {
    getAlarms()
      .then(data =>
        setAlarms(
          data.sort((a, b) => a.remaining_seconds - b.remaining_seconds)
        )
      )
      .catch(console.error);
  };

  useEffect(() => {
    //初始化：抓一次後端鬧鐘
    refreshAlarms();

    //WebSocket 接收新增/觸發鬧鐘事件
    socket.on("alarms_update", (data) => {
      setAlarms(data.sort((a, b) => a.remaining_seconds - b.remaining_seconds));
    });

    // 每秒更新剩餘秒數（使用系統時間計算，避免降頻誤差）
    const interval = setInterval(() => {
      const now = Date.now();
      setAlarms(prev =>
        prev.map(a => {
          const remaining = Math.max(
            0,
            Math.round((new Date(a.time).getTime() - now) / 1000)
          );
          return { ...a, remaining_seconds: remaining };
        })
      );
    }, 1000);

    //補丁：監聽分頁切換/獲得焦點
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshAlarms();
      }
    };
    const handleFocus = () => refreshAlarms();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    // 清理
    return () => {
      socket.off("alarms_update");
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // 🔹 刪除 API
  const handleDelete = async (id) => {
    try {
      await deleteAlarm(id);
      refreshAlarms(); // ✅ 刪除後跟後端同步
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
