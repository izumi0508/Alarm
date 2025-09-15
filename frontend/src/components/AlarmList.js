import React from "react";

function AlarmList({ alarms }) {
  if (!alarms.length) return <p>目前沒有鬧鐘</p>;

  const handleDelete = async (time) => {
    await fetch(`http://localhost:5000/delete_alarm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time }),
    });
  };

  return (
    <ul>
      {alarms.map((alarm, idx) => (
        <li key={idx}>
          {alarm.message} - 還剩 {Math.max(0, alarm.remaining_seconds)} 秒
          <button onClick={() => handleDelete(alarm.time)} style={{ marginLeft: "10px" }}>刪除</button>
        </li>
      ))}
    </ul>
  );
}

export default AlarmList;
