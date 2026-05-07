"use client";

import { useState } from "react";

interface BatchResult {
  url: string;
  success: boolean;
  name?: string;
  error?: string;
}

interface BatchImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
  adminPassword: string;
  category: "lunch" | "cafe";
}

export default function BatchImportModal({
  onClose,
  onSuccess,
  adminPassword,
  category,
}: BatchImportModalProps) {
  const [urlText, setUrlText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<BatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const urls = urlText
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) return;

    setSubmitting(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/batch-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          urls,
          category,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to import");
      } else {
        setResults(data.results);
        onSuccess();
      }
    } catch {
      setError("Connection error");
    }
    setSubmitting(false);
  };

  const urlCount = urlText
    .split("\n")
    .map((u) => u.trim())
    .filter((u) => u.length > 0).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium uppercase tracking-widest">
            Batch Import
          </h2>
          <button onClick={onClose} className="text-muted hover:text-fg text-lg">
            ×
          </button>
        </div>

        {!results ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted font-medium mb-1 block">
                Google Maps URLs (one per line)
              </label>
              <textarea
                value={urlText}
                onChange={(e) => setUrlText(e.target.value)}
                rows={8}
                placeholder={"https://maps.app.goo.gl/...\nhttps://maps.app.goo.gl/...\nhttps://maps.app.goo.gl/..."}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface focus:outline-none focus:border-fg font-mono"
              />
              {urlCount > 0 && (
                <p className="text-xs text-muted mt-1">
                  {urlCount} URL{urlCount !== 1 ? "s" : ""} detected
                </p>
              )}
            </div>

            <p className="text-xs text-muted">
              Adding as <strong className="text-fg">{category}</strong> spots.
              Places will appear in the Unreviewed section.
            </p>

            {error && <p className="text-accent text-sm">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={urlCount === 0 || submitting}
              className="mt-2 w-full py-2.5 text-sm bg-fg text-bg rounded-md hover:opacity-90 disabled:opacity-40 uppercase tracking-widest font-medium"
            >
              {submitting ? "Importing..." : `Import ${urlCount} place${urlCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((r, i) => (
              <div
                key={i}
                className={`p-3 rounded-md text-sm ${
                  r.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p className="font-medium">
                  {r.success ? "✓" : "✗"}{" "}
                  {r.name || r.url.slice(0, 50) + (r.url.length > 50 ? "..." : "")}
                </p>
                {r.error && (
                  <p className="text-xs text-muted mt-0.5">{r.error}</p>
                )}
              </div>
            ))}

            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 text-sm border border-border rounded-md hover:bg-border/20 uppercase tracking-widest font-medium"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
