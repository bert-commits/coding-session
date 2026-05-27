"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-10 text-center max-w-md w-full">
        <h1 className="text-5xl font-extrabold text-blue-600 mb-4">Ungoy ka!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Logged in as <span className="font-semibold text-gray-700">{user.name}</span> ({user.email})
        </p>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-6 py-2 rounded-lg transition"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
