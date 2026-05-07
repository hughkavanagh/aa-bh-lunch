"use client";

import { useState } from "react";

interface AdminModalProps {
  onClose: () => void;
  onSuccess: (password: string) => void;
}

export default function AdminModal({ onClose, onSuccess }: AdminModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        review_id: "00000000-0000-0000-0000-000000000000",
        admin: true,
      }),
    });

    if (res.status === 401) {
      setError("Wrong password");
      setLoading(false);
      return;
    }

    onSuccess(password);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl p-6 w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium uppercase tracking-widest">
            Admin
          </h2>
          <button onClick={onClose} className="text-muted hover:text-fg text-lg">
            ×
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && password && handleSubmit()}
            placeholder="Admin password"
            autoFocus
            className="border border-border rounded-md px-3 py-2 text-sm bg-surface focus:outline-none focus:border-fg"
          />
          {error && <p className="text-accent text-sm">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted hover:text-fg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!password || loading}
              className="px-4 py-2 text-sm bg-fg text-bg rounded-md hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "..." : "Unlock"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
