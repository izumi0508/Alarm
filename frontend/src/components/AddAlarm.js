import React, { useState } from "react";
import { addAlarm } from "../api";
import "./AddAlarm.css";  // ✅ 引入 CSS

function AddAlarm() {
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [second, setSecond] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const h = Number(hour) || 0;
    const m = Number(minute) || 0;
    const s = Number(second) || 0;

    // ✅ 防手賤：如果時間都是 0，就直接返回，不新增鬧鐘
    if (h === 0 && m === 0 && s === 0) return;

    await addAlarm(h, m, s, message || "提醒");
    setHour(""); setMinute(""); setSecond(""); setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="add-alarm-form">
      <input type="number" placeholder="時" value={hour} onChange={e => setHour(e.target.value)} />
      <input type="number" placeholder="分" value={minute} onChange={e => setMinute(e.target.value)} />
      <input type="number" placeholder="秒" value={second} onChange={e => setSecond(e.target.value)} />
      <input type="text" placeholder="提醒內容" value={message} onChange={e => setMessage(e.target.value)} />
      <button type="submit">新增鬧鐘</button>
    </form>
  );
}

export default AddAlarm;
