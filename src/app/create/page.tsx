'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

// ─── Local modules ──────────────────────────────────────────────────
import { Hook, PostConfig, DraftData, BRIGO_APP_ID, STEPS } from './types';
import { getAllDrafts, saveDraft, deleteDraft } from './draft-helpers';

// ─── Step Components ────────────────────────────────────────────────
import StepSelectHook from './steps/StepSelectHook';
import StepReviewConfig from './steps/StepReviewConfig';
import StepPreviewSlides from './steps/StepPreviewSlides';
import StepSendToTikTok from './steps/StepSendToTikTok';

// ─── Main Wizard Component ─────────────────────────────────────────
export default function CreatePostPage() {
    const [step, setStep] = useState(1);
    const [selectedAngle, setSelectedAngle] = useState('pet');
    const [hooks, setHooks] = useState<Hook[]>([]);
    const [loadingHooks, setLoadingHooks] = useState(true);
    const [selectedHook, setSelectedHook] = useState<Hook | null>(null);
    const [customHook, setCustomHook] = useState('');
    const [useCustom, setUseCustom] = useState(false);

    // Step 2 state
    const [config, setConfig] = useState<PostConfig | null>(null);
    const [generatingConfig, setGeneratingConfig] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);

    // Step 3 state
    const [renderedSlides, setRenderedSlides] = useState<string[]>([]);
    const [renderingSlides, setRenderingSlides] = useState(false);

    // Step 4 state
    const [caption, setCaption] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [captionCopied, setCaptionCopied] = useState(false);
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [loadingIntegrations, setLoadingIntegrations] = useState(false);
    const [selectedIntegrations, setSelectedIntegrations] = useState<any[]>([]);
    const [sentPlatforms, setSentPlatforms] = useState<string[]>([]);
    const [sendError, setSendError] = useState<string | null>(null);

    // Draft Collection
    const [drafts, setDrafts] = useState<DraftData[]>([]);
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    function showToast(message: string, type: 'success' | 'error') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }

    // ─── Generate a draft ID ────────────────────────────────────────
    function generateDraftId() {
        return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    const draftId = currentDraftId || generateDraftId();

    // ─── Step 1: Fetch Hooks ────────────────────────────────────────
    const fetchHooks = useCallback(async () => {
        setLoadingHooks(true);
        const { data, error } = await supabase
            .from('hooks')
            .select('*')
            .eq('angle', selectedAngle)
            .order('times_used', { ascending: true });

        if (error) {
            showToast('Failed to load hooks', 'error');
            console.error(error);
        } else {
            setHooks(data || []);
        }
        setLoadingHooks(false);
    }, [selectedAngle]);

    function handleAngleChange(angle: string) {
        setSelectedAngle(angle);
        setSelectedHook(null);
        setCustomHook('');
        setUseCustom(false);
    }

    useEffect(() => {
        fetchHooks();
        // Load drafts from localStorage
        setDrafts(getAllDrafts());
    }, [fetchHooks]);

    // ─── Draft Resume / Delete ──────────────────────────────────────
    function handleResumeDraft(draft: DraftData) {
        setCurrentDraftId(draft.id);
        // Restore hook
        if (draft.hookId) {
            const hookMatch = hooks.find(h => h.id === draft.hookId);
            if (hookMatch) {
                setSelectedHook(hookMatch);
                setUseCustom(false);
                setCustomHook('');
            } else {
                setCustomHook(draft.hook);
                setUseCustom(true);
                setSelectedHook(null);
            }
        } else if (draft.useCustom) {
            setCustomHook(draft.hook);
            setUseCustom(true);
            setSelectedHook(null);
        }
        // Restore config
        if (draft.config) setConfig(draft.config);
        // Restore caption
        if (draft.caption) setCaption(draft.caption);
        // Restore rendered slides
        if (draft.renderedSlides?.length) {
            setRenderedSlides(draft.renderedSlides);
        }
        // Jump to last saved step
        if (draft.step >= 2 && draft.config) {
            if (draft.step >= 3 && draft.renderedSlides?.length) {
                setStep(3);
            } else {
                setStep(2);
            }
        } else {
            setStep(1);
        }
        showToast('Draft resumed', 'success');
    }

    function handleDeleteDraft(id: string) {
        deleteDraft(id);
        setDrafts(getAllDrafts());
        if (currentDraftId === id) {
            setCurrentDraftId(null);
        }
        showToast('Draft deleted', 'success');
    }

    function handleStartFresh() {
        setStep(1);
        setSelectedHook(null);
        setCustomHook('');
        setUseCustom(false);
        setConfig(null);
        setRenderedSlides([]);
        setCaption('');
        setCurrentDraftId(null);
        setSent(false);
        setSentPlatforms([]);
    }

    // ─── Get the active hook text ───────────────────────────────────
    function getHookText(): string {
        if (useCustom) return customHook.trim();
        return selectedHook?.text || '';
    }

    function canProceedStep1(): boolean {
        if (useCustom) return customHook.trim().length > 10;
        return selectedHook !== null;
    }

    // ─── Step 2: Generate Config ────────────────────────────────────
    async function handleGenerateConfig() {
        const hookText = getHookText();
        if (!hookText) return;
        setGeneratingConfig(true);
        setConfigError(null);

        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            const response = await fetch(`${supabaseUrl}/functions/v1/generate-config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    hook_text: hookText,
                    angle: selectedAngle,
                    app_id: BRIGO_APP_ID,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Config generation failed');
            setConfig(data.config);
            setCaption(data.config.caption || '');
            // Save draft after Step 2

            saveDraft({
                id: draftId,
                step: 2,
                hook: hookText,
                hookId: selectedHook?.id,
                useCustom,
                config: data.config,
                caption: data.config.caption || '',
            });
            if (!currentDraftId) setCurrentDraftId(draftId);
            setDrafts(getAllDrafts());
        } catch (err: any) {
            setConfigError(err.message || 'Something went wrong');
        } finally {
            setGeneratingConfig(false);
        }
    }

    // ─── Step 2: Update slide overlay ───────────────────────────────
    function updateSlideOverlay(slideIndex: number, text: string) {
        if (!config) return;
        const updated = { ...config };
        updated.slides = [...config.slides];
        updated.slides[slideIndex] = { ...updated.slides[slideIndex], text_overlay: text || null };
        setConfig(updated);
    }

    function updateCharacter(text: string) {
        if (!config) return;
        setConfig({ ...config, character: text });
    }

    function updateRating(slideIndex: number, text: string) {
        if (!config) return;
        const updated = { ...config };
        updated.slides = [...config.slides];
        updated.slides[slideIndex] = { ...updated.slides[slideIndex], rating: text };
        setConfig(updated);
    }

    function updateSubtext(slideIndex: number, text: string) {
        if (!config) return;
        const updated = { ...config };
        updated.slides = [...config.slides];
        updated.slides[slideIndex] = { ...updated.slides[slideIndex], subtext: text };
        setConfig(updated);
    }

    // ─── Step 3: Render Slides ─────────────────────────────────────
    async function handleRenderSlides() {
        if (!config) return;
        setRenderingSlides(true);
        setRenderedSlides([]);

        try {
            const response = await fetch('/api/render-slides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slides: config.slides,
                    hookText: getHookText(),
                    character: config.character || '',
                    app_id: BRIGO_APP_ID,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Render failed');
            }

            const data = await response.json();
            const slideImages = data.slides.map((s: any) => s.url);
            setRenderedSlides(slideImages);
            // Save draft after Step 3 with rendered slides
            saveDraft({
                id: draftId,
                step: 3,
                hook: getHookText(),
                hookId: selectedHook?.id,
                useCustom,
                config,
                caption,
                renderedSlides: slideImages,
            });
            setDrafts(getAllDrafts());
        } catch (err: any) {
            showToast('Render failed: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            setRenderingSlides(false);
        }
    }

    // ─── Navigate Steps ─────────────────────────────────────────────
    function goToStep(target: number) {
        if (target === 2 && step === 1) {
            // Save draft after Step 1
            saveDraft({
                id: draftId,
                step: 1,
                hook: getHookText(),
                hookId: selectedHook?.id,
                useCustom,
            });
            if (!currentDraftId) setCurrentDraftId(draftId);
            setDrafts(getAllDrafts());
            // Generate config
            setStep(2);
            handleGenerateConfig();
        } else if (target === 3 && step === 2) {
            // Entering Step 3 — render
            setStep(3);
            handleRenderSlides();
        } else if (target === 4 && step === 3) {
            // Save draft after Step 3
            saveDraft({
                id: draftId,
                step: 3,
                hook: getHookText(),
                hookId: selectedHook?.id,
                useCustom,
                config,
                caption,
                renderedSlides,
            });
            setStep(4);
            // Fetch TikTok integrations when entering Step 4
            fetchIntegrations();
        } else {
            setStep(target);
        }
    }

    // ─── Step 4: Fetch Postiz Integrations ──────────────────────────
    async function fetchIntegrations() {
        setLoadingIntegrations(true);
        try {
            const res = await fetch('/api/postiz-integrations');
            if (!res.ok) throw new Error('Failed to fetch integrations');
            const data = await res.json();
            setIntegrations(data.integrations || []);
            // Auto-select all channels by default
            if (data.integrations?.length > 0) {
                setSelectedIntegrations(data.integrations);
            }
        } catch (err: any) {
            console.error('Failed to fetch integrations:', err.message);
            showToast('Failed to load TikTok channels', 'error');
        } finally {
            setLoadingIntegrations(false);
        }
    }

    // ─── Step 4: Copy caption ───────────────────────────────────────
    async function handleCopyCaption() {
        try {
            await navigator.clipboard.writeText(caption);
            setCaptionCopied(true);
            setTimeout(() => setCaptionCopied(false), 2000);
        } catch {
            showToast('Failed to copy', 'error');
        }
    }

    // ─── Step 4: Toggle channel selection ────────────────────────────
    function handleToggleIntegration(integration: any) {
        setSelectedIntegrations(prev => {
            const exists = prev.some((si: any) => si.id === integration.id);
            if (exists) {
                return prev.filter((si: any) => si.id !== integration.id);
            }
            return [...prev, integration];
        });
    }

    // ─── Step 4: Send to selected channels ──────────────────────────
    async function handleSendToTikTok() {
        if (selectedIntegrations.length === 0 || renderedSlides.length === 0) return;
        setSending(true);
        setSendError(null);
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            // Send to each selected channel in parallel
            const results = await Promise.all(
                selectedIntegrations.map(async (integration: any) => {
                    const platform = integration.identifier === 'instagram-standalone' ? 'instagram' : 'tiktok';
                    const response = await fetch(`${supabaseUrl}/functions/v1/send-to-tiktok`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseAnonKey}`,
                        },
                        body: JSON.stringify({
                            slide_urls: renderedSlides,
                            caption,
                            hook_id: selectedHook?.id || null,
                            hook_text: getHookText(),
                            integration_id: integration.id,
                            angle: selectedAngle,
                            platform,
                        }),
                    });

                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || `Send to ${platform} failed`);
                    return { platform: integration.identifier, success: true };
                })
            );

            // Track which platforms succeeded
            const succeeded = results
                .filter(r => r.success)
                .map(r => r.platform);
            setSentPlatforms(succeeded);

            // Success — clear this draft from localStorage
            if (currentDraftId) {
                deleteDraft(currentDraftId);
                setDrafts(getAllDrafts());
            }
            setSent(true);
        } catch (err: any) {
            setSendError(err.message || 'Failed to send');
            showToast('Send failed: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            setSending(false);
        }
    }

    // ─── Render ─────────────────────────────────────────────────────
    return (
        <div className="space-y-10 max-w-5xl">
            {/* Header */}
            <header>
                <h2 className="text-4xl md:text-6xl mb-2">Create Post</h2>
                <p className="text-engine-orange font-mono text-sm tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-engine-orange rounded-full" />
                    {selectedAngle === 'pet' ? 'PET EVOLUTION' : 'SKEPTIC STORY'} // 6-SLIDE CAROUSEL
                </p>
            </header>

            {/* Step Indicator */}
            <div className="flex items-center gap-2">
                {STEPS.map((label, i) => {
                    const stepNum = i + 1;
                    const isActive = step === stepNum;
                    const isDone = step > stepNum;
                    return (
                        <div key={label} className="flex items-center gap-2">
                            {i > 0 && (
                                <div
                                    className={`h-px w-6 md:w-12 ${isDone ? 'bg-engine-orange' : 'bg-white/10'}`}
                                />
                            )}
                            <div
                                className={`flex items-center gap-2 px-4 py-2 border transition-all ${isActive
                                    ? 'border-engine-orange bg-engine-orange/10 text-engine-orange'
                                    : isDone
                                        ? 'border-engine-orange/40 bg-engine-orange/5 text-engine-orange/60'
                                        : 'border-white/10 text-white/30'
                                    }`}
                            >
                                <span className="text-[10px] font-mono uppercase tracking-widest">
                                    {isDone ? '✓' : stepNum}
                                </span>
                                <span className="text-[10px] font-mono uppercase tracking-widest hidden md:inline">
                                    {label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── Step Views ─────────────────────────────────────────── */}
            {step === 1 && (
                <StepSelectHook
                    hooks={hooks}
                    loadingHooks={loadingHooks}
                    selectedHook={selectedHook}
                    setSelectedHook={setSelectedHook}
                    customHook={customHook}
                    setCustomHook={setCustomHook}
                    useCustom={useCustom}
                    setUseCustom={setUseCustom}
                    canProceed={canProceedStep1()}
                    onNext={() => goToStep(2)}
                    drafts={drafts}
                    onResumeDraft={handleResumeDraft}
                    onDeleteDraft={handleDeleteDraft}
                    onStartFresh={handleStartFresh}
                    currentDraftId={currentDraftId}
                    selectedAngle={selectedAngle}
                    onAngleChange={handleAngleChange}
                />
            )}

            {step === 2 && (
                <StepReviewConfig
                    hookText={getHookText()}
                    config={config}
                    generatingConfig={generatingConfig}
                    configError={configError}
                    onRegenerate={handleGenerateConfig}
                    onUpdateOverlay={updateSlideOverlay}
                    onUpdateRating={updateRating}
                    onUpdateSubtext={updateSubtext}
                    onUpdateCharacter={updateCharacter}
                    onBack={() => setStep(1)}
                    onNext={() => goToStep(3)}
                />
            )}

            {step === 3 && (
                <StepPreviewSlides
                    renderedSlides={renderedSlides}
                    renderingSlides={renderingSlides}
                    onRerender={handleRenderSlides}
                    onBack={() => setStep(2)}
                    onNext={() => goToStep(4)}
                />
            )}

            {step === 4 && (
                <StepSendToTikTok
                    renderedSlides={renderedSlides}
                    caption={caption}
                    setCaption={setCaption}
                    integrations={integrations}
                    loadingIntegrations={loadingIntegrations}
                    selectedIntegrations={selectedIntegrations}
                    onToggleIntegration={handleToggleIntegration}
                    sending={sending}
                    sent={sent}
                    sentPlatforms={sentPlatforms}
                    sendError={sendError}
                    captionCopied={captionCopied}
                    onSend={handleSendToTikTok}
                    onCopyCaption={handleCopyCaption}
                    onBack={() => setStep(3)}
                    onStartFresh={handleStartFresh}
                />
            )}

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 border text-sm font-mono transition-all ${toast.type === 'success'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                >
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
}
