"use client";

import { useState, useCallback, useRef } from "react";
import type { PlaceWithStats, ResolvedPlace } from "@/types";
import PasswordPrompt from "./PasswordPrompt";

interface AddModalProps {
  onClose: () => void;
  onSuccess: (reviewId: string) => void;
  cachedPassword: string | null;
  onPasswordVerified: (password: string) => void;
  existingPlace?: PlaceWithStats;
}

export default function AddModal({
  onClose,
  onSuccess,
  cachedPassword,
  onPasswordVerified,
  existingPlace,
}: AddModalProps) {
  const [password, setPassword] = useState(cachedPassword);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [mapsUrl, setMapsUrl] = useState("");
  const [resolved, setResolved] = useState<ResolvedPlace | null>(
    existingPlace
      ? {
          google_place_id: existingPlace.google_place_id,
          name: existingPlace.name,
          walk_minutes: existingPlace.walk_minutes,
          google_maps_url: existingPlace.google_maps_url,
        }
      : null
  );
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [category, setCategory] = useState<"lunch" | "cafe">(
    existingPlace?.category ?? "lunch"
  );
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState("");
  const [price, setPrice] = useState("");
  const [whatTheyGot, setWhatTheyGot] = useState("");

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [photoProgress, setPhotoProgress] = useState("");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const resizeImage = (file: File, maxDim: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
          } else {
            width = (width / height) * maxDim;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoError(null);
    setProcessedBlob(null);
    setProcessedPreview(null);

    // Show original preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    // Resize then remove background
    setPhotoProcessing(true);
    setPhotoProgress("Resizing...");

    try {
      const resized = await resizeImage(file, 1024);

      setPhotoProgress("Loading AI model...");
      const { removeBackground } = await import(
        "@imgly/background-removal"
      );

      setPhotoProgress("Removing background...");
      const result = await removeBackground(resized, {
        model: "isnet_quint8",
        output: { format: "image/png", quality: 0.9 },
        progress: (key: string, current: number, total: number) => {
          if (key === "compute:inference") {
            const pct = Math.round((current / total) * 100);
            setPhotoProgress(`Processing... ${pct}%`);
          }
        },
      });

      setProcessedBlob(result);
      setProcessedPreview(URL.createObjectURL(result));
      setPhotoProgress("");
    } catch (err) {
      console.error("Background removal failed:", err);
      setPhotoError("Failed to process photo. Try a different image.");
      setPhotoProgress("");
    }
    setPhotoProcessing(false);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setProcessedBlob(null);
    setProcessedPreview(null);
    setPhotoError(null);
    setPhotoProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!resolved || !password) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Upload processed photo if we have one
      let imageUrl: string | null = null;
      if (processedBlob) {
        const formData = new FormData();
        formData.append("file", processedBlob, "food.png");
        formData.append("password", password);

        const uploadRes = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          imageUrl = uploadData.url;
        }
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          place_id: existingPlace?.id,
          google_place_id: resolved.google_place_id,
          name: resolved.name,
          category,
          walk_minutes: resolved.walk_minutes,
          google_maps_url: resolved.google_maps_url,
          reviewer_name: reviewerName.trim(),
          rating: parseFloat(rating),
          price: parseFloat(price),
          what_they_got: whatTheyGot.trim() || null,
          image_url: imageUrl,
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

  const isReviewOnly = !!existingPlace;

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
            {isReviewOnly ? `Review ${existingPlace.name}` : "Add a spot"}
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
            {isReviewOnly ? (
              <div className="p-3 bg-border/20 rounded-md">
                <p className="text-sm">
                  <strong>{existingPlace.name}</strong> — {existingPlace.walk_minutes} min walk
                </p>
              </div>
            ) : (
              <>
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
              </>
            )}

            <div>
              <label className="text-xs uppercase tracking-widest text-muted font-medium mb-1 block">
                Your name
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. Alex"
                autoFocus={isReviewOnly}
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

            {/* Photo upload */}
            <div>
              <label className="text-xs uppercase tracking-widest text-muted font-medium mb-1 block">
                Photo (optional)
              </label>
              {!photoFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-border rounded-md px-3 py-4 text-sm text-muted hover:text-fg hover:border-fg/30 transition-colors"
                >
                  Tap to add a photo of your food
                </button>
              ) : (
                <div className="border border-border rounded-md p-3">
                  <div className="flex gap-3 items-start">
                    {/* Show processed result if ready, otherwise original */}
                    {processedPreview ? (
                      <div className="w-20 h-20 shrink-0 rounded-md overflow-hidden bg-[#e8e4de]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={processedPreview}
                          alt="Processed"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : photoPreview ? (
                      <div className="w-20 h-20 shrink-0 rounded-md overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoPreview}
                          alt="Original"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      {photoProcessing && (
                        <>
                          <p className="text-xs text-muted">{photoProgress}</p>
                          <div className="w-full bg-border/40 rounded-full h-1.5 mt-1">
                            <div className="bg-accent h-1.5 rounded-full animate-pulse" style={{ width: "60%" }} />
                          </div>
                        </>
                      )}
                      {processedPreview && !photoProcessing && (
                        <p className="text-xs text-green-600">Background removed</p>
                      )}
                      {photoError && (
                        <p className="text-xs text-accent">{photoError}</p>
                      )}
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="text-xs text-muted hover:text-accent self-start mt-1"
                      >
                        Remove photo
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            {submitError && (
              <p className="text-accent text-sm">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isFormValid || submitting || photoProcessing}
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
