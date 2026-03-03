// ─── Types ──────────────────────────────────────────────────────────

export interface Hook {
    id: string;
    angle: string;
    text: string;
    status: string;
    times_used: number;
}

export interface SlideConfig {
    slide_number: number;
    image_source: 'ai_generate' | 'library';
    image_prompt?: string;
    asset_tag?: string;
    text_overlay: string | null;
    text_position: 'center' | 'bottom';
}

export interface PostConfig {
    angle: string;
    hook: string;
    caption: string;
    slides: SlideConfig[];
}

export interface DraftData {
    id: string;
    step: number;
    hook: string;
    hookId?: string;
    useCustom?: boolean;
    config?: PostConfig | null;
    caption?: string;
    renderedSlides?: string[];
    updatedAt: number;
}

// ─── Constants ──────────────────────────────────────────────────────
export const BRIGO_APP_ID = '4fafdac6-6d64-4881-8bed-842dcdd8491f';
export const STEPS = ['Select Hook', 'Review Config', 'Preview Slides', 'Send'];
export const DRAFTS_KEY = 'brigo_drafts';
export const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_DRAFTS = 10;
