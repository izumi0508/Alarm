import { useEffect, useRef, useState } from "react";

// 從 props 中移除了 setAlarms
export default function AlarmSound({ alarms }) { 
    const audioRef = useRef(null);
    
    const [soundEnabled, setSoundEnabled] = useState(
        // 初始化時從 localStorage 讀取設定
        () => localStorage.getItem("soundEnabled") === "true"
    );
    const [unlocked, setUnlocked] = useState(
        // 初始化時從 localStorage 讀取設定
        () => localStorage.getItem("unlocked") === "true"
    );

    // 切換音效開關
    const toggleSound = () => {
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        localStorage.setItem("soundEnabled", newState);

        // 如果是首次啟用音效，嘗試播放一個靜音音訊來「解鎖」瀏覽器
        if (!unlocked && newState) {
            const audio = new Audio("/iosAlarm.mp3");
            audio.volume = 0;
            audio.play().then(() => {
                setUnlocked(true);
                localStorage.setItem("unlocked", "true");
                console.log("🔊 音訊播放已解鎖");
            }).catch(() => {
                console.warn("用戶未與頁面互動，無法自動解鎖音訊");
            });
        }
    };

    useEffect(() => {
        // 尋找已觸發但尚未播放過聲音的鬧鐘
        const triggeredAlarm = alarms.find(a => a.triggered && !a.played);

        if (triggeredAlarm && soundEnabled) {
            console.log(`🔔 偵測到觸發的鬧鐘: ${triggeredAlarm.message}`);
            
            // 確保不會重複播放
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            // 建立新的 Audio 物件並播放
            const audio = new Audio("/iosAlarm.mp3"); // 確保 public 資料夾有這個檔案
            audio.volume = 1;
            audio.loop = true; // 讓鈴聲循環播放直到被停止
            audioRef.current = audio;

            audio.play().catch(e => console.error("播放音效失敗:", e));

            // 通知後端這個鬧鐘的聲音已經開始播放了
            fetch(`http://127.0.0.1:5000/mark_played/${triggeredAlarm.id}`, { method: "POST" })
                .catch(err => console.error("標記已播放失敗:", err));
            
            // 播放一段時間後自動停止，避免無限響鈴
            const stopTimeout = setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioRef.current = null;
                    console.log(`🔇 自動停止鬧鐘鈴聲: ${triggeredAlarm.message}`);
                }
            }, 10000); // 播放 10 秒後停止

            // 清理函式：當鬧鐘列表變化或組件卸載時停止鈴聲
            return () => {
                clearTimeout(stopTimeout);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }
            };
        }
    }, [alarms, soundEnabled]);

    return (
        <button
            onClick={toggleSound}
            className={`sound-toggle-btn ${soundEnabled ? 'enabled' : 'disabled'}`}
        >
            {soundEnabled ? "🔊 音效開啟" : "🔇 音效關閉"}
        </button>
    );
}