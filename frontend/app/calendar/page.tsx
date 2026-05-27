"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!stored || !token) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const prevMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));

  const nextMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const goToToday = () =>
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const buildDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const cells: { day: number; type: "prev" | "current" | "next" }[] = [];

    for (let i = firstWeekday - 1; i >= 0; i--) {
      cells.push({ day: daysInPrev - i, type: "prev" });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, type: "current" });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, type: "next" });
    }
    return cells;
  };

  const isToday = (day: number, type: string) => {
    return (
      type === "current" &&
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  if (!user) return null;

  const cells = buildDays();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition"
          >
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold text-blue-600">Calendar</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Calendar */}
      <main className="max-w-3xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button
              onClick={prevMonth}
              className="text-gray-500 hover:text-blue-600 font-bold text-lg px-2 transition"
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h2>
              <button
                onClick={goToToday}
                className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-2 py-0.5 rounded transition"
              >
                Today
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="text-gray-500 hover:text-blue-600 font-bold text-lg px-2 transition"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-gray-400 py-3 uppercase tracking-wide"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const todayCell = isToday(cell.day, cell.type);
              return (
                <div
                  key={i}
                  className={`
                    relative flex items-center justify-center h-12
                    border-b border-r border-gray-50
                    ${cell.type !== "current" ? "text-gray-300" : "text-gray-700"}
                    ${todayCell ? "" : "hover:bg-gray-50"}
                    transition
                  `}
                >
                  <span
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                      ${todayCell ? "bg-blue-600 text-white" : ""}
                    `}
                  >
                    {cell.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
