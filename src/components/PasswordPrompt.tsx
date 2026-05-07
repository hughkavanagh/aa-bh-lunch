"use client";

import { useState } from "react";

interface PasswordPromptProps {
  label: string;
  error: string | null;
  loading: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export default function PasswordPrompt({
  label,
  error,
  loading,
  onSubmit,
  onCancel,
}: PasswordPromptProps) {
  const [password, setPassword] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <label className="text-xs uppercase tracking-widest text-muted font-medium">
        {label}
      </label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && password && onSubmit(password)}
        placeholder="Enter password"
        autoFocus
        className="border border-border rounded-md px-3 py-2 text-sm bg-surface focus:outline-none focus:border-fg"
      />
      {error && <p className="text-accent text-sm">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-muted hover:text-fg"
        >
          Cancel
        </button>
        <button
          onClick={() => password && onSubmit(password)}
          disabled={!password || loading}
          className="px-4 py-2 text-sm bg-fg text-bg rounded-md hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
