-- ============================================
-- AA-BH Lunch Spot Tracker — Schema
-- Run this in the Supabase SQL Editor (one shot)
-- ============================================

-- 1. Places table
create table places (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique not null,
  name text not null,
  category text not null check (category in ('lunch', 'cafe')),
  walk_minutes int not null,
  google_maps_url text not null,
  created_at timestamptz default now()
);

-- 2. Reviews table
create table reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade not null,
  reviewer_name text not null,
  rating numeric(3,1) not null check (rating >= 1 and rating <= 10),
  price numeric(6,2) not null check (price > 0),
  what_they_got text,
  created_at timestamptz default now()
);

-- 3. Indexes
create index idx_reviews_place_id on reviews(place_id);
create index idx_places_category on places(category);

-- 4. Enable RLS
alter table places enable row level security;
alter table reviews enable row level security;

-- 5. RLS policies — anonymous read-only
create policy "Public read access on places"
  on places for select
  to anon
  using (true);

create policy "Public read access on reviews"
  on reviews for select
  to anon
  using (true);

-- No insert/update/delete policies for anon.
-- All writes go through API routes using the service_role key,
-- which bypasses RLS entirely.
