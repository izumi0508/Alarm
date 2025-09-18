import { useEffect, useRef, useState } from "react";

export default function AlarmSound({ alarms,setAlarms}) {
    const audioRef = useRef(null);
    
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem("soundEnabled") === "true";
    });

    const [unlocked, setUnlocked] = useState(false);

    // 切換音效開關
    const toggleSound = () => {
        setSoundEnabled(prev => {
            const newState = !prev;
            localStorage.setItem("soundEnabled", newState);
            return newState;
        });
    };

      // 初次掛載，靜音播放解鎖
    useEffect(() => {
        if (!unlocked) {
            const audio = new Audio("/iosAlarm.mp3");
            audio.volume = 0; // 靜音
            audio.play().catch(() => console.warn("無法解鎖音效"));
            setUnlocked(true);
        }
    }, [unlocked]);

    useEffect(() => {
        // 🔹 使用後端 played 與 triggered
        const triggered = alarms.find(a => a.triggered && !a.played);
        if (!triggered) return;

        // 停掉前一個鈴聲
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        // 建立新的 Audio 並播放
        const audio = new Audio("/iosAlarm.mp3");
        audio.volume = soundEnabled ? 1 : 0;
        audioRef.current = audio;
        audio.play().catch(() => console.warn("無法播放音效"));

        // ✅ 播放後通知後端
        fetch(`http://127.0.0.1:5000/mark_played/${triggered.id}`, { method: "POST" })
            .then(res => res.json())
            .then(() => {
            // 更新前端 state
                setAlarms(prev =>
                    prev.map(a => (a.id === triggered.id ? { ...a, played: true } : a))
                );
            })
            .catch(err => console.error(err));

        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, 5000);
    }, [alarms, soundEnabled, setAlarms]);

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
