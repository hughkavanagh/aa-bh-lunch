"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { computeStats } from "@/lib/utils";
import type { Place, PlaceWithStats, Review, SortField, SortDirection } from "@/types";
import Tabs from "@/components/Tabs";
import PlaceTable from "@/components/PlaceTable";
import PlaceCard from "@/components/PlaceCard";
import SortDropdown from "@/components/SortDropdown";
import AddModal from "@/components/AddModal";
import EditModal from "@/components/EditModal";
import AdminModal from "@/components/AdminModal";
import BatchImportModal from "@/components/BatchImportModal";
import FoodRain from "@/components/FoodRain";
import RandomPicker from "@/components/RandomPicker";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab = (searchParams.get("tab") === "cafe" ? "cafe" : "lunch") as "lunch" | "cafe";
  const [places, setPlaces] = useState<PlaceWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("rating_per_dollar");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [reviewingPlace, setReviewingPlace] = useState<PlaceWithStats | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [foodRainActive, setFoodRainActive] = useState(false);
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(null);

  const [myReviewIds, setMyReviewIds] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [officePassword, setOfficePassword] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("my_review_ids");
    if (stored) setMyReviewIds(JSON.parse(stored));
    setIsAdmin(sessionStorage.getItem("admin_unlocked") === "true");
    setAdminPassword(sessionStorage.getItem("admin_password"));
    setOfficePassword(sessionStorage.getItem("office_password"));
  }, []);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("places")
      .select("*, reviews(*)")
      .eq("category", tab);

    if (!error && data) {
      setPlaces((data as Place[]).map(computeStats));
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchPlaces();
    setExpandedId(null);
  }, [fetchPlaces]);

  const reviewedPlaces = useMemo(
    () => places.filter((p) => p.review_count > 0),
    [places]
  );

  const sortPlaces = useCallback(
    (list: PlaceWithStats[]) => {
      return [...list].sort((a, b) => {
        const mult = sortDirection === "asc" ? 1 : -1;
        if (sortField === "name") {
          return a.name.localeCompare(b.name) * mult;
        }
        return (Number(a[sortField]) - Number(b[sortField])) * mult;
      });
    },
    [sortField, sortDirection]
  );

  const unreviewedPlaces = useMemo(() => {
    const list = places.filter((p) => p.review_count === 0);
    if (sortField === "name" || sortField === "walk_minutes") {
      return sortPlaces(list);
    }
    return list;
  }, [places, sortField, sortDirection, sortPlaces]);

  const sorted = useMemo(() => {
    return sortPlaces(reviewedPlaces);
  }, [reviewedPlaces, sortPlaces]);

  const foodImageUrls = useMemo(() => {
    return places
      .flatMap((p) => p.reviews)
      .map((r) => r.image_url)
      .filter((url): url is string => !!url);
  }, [places]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "name" || field === "walk_minutes" ? "asc" : "desc");
    }
  };

  const handleRandomSelect = useCallback((placeId: string) => {
    // Expand the place, scroll to it, and highlight it
    setExpandedId(placeId);
    setHighlightedPlaceId(placeId);
    setTimeout(() => {
      const el = document.querySelector(`[data-place-id="${placeId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    // Clear highlight after 2 seconds
    setTimeout(() => setHighlightedPlaceId(null), 2500);
  }, []);

  const handleTabChange = (newTab: "lunch" | "cafe") => {
    router.push(`/?tab=${newTab}`, { scroll: false });
  };

  const handleAddSuccess = (reviewId: string) => {
    const updated = [...myReviewIds, reviewId];
    setMyReviewIds(updated);
    localStorage.setItem("my_review_ids", JSON.stringify(updated));
    setShowAddModal(false);
    setReviewingPlace(null);
    fetchPlaces();
  };

  const handleDeleteReview = async (review: Review) => {
    if (!confirm("Delete this review?")) return;

    const pw = isAdmin ? adminPassword : officePassword;
    if (!pw) {
      alert("Please re-enter your password");
      return;
    }

    const res = await fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: pw,
        review_id: review.id,
        admin: isAdmin,
      }),
    });

    if (res.ok) {
      const updated = myReviewIds.filter((id) => id !== review.id);
      setMyReviewIds(updated);
      localStorage.setItem("my_review_ids", JSON.stringify(updated));
      fetchPlaces();
    }
  };

  const handleDeletePlace = async (place: PlaceWithStats) => {
    if (!confirm(`Delete "${place.name}" and all its reviews?`)) return;
    if (!adminPassword) return;

    const res = await fetch("/api/places", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPassword, place_id: place.id }),
    });

    if (res.ok) fetchPlaces();
  };

  const handleMovePlace = async (place: PlaceWithStats) => {
    const target = place.category === "lunch" ? "cafe" : "lunch";
    if (!confirm(`Move "${place.name}" to ${target}?`)) return;
    if (!adminPassword) return;

    const res = await fetch("/api/places", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: adminPassword,
        place_id: place.id,
        category: target,
      }),
    });

    if (res.ok) fetchPlaces();
  };

  const handleRenamePlace = async (place: PlaceWithStats) => {
    const newName = prompt("Rename this place:", place.name);
    if (!newName || newName.trim() === place.name) return;
    if (!adminPassword) return;

    const res = await fetch("/api/places", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: adminPassword,
        place_id: place.id,
        name: newName.trim(),
      }),
    });

    if (res.ok) fetchPlaces();
  };

  const handleAdminUnlock = (pw: string) => {
    setIsAdmin(true);
    setAdminPassword(pw);
    sessionStorage.setItem("admin_unlocked", "true");
    sessionStorage.setItem("admin_password", pw);
    setShowAdminModal(false);
  };

  const handleAdminExit = () => {
    setIsAdmin(false);
    setAdminPassword(null);
    sessionStorage.removeItem("admin_unlocked");
    sessionStorage.removeItem("admin_password");
  };

  const editPassword = isAdmin ? adminPassword : officePassword;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium uppercase tracking-widest">
            Cult Lunch
          </h1>
          {foodImageUrls.length > 0 && (
            <button
              onClick={() => setFoodRainActive((v) => !v)}
              className="group relative h-8 flex items-center rounded-full bg-border/20 border border-border/40 transition-all duration-300 ease-in-out w-8 hover:w-[140px] hover:bg-border/30 overflow-hidden"
              title={foodRainActive ? "Clear plates" : "Make it rain"}
            >
              <span className="w-8 h-8 flex items-center justify-center shrink-0 text-base leading-none">
                🌭
              </span>
              <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-fg/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 pr-1.5">
                Make it rain
              </span>
            </button>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2 text-xs font-medium uppercase tracking-widest bg-fg text-bg rounded-md hover:opacity-90 self-start sm:self-auto"
        >
          + Add
        </button>
      </header>

      {isAdmin && (
        <div className="mb-4 px-3 py-2 bg-accent/10 border border-accent/30 rounded-md flex items-center justify-between">
          <span className="text-xs text-accent uppercase tracking-widest font-medium">
            Admin mode active
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBatchImport(true)}
              className="text-xs text-accent hover:underline"
            >
              Batch Import
            </button>
            <button
              onClick={handleAdminExit}
              className="text-xs text-accent hover:underline"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Tabs active={tab} onChange={handleTabChange} />
        <RandomPicker places={places} onSelect={handleRandomSelect} />
        <div className="sm:hidden">
          <SortDropdown
            field={sortField}
            direction={sortDirection}
            onChange={(f, d) => {
              setSortField(f);
              setSortDirection(d);
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted text-sm">Loading...</div>
      ) : sorted.length === 0 && unreviewedPlaces.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted text-sm">
            No {tab === "lunch" ? "lunch spots" : "cafes"} yet
          </p>
          <p className="text-muted text-xs mt-1">Be the first to add one</p>
        </div>
      ) : (
        <>
          <div className="hidden sm:block">
            <PlaceTable
              places={sorted}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              expandedId={expandedId}
              highlightedId={highlightedPlaceId}
              onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
              myReviewIds={myReviewIds}
              isAdmin={isAdmin}
              onEditReview={setEditingReview}
              onDeleteReview={handleDeleteReview}
              onAddReview={(place) => setReviewingPlace(place)}
              onDeletePlace={handleDeletePlace}
              onMovePlace={handleMovePlace}
              onRenamePlace={handleRenamePlace}
              unreviewedPlaces={unreviewedPlaces}
            />
          </div>
          <div className="sm:hidden flex flex-col gap-3">
            {sorted.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                expanded={expandedId === place.id}
                highlighted={highlightedPlaceId === place.id}
                onToggle={() =>
                  setExpandedId(expandedId === place.id ? null : place.id)
                }
                myReviewIds={myReviewIds}
                isAdmin={isAdmin}
                onEditReview={setEditingReview}
                onDeleteReview={handleDeleteReview}
                onAddReview={() => setReviewingPlace(place)}
                onDeletePlace={() => handleDeletePlace(place)}
                onMovePlace={() => handleMovePlace(place)}
                onRenamePlace={() => handleRenamePlace(place)}
              />
            ))}
            {unreviewedPlaces.length > 0 && (
              <>
                <div className="mt-10 mb-2">
                  <div className="border-t border-muted/20" />
                  <p className="text-xs uppercase tracking-widest text-muted/50 font-medium mt-3">
                    Unreviewed
                  </p>
                </div>
                {unreviewedPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    expanded={expandedId === place.id}
                    highlighted={highlightedPlaceId === place.id}
                    onToggle={() =>
                      setExpandedId(expandedId === place.id ? null : place.id)
                    }
                    myReviewIds={myReviewIds}
                    isAdmin={isAdmin}
                    onEditReview={setEditingReview}
                    onDeleteReview={handleDeleteReview}
                    onAddReview={() => setReviewingPlace(place)}
                    onDeletePlace={() => handleDeletePlace(place)}
                    onMovePlace={() => handleMovePlace(place)}
                    onRenamePlace={() => handleRenamePlace(place)}
                    unreviewed
                  />
                ))}
              </>
            )}
          </div>
        </>
      )}

      <footer className="mt-16 pb-8 text-center">
        <button
          onClick={() => setShowAdminModal(true)}
          className="text-xs text-muted/40 hover:text-muted"
        >
          admin
        </button>
      </footer>

      {showAddModal && (
        <AddModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          cachedPassword={officePassword}
          onPasswordVerified={(pw) => {
            setOfficePassword(pw);
            sessionStorage.setItem("office_password", pw);
          }}
        />
      )}

      {reviewingPlace && (
        <AddModal
          onClose={() => setReviewingPlace(null)}
          onSuccess={handleAddSuccess}
          cachedPassword={officePassword}
          onPasswordVerified={(pw) => {
            setOfficePassword(pw);
            sessionStorage.setItem("office_password", pw);
          }}
          existingPlace={reviewingPlace}
        />
      )}

      {editingReview && editPassword && (
        <EditModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onSuccess={() => {
            setEditingReview(null);
            fetchPlaces();
          }}
          password={editPassword}
          isAdmin={isAdmin}
        />
      )}

      {showAdminModal && (
        <AdminModal
          onClose={() => setShowAdminModal(false)}
          onSuccess={handleAdminUnlock}
        />
      )}

      {showBatchImport && adminPassword && (
        <BatchImportModal
          onClose={() => setShowBatchImport(false)}
          onSuccess={fetchPlaces}
          adminPassword={adminPassword}
          category={tab}
        />
      )}

      <FoodRain
        imageUrls={foodImageUrls}
        active={foodRainActive}
        onDone={() => setFoodRainActive(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="py-16 text-center text-muted text-sm">Loading...</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
