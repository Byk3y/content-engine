# Brigo TikTok Content Engine - Implementation Plan

## 🛠 Pre-requisites
- [ ] Create Supabase project
- [ ] Setup Postiz API access
- [ ] Setup OpenRouter API key

## 🚀 Phase 1: Foundation (Current)
### 1.1 Project Initialization
- [ ] Initialize Next.js (App Router) with Tailwind CSS and TypeScript.
- [ ] Install dependencies: `@supabase/supabase-js`, `sharp`, `openrouter-node-sdk`, `lucide-react`.
- [ ] Configure `.env.local` for Supabase and OpenRouter.

### 1.2 Database & Storage Setup
- [ ] Define Supabase tables: `apps`, `assets`, `hooks`, `posts`.
- [ ] Setup Supabase Storage bucket: `content-assets`.
- [ ] Setup RLS policies.

### 1.3 Image Processing Engine (Sharp)
- [ ] Design the `render-slide` utility with Sharp.
- [ ] Implement text overlay (pill background + centered text).
- [ ] Implement stacking logic (combined slides with divider).

## 🚀 Phase 2: Core User Journey
### 2.1 Asset Library
- [ ] UI: Image grid with tag filtering.
- [ ] Logic: Supabase Storage upload + Postgres record creation.
- [ ] Bulk tag management.

### 2.2 Post Creation Flow
- [ ] **Step 1: Angle Selection**. UI Cards with stats.
- [ ] **Step 2: Hook Selection**. Recommendations via Claude.
- [ ] **Step 3: Post Config**. JSON generator (Claude) + Interactive preview (edit/swap/reorder).
- [ ] **Step 4: Image Generation**. Nano Banana 2 call + Sharp rendering.
- [ ] **Step 5: Caption Review**. Claude generation + clipboard copy.

### 2.3 TikTok Pipeline (Postiz)
- [ ] Upload 6 generated slides to Postiz.
- [ ] Return TikTok draft confirmation.

## 🚀 Phase 3: Feedback Loop & Dashboard
### 3.1 Analytics Dashboard
- [ ] Total views/weekly target stats.
- [ ] List of recent posts.
- [ ] Manual view entry (Performance Log).

### 3.2 Intelligence
- [ ] Claude insight panel for performance analysis.
- [ ] Data-driven hook generation based on history.

---

## ✅ Ongoing Tasks
- [ ] Test image rendering dimensions (1080x1350).
- [ ] Validate Sharp text readability.
- [ ] Ensure single-user auth focus.
