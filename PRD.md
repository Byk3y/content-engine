# 🔥 Brigo TikTok Content Engine
## Product Requirements Document
**Version 1.0** • *March 2026*

---

## 1. Product Overview
The **Brigo TikTok Content Engine** is a web application that automates the creation, management, and posting of TikTok photo carousel posts for Brigo — an AI-powered study app. The system is inspired by the OpenClaw/Larry workflow but built as a standalone web app requiring no local AI agent infrastructure.

**The core insight**: TikTok photo carousels get 2.9x more comments, 1.9x more likes, and 2.6x more shares than video. The algorithm actively pushes photo content in 2026. Combined with the right hook formula, a single post can hit 200K+ views and convert directly into app downloads and paying subscribers.

Rather than manually creating content every day, this app generates, previews, and dispatches a complete 6-slide TikTok post in under 60 seconds of human effort.

---

## 2. Goals & Success Metrics
### Primary Goals
*   Post 1 TikTok carousel per day for Brigo with minimal manual effort.
*   Test multiple content angles simultaneously to identify what converts.
*   Build a performance feedback loop that makes every future post smarter.
*   Keep cost per post under $0.50 in API calls.

### Success Metrics — Phase 1 (First 30 days)
| Metric | Target |
| :--- | :--- |
| Posts published | 30+ |
| Average views per post | > 20,000 |
| Posts hitting 100K+ views | > 3 |
| Cost per post (API) | < $0.50 |
| Human time per post | < 90 seconds |
| App downloads attributed | Measurable uplift |

---

## 3. System Architecture
### Tech Stack
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | Web UI — dashboard, create flow, library, results |
| **Backend** | Next.js API Routes | Server-side logic, AI calls, Postiz integration |
| **Database** | Supabase (Postgres) | Posts, hooks, performance logs, app config |
| **File Storage** | Supabase Storage | App screenshots, asset library, generated images |
| **Text AI** | OpenRouter → Claude 3.5 Sonnet | Hook generation, caption writing, performance analysis |
| **Image AI** | OpenRouter → Nano Banana 2 | Slide 1 AI image generation |
| **Image Processing** | Sharp (Node.js) | Text overlay, resize/compositing (1080x1350) |
| **TikTok Posting** | Postiz API | Upload carousel as TikTok draft |
| **Auth** | Supabase Auth | Single user for Phase 1 |

### High-Level Data Flow
1.  User selects angle and approves/edits a hook in the **Create flow**.
2.  Backend calls Claude to write a caption and generate a `config.json` describing all 6 slides (text, image source, layout) **before** any images are rendered.
3.  `config.json` is shown to the user for review and optional editing (swap slides, change text, reorder).
4.  User approves config — **rendering begins**.
5.  Backend calls Nano Banana 2 to generate the slide 1 hero image.
6.  Sharp burns hook text onto slide 1 image.
7.  Remaining slides are pulled from the **Asset Library** or app screenshots using paths defined in `config.json`.
8.  User does final review, then clicks **Send to TikTok**.
9.  Backend calls **Postiz API** → post lands in TikTok drafts as `SELF_ONLY`.
10. Caption copied to clipboard — user adds music on TikTok and publishes.
11. User logs view count — performance data updates.

---

## 4. Image & Slide Specification
### Output Format
*   **Dimensions**: 1080 x 1350 pixels (4:5 portrait)
*   **Format**: JPEG, quality 90
*   **Slide count**: Exactly 6 per post
*   **Text overlay font**: ~125px (6.5% height) for readability
*   **Text position**: Vertically centered, horizontally centered, with dark semi-transparent background pill
*   **Safe zones**: 120px top and bottom (TikTok UI overlap areas)

### Slide Structure by Angle
#### Angle A — The Pet Evolution
1.  **AI Generated + text overlay**: Stressed student scene + hook text
2.  **Asset Library — Pet Stage 1**: Baby pet, caption: 'Day 1. Meet my study pet.'
3.  **Asset Library — Pet Stage 2**: Evolving pet, caption: 'Day 7. He's changing...'
4.  **Asset Library — Pet Stage 3**: Full evolved pet, caption: 'Day 14. 🔥'
5.  **App Screenshot**: App in use, AI tutoring visible
6.  **Asset Library — CTA**: 'What will you name yours? Link in bio'

#### Angle B — The Skeptic Story
1.  **AI Generated + text overlay**: Stressed student/parent scene + hook text
2.  **App Screenshot — Onboarding**: 'Crush your next EXAM' screen
3.  **App Screenshot — Chat**: Bridget tutoring on a real topic
4.  **App Screenshot — Studio**: Flashcards/Quiz/Podcast options
5.  **AI Generated**: Confident/happy student payoff scene
6.  **Asset Library — CTA**: 'Link in bio'

#### Angle C — The Feature Reveal
1.  **AI Generated + text overlay**: Student uploading notes, hook text
2.  **App Screenshot — Add Material**: Upload screen (PDF, Audio, YouTube)
3.  **App Screenshot — Studio**: Generate options appearing
4.  **App Screenshot — Chat**: Flashcards or quiz generated
5.  **AI Generated**: Student looking relieved/impressed
6.  **Asset Library — CTA**: 'Try it free. Link in bio'

#### Angle D — The Exam Pressure
1.  **AI Generated + text overlay**: Clock, notes everywhere, panic scene
2.  **App Screenshot — Onboarding**: Upload screen
3.  **App Screenshot — Studio**: Flashcards being generated from notes
4.  **App Screenshot — Chat**: Brigo answering a question from notes
5.  **AI Generated**: Student calm, phone in hand, exam day
6.  **Asset Library — CTA**: 'Don't wing your exams. Link in bio'

---

## 5. config.json — Slide Assembly Specification
Every post is described in a `config.json` before any images are rendered. This separates planning from rendering — allowing cheap review and editing (no API cost).

### config.json Example
```json
{
  "post_id": "uuid",
  "app_id": "uuid",
  "angle": "pet",
  "hook_text": "I haven't missed a study session in weeks because I'm too scared to let him down",
  "caption": "Day 14 and honestly he's more of a drill sergeant than a pet now... #Brigo #StudyHack #AIPet",
  "slides": [
    {
      "slide_number": 1,
      "layout": "hero",
      "image_source": "ai_gen",
      "image_prompt": "iPhone photo of a university student sitting at a cluttered desk at night...",
      "text_overlay": "I haven't missed a study session in weeks because I'm too scared to let him down",
      "text_position": "center",
      "combined_with_next": false
    },
    {
      "slide_number": 2,
      "layout": "asset",
      "image_source": "library",
      "asset_tag": "pet_stage_1",
      "text_overlay": "Day 1. Meet my study pet.",
      "text_position": "bottom",
      "combined_with_next": false
    },
    {
      "slide_number": 3,
      "layout": "asset",
      "image_source": "library",
      "asset_tag": "pet_stage_2",
      "text_overlay": "Day 7. He's changing...",
      "text_position": "bottom",
      "combined_with_next": false
    },
    {
      "slide_number": 4,
      "layout": "asset",
      "image_source": "library",
      "asset_tag": "pet_stage_3",
      "text_overlay": "Day 14. 🔥",
      "text_position": "bottom",
      "combined_with_next": false
    },
    {
      "slide_number": 5,
      "layout": "asset",
      "image_source": "library",
      "asset_tag": "app_chat",
      "text_overlay": null,
      "text_position": null,
      "combined_with_next": false
    },
    {
      "slide_number": 6,
      "layout": "cta",
      "image_source": "library",
      "asset_tag": "cta",
      "text_overlay": "What will you name yours? Link in bio",
      "text_position": "center",
      "combined_with_next": false
    }
  ]
}
```

### Slide Combining Logic (Sharp Renderer)
Claude decides at config time whether to combine slides:
*   **Slide 1 & 6**: Always standalone.
*   **Image Slides**: Standalone (fill the frame).
*   **Short Text Slides**: If two consecutive text slides are **< 80 chars** each, they are combined (stacked) with a divider line.
*   **Long Text Slides**: Standalone.

---

## 6. Hook System
### Seed Hook Bank
| Angle | Hook |
| :--- | :--- |
| Pet | I haven't missed a study session in weeks because I'm too scared to let him down |
| Pet | I named my AI study pet and now I actually enjoy revising |
| Skeptic | My sister was about to fail her resits until I showed her this |
| Skeptic | My mum spent £200 on a tutor until I showed her what this does in 5 minutes |
| Feature | I uploaded my lecture recording and it turned into flashcards, a quiz AND a podcast in 2 min |
| Exam | Exam in 3 days, 200 pages of notes. This is how I survived |

---

## 7. Application Pages
1.  **Dashboard**: Weekly stats, top post, quick action "New Post".
2.  **Create Post**: 5-step wizard (Angle → Hook → Preview/Edit config → Caption review → Send).
3.  **Asset Library**: Tagged store (Pet Stage 1-3, Onboarding, Chat, Studio, CTA). Organised in grid.
4.  **Performance Log**: View entries, sorting by views/date, Claude insight (after 10 posts).
5.  **Settings**: API Keys (Postiz, OpenRouter), TikTok account selector, App config.

---

## 8. API Routes
*   `GET /api/hooks?angle=pet`: Fetch recommendations.
*   `POST /api/hooks/generate`: Data-driven hook suggestions via Claude.
*   `POST /api/posts/generate`: Creates the `config.json` and caption.
*   `POST /api/posts/render`: Sharp processing & AI image generation.
*   `POST /api/posts/send`: Upload to Postiz.
*   `GET /api/posts`: List with view counts.
*   `GET /api/assets`: List library assets.

---

## 9. Database Schema
### `assets`
*   `id` (UUID), `storage_url` (text), `tag` (pet_stage_1-3, hero, cta, app_chat, etc), `use_count` (int).

### `hooks`
*   `id` (UUID), `angle` (text), `text` (text), `status` (untested, active, retired), `times_used` (int).

### `posts`
*   `id` (UUID), `hook_id` (UUID), `angle` (text), `caption` (text), `slide_urls` (jsonb), `views` (int), `status` (draft, sent, published), `config` (jsonb).

---

## 10. Constraints & Decisions
*   **Images**: Owned only (AI Gen or App Screenshots). No Pinterest/Stock.
*   **Music**: Added manually in TikTok.
*   **Postiz**: Upload as `SELF_ONLY` drafts.
*   **Cost**: < $0.50 per post using Nano Banana 2.
*   **Limit**: Max 5 hashtags.

---

## 11. Out of Scope (Phase 1)
*   Auto-publishing (music limitation).
*   Multi-platform (IG/YT).
*   Automatic view syncing (TikTok API is restrictive).
*   Video generation.

---

## 12. Open Questions
*   Postiz pricing for API access?
*   Optimal posting times for student audience? (Determine after 10 posts).
