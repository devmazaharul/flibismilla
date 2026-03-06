"use client";

import { useState } from "react";

export default function CreateStaffPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "editor",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/staff/ad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Error creating staff");
      } else {
        setMessage("✅ Staff created successfully");

        setForm({
          name: "",
          email: "",
          password: "",
          phone: "",
          role: "editor",
        });
      }
    } catch (error) {
      setMessage("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Create Staff</h2>

      <form onSubmit={createStaff} className="space-y-3">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>

        <button
          disabled={loading}
          className="bg-black text-white px-4 py-2 w-full"
        >
          {loading ? "Creating..." : "Create Staff"}
        </button>
      </form>

      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}