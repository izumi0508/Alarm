// 前端呼叫 Flask 後端 API 的地方
const API_URL = "http://localhost:5000";

export async function getAlarms() {
  const res = await fetch(`${API_URL}/alarms`);
  if (!res.ok) throw new Error("Failed to fetch alarms");
  return await res.json();
}

export async function addAlarm(hours, minutes, seconds, message) {
  const res = await fetch(`${API_URL}/add_alarm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hours, minutes, seconds, message }),
  });
  if (!res.ok) throw new Error("Failed to add alarm");
  return await res.json();
}

export async function deleteAlarm(id) {   // 👈 新增刪除 API
  const res = await fetch(`${API_URL}/delete_alarm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete alarm");
  return await res.json();
}