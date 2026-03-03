# 🔥 Brigo TikTok Content Engine

An automated system for generating, previewing, and dispatching TikTok photo carousel posts for the Brigo AI study app.

## 🚀 Overview
The Brigo TikTok Content Engine is designed to maximize social media reach using the high-performance photo carousel format. It automates the entire workflow from hook generation to final image rendering and TikTok draft upload.

## 🛠 Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4 + Vanilla CSS for industrial aesthetics
- **Database/Storage:** Supabase
- **Image Processing:** Sharp
- **AI Engine:**
  - Claude 3.5 Sonnet (Logic & Text)
  - Nano Banana 2 (Slide 1 Hero Images)
- **Social Pipeline:** Postiz API

## 📁 Project Structure
- `src/app/`: Next.js pages and API routes
- `src/lib/`: Shared utilities (Sharp renderer, Supabase client)
- `src/types/`: TypeScript definitions for the `config.json` post assembly specification
- `PRD.md`: Full product requirements and design specification
- `implementation_plan.md`: Current build status and roadmap

## 🚦 Getting Started
1. **Env Setup:** Copy `.env.example` to `.env.local` and add your keys.
2. **Install:** `npm install`
3. **Dev:** `npm run dev`

## 🔗 Internal Resources
- [Product Requirements Document (PRD)](./PRD.md)
- [Implementation Plan](./implementation_plan.md)

