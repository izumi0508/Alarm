import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import AddAlarm from "./components/AddAlarm";
import { getAlarms, deleteAlarm } from "./api";
import AlarmGrid from "./components/AlarmGrid";
import AlarmSound from "./components/AlarmSound";
import "./App.css";

function App() {
  const [alarms, setAlarms] = useState([]);

  const refreshAlarms = () => {
    getAlarms()
      .then(data => {
        // 後端已經排序，前端直接使用
        setAlarms(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    const socket = io("http://127.0.0.1:5000", {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    // 監聽連線成功事件
    socket.on("connect", () => {
      console.log("✅ Socket 已連線:", socket.id);
      // 連線成功後，立即同步一次鬧鐘狀態
      refreshAlarms();
    });

    // 監聽後端推送的鬧鐘更新事件 (這是唯一的狀態更新來源)
    socket.on("alarms_update", (updatedAlarms) => {
      console.log("📩 收到 alarms_update:", updatedAlarms);
      // 直接使用後端推送的最新、已排序的列表
      setAlarms(updatedAlarms);
    });

    // 監聽錯誤和斷線事件
    socket.on("disconnect", () => console.log("❌ Socket 已斷開"));
    socket.on("connect_error", (err) => console.log("❌ Socket 連線失敗:", err));

    //WebSocket 接收新增/觸發鬧鐘事件
    socket.on("alarms_update", (data) => {
      console.log("收到 alarms_update:", data);
      setAlarms(data.sort((a, b) => a.remaining_seconds - b.remaining_seconds));
    });

    //補丁：監聽分頁切換/獲得焦點
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("💡 頁面恢復可見，重新同步鬧鐘...");
        refreshAlarms();
      }
    };

    // 當視窗獲得焦點時也刷新（例如從其他應用程式切換回來）
    const handleFocus = () => {
        console.log("💡 視窗獲得焦點，重新同步鬧鐘...");
        refreshAlarms();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // 組件卸載時的清理函式
    return () => {
      console.log("🌀 清理 Effect...");
      // 移除事件監聽器
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      // 斷開 socket 連線
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);// 空依賴陣列，確保此 effect 只在組件掛載和卸載時執行一次

  // 刪除鬧鐘的處理函式
  const handleDelete = async (id) => {
    try {
      // 只向後端發送刪除指令
      await deleteAlarm(id);
      // 不再需要手動呼叫 refreshAlarms() 或 setAlarms()
      // 後端處理完刪除後會 emit 'alarms_update'，上面的 socket.on 會自動處理狀態更新
      console.log(`🚀 已發送刪除請求: ${id}`);
    } catch (err) {
      console.error("刪除鬧鐘失敗:", err);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <h1>多功能鬧鐘</h1>
      <AddAlarm />
      <AlarmGrid alarms={alarms} onDelete={handleDelete} />
      {/* 
        將 setAlarms prop 移除，因為 AlarmSound 也不再需要手動更新 state。
        它只需要根據 alarms 的狀態播放聲音並通知後端即可。
      */}
      <AlarmSound alarms={alarms} />
    </div>
  );
}

export default App;
