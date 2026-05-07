"use client";

import { useState, useCallback } from "react";
import type { ResolvedPlace } from "@/types";
import PasswordPrompt from "./PasswordPrompt";

interface AddModalProps {
  onClose: () => void;
  onSuccess: (reviewId: string) => void;
  cachedPassword: string | null;
  onPasswordVerified: (password: string) => void;
}

export default function AddModal({
  onClose,
  onSuccess,
  cachedPassword,
  onPasswordVerified,
}: AddModalProps) {
  const [password, setPassword] = useState(cachedPassword);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [mapsUrl, setMapsUrl] = useState("");
  const [resolved, setResolved] = useState<ResolvedPlace | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [category, setCategory] = useState<"lunch" | "cafe">("lunch");
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState("");
  const [price, setPrice] = useState("");
  const [whatTheyGot, setWhatTheyGot] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const verifyPassword = async (pw: string) => {
    setPasswordLoading(true);
    setPasswordError(null);
    try {
      const res = await fetch("/api/resolve-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://maps.google.com/maps/place/?q=place_id:ChIJYeZuBI9YwokRjMEb_wzs8AQ",
          password: pw,
        }),
      });
      if (res.status === 401) {
        setPasswordError("Wrong password");
        setPasswordLoading(false);
        return;
      }
      setPassword(pw);
      onPasswordVerified(pw);
    } catch {
      setPasswordError("Connection error");
    }
    setPasswordLoading(false);
  };

  const resolvePlace = useCallback(
    async (url: string) => {
      if (!url || !password) return;
      setResolving(true);
      setResolveError(null);
      setResolved(null);
      try {
        const res = await fetch("/api/resolve-place", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setResolveError(data.error || "Failed to resolve place");
        } else {
          setResolved(data);
        }
      } catch {
        setResolveError("Connection error");
      }
      setResolving(false);
    },
    [password]
  );

  const handleSubmit = async () => {
    if (!resolved || !password) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          google_place_id: resolved.google_place_id,
          name: resolved.name,
          category,
          walk_minutes: resolved.walk_minutes,
          google_maps_url: resolved.google_maps_url,
          reviewer_name: reviewerName.trim(),
          rating: parseFloat(rating),
          price: parseFloat(price),
          what_they_got: whatTheyGot.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Failed to submit");
      } else {
        onSuccess(data.id);
      }
    } catch {
      setSubmitError("Connection error");
    }
    setSubmitting(false);
  };

  const isFormValid =
    resolved &&
    reviewerName.trim() &&
    rating &&
    parseFloat(rating) >= 1 &&
    parseFloat(rating) <= 10 &&
    price &&
    parseFloat(price) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium uppercase tracking-widest">
            Add a spot
          </h2>
          <button onClick={onClose} className="text-muted hover:text-fg text-lg">
            ×
          </button>
        </div>

        {!password ? (
          <PasswordPrompt
            label="Office password"
            error={passwordError}
            loading={passwordLoading}
            onSubmit={verifyPassword}
            onCancel={onClose}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted font-medium mb-1 block">
                Google Maps URL
              </label>
              <input
                type="url"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                onBlur={() => resolvePlace(mapsUrl)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  setTimeout(() => resolvePlace(pasted), 100);
                }}
                placeholder="Paste a Google Maps link"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface focus:outline-none focus:border-fg"
              />
              {resolving && (
                <p className="text-xs text-muted mt-1">Resolving...</p>
              )}
              {resolveError && (
                <p className="text-xs text-accent mt-1">{resolveError}</p>
              )}
              {resolved && (
                <div className="mt-2 p-3 bg-border/20 rounded-md">
                  <p className="text-sm">
                    Found: <strong>{resolved.name}</strong> — {resolved.walk_minutes} min walk
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted font-medium mb-2 block">
                Category
              </label>
              <div className="flex gap-3">
                {(["lunch", "cafe"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-1.5 text-xs uppercase tracking-wider rounded-md border ${
                      category === cat
                        ? "bg-fg text-bg border-fg"
                        : "border-border text-muted hover:text-fg"
                    }`}
                  >
                    {cat === "cafe" ? "Cafe" : "Lunch"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted font-medium mb-1 block">
                Your name
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface focus:outline-none focus:border-fg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-widest text-muted font-medium mb-1 block">
                  Rating (1–10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  placeholder="7.5"
                  className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-surface focus:outline-none focus:border-fg"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted font-medium mb-1 block">
                  Price ($)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="14.00"
                  className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-surface focus:outline-none focus:border-fg"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted font-medium mb-1 block">
                What you got (optional)
              </label>
              <input
                type="text"
                value={whatTheyGot}
                onChange={(e) => setWhatTheyGot(e.target.value)}
                placeholder="e.g. carnitas burrito, no beans"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface focus:outline-none focus:border-fg"
              />
            </div>

            {submitError && (
              <p className="text-accent text-sm">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
              className="mt-2 w-full py-2.5 text-sm bg-fg text-bg rounded-md hover:opacity-90 disabled:opacity-40 uppercase tracking-widest font-medium"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
