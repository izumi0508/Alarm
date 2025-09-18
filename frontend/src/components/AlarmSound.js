import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function AlarmSound({ alarms }) {
    const audioRef = useRef(null);
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem("soundEnabled") === "true";
    });

    // ⚠️ 用來防止未授權播放前就觸發
    const [initialized, setInitialized] = useState(false);

    // const socket = io("http://127.0.0.1:5000"); // ⚠️ 前端 WS 連線

    // 切換音效開關
    const toggleSound = () => {
        setSoundEnabled(prev => {
            const newState = !prev;
            localStorage.setItem("soundEnabled", newState);
            return newState;
        });
        setInitialized(true);
    };

    useEffect(() => {
        if (!initialized) return; // ✅ 如果開關還沒初始化，直接跳過

        // 🔹 使用後端 played 與 triggered
        const triggered = alarms.find(a => a.triggered && !a.played);

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

        // ✅ 播放後通知後端
        fetch(`/mark_played/${triggered.id}`, { method: "POST" }).catch(console.error);
        }
    }, [alarms, soundEnabled, initialized]);

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
