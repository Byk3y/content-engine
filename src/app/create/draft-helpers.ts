import { DraftData, DRAFTS_KEY, DRAFT_MAX_AGE_MS, MAX_DRAFTS } from './types';

// ─── Draft Helpers ──────────────────────────────────────────────────

export function getAllDrafts(): DraftData[] {
    try {
        const raw = localStorage.getItem(DRAFTS_KEY);
        if (!raw) return [];
        const parsed: DraftData[] = JSON.parse(raw);
        const now = Date.now();
        // Filter out expired drafts
        const valid = parsed.filter(
            (d) => now - d.updatedAt < DRAFT_MAX_AGE_MS
        );
        // Sort newest first
        valid.sort((a, b) => b.updatedAt - a.updatedAt);
        return valid;
    } catch {
        return [];
    }
}

export function saveDraft(data: Omit<DraftData, 'updatedAt'>) {
    try {
        const existing = getAllDrafts();
        const updated: DraftData = { ...data, updatedAt: Date.now() };

        // Replace if same ID, else prepend
        const idx = existing.findIndex((d) => d.id === data.id);
        if (idx >= 0) {
            existing[idx] = updated;
        } else {
            existing.unshift(updated);
        }

        // Enforce max drafts
        const trimmed = existing.slice(0, MAX_DRAFTS);
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(trimmed));
    } catch (e) {
        console.error('Failed to save draft:', e);
    }
}

export function deleteDraft(id: string) {
    try {
        const existing = getAllDrafts();
        const filtered = existing.filter((d) => d.id !== id);
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
    } catch (e) {
        console.error('Failed to delete draft:', e);
    }
}

export function getRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}
