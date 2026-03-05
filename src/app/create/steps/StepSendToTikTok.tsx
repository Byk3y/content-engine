'use client';

import {
    ArrowRight,
    ArrowLeft,
    Check,
    Loader2,
    Copy,
    Send,
    AlertTriangle,
    Clipboard,
    PartyPopper,
} from 'lucide-react';

interface Integration {
    id: string;
    name: string;
    picture: string | null;
    identifier: string;
}

interface StepSendToTikTokProps {
    renderedSlides: string[];
    caption: string;
    setCaption: (val: string) => void;
    integrations: Integration[];
    loadingIntegrations: boolean;
    selectedIntegrations: Integration[];
    onToggleIntegration: (integration: Integration) => void;
    sending: boolean;
    sent: boolean;
    sentPlatforms: string[];
    sendError: string | null;
    captionCopied: boolean;
    onSend: () => void;
    onCopyCaption: () => void;
    onBack: () => void;
    onStartFresh: () => void;
}

function getPlatformLabel(identifier: string): string {
    if (identifier === 'tiktok') return 'TikTok';
    if (identifier === 'instagram-standalone') return 'Instagram';
    return identifier;
}

function getPlatformEmoji(identifier: string): string {
    if (identifier === 'tiktok') return '🎵';
    if (identifier === 'instagram-standalone') return '📸';
    return '📱';
}

export default function StepSendToTikTok({
    renderedSlides,
    caption,
    setCaption,
    integrations,
    loadingIntegrations,
    selectedIntegrations,
    onToggleIntegration,
    sending,
    sent,
    sentPlatforms,
    sendError,
    captionCopied,
    onSend,
    onCopyCaption,
    onBack,
    onStartFresh,
}: StepSendToTikTokProps) {
    const hasSelection = selectedIntegrations.length > 0;

    return (
        <div className="space-y-8">
            {sent ? (
                /* ─── Success Screen ─────────────────────────── */
                <div className="engine-card text-center py-20 space-y-6">
                    <PartyPopper size={64} className="mx-auto text-engine-orange" />
                    <h3 className="text-3xl font-bold">Carousel Sent! 🔥</h3>
                    <div className="max-w-md mx-auto space-y-4">
                        {/* Show which platforms the post was sent to */}
                        <div className="flex items-center justify-center gap-3">
                            {sentPlatforms.map((platform) => (
                                <span
                                    key={platform}
                                    className="px-3 py-1.5 bg-engine-orange/15 border border-engine-orange/30 text-engine-orange text-xs font-mono uppercase tracking-widest"
                                >
                                    {getPlatformEmoji(platform)} {getPlatformLabel(platform)}
                                </span>
                            ))}
                        </div>
                        <p className="text-white/60 font-mono text-sm leading-relaxed">
                            {sentPlatforms.includes('tiktok') && sentPlatforms.includes('instagram-standalone')
                                ? 'Your carousel was sent to both TikTok Creator Inbox and Instagram. Check each platform to review and publish.'
                                : sentPlatforms.includes('instagram-standalone')
                                    ? 'Your carousel was sent to Instagram. Check Instagram to review and publish 🔥'
                                    : 'Your carousel is in your TikTok Creator Inbox. Open TikTok on desktop at tiktok.com → check your inbox → review the carousel → add a trending sound → publish 🔥'
                            }
                        </p>
                        <button
                            onClick={onCopyCaption}
                            className="flex items-center gap-2 mx-auto px-4 py-2 border border-white/10 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:bg-white/5 transition-colors"
                        >
                            {captionCopied ? <Check size={14} /> : <Clipboard size={14} />}
                            {captionCopied ? 'Copied!' : 'Copy Caption Again'}
                        </button>
                    </div>
                    <button
                        onClick={onStartFresh}
                        className="btn-engine flex items-center gap-3 mx-auto mt-8"
                    >
                        <span>Create Another Post</span>
                        <ArrowRight size={20} />
                    </button>
                </div>
            ) : (
                /* ─── Send Form ──────────────────────────────── */
                <>
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h3 className="text-2xl mb-2">Send to Channels</h3>
                            <p className="text-white/40 font-mono text-xs">
                                Review your caption, select one or more channels, and send your carousel.
                            </p>
                        </div>
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors"
                        >
                            <ArrowLeft size={14} />
                            Back
                        </button>
                    </div>

                    {/* Slide Thumbnails */}
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {renderedSlides.map((src, i) => (
                            <img
                                key={i}
                                src={src}
                                alt={`Slide ${i + 1}`}
                                className="w-20 aspect-[4/5] border border-white/10 object-cover shrink-0"
                            />
                        ))}
                    </div>

                    {/* Caption Editor */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                                Caption
                            </label>
                            <button
                                onClick={onCopyCaption}
                                className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-engine-orange transition-colors"
                            >
                                {captionCopied ? <Check size={12} /> : <Copy size={12} />}
                                {captionCopied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 text-sm font-mono placeholder:text-white/15 focus:border-engine-orange focus:outline-none transition-colors resize-none leading-relaxed"
                            placeholder="Write your caption here..."
                        />
                    </div>

                    {/* Channel Selector — Multi-select */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                            Publishing Channels — select one or more
                        </label>
                        {loadingIntegrations ? (
                            <div className="engine-card flex items-center gap-3 py-4">
                                <Loader2 size={16} className="text-engine-orange animate-spin" />
                                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Loading channels...</span>
                            </div>
                        ) : integrations.length === 0 ? (
                            <div className="engine-card py-6 text-center">
                                <AlertTriangle size={24} className="mx-auto text-yellow-500/60 mb-2" />
                                <p className="text-xs font-mono text-white/40">No channels found. Connect a TikTok or Instagram account in Postiz first.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {integrations.map((integration) => {
                                    const isSelected = selectedIntegrations.some(si => si.id === integration.id);
                                    const platformLabel = getPlatformLabel(integration.identifier);
                                    const platformEmoji = getPlatformEmoji(integration.identifier);
                                    return (
                                        <button
                                            key={integration.id}
                                            onClick={() => onToggleIntegration(integration)}
                                            className={`w-full flex items-center gap-4 p-4 border transition-all text-left ${isSelected
                                                ? 'border-engine-orange bg-engine-orange/10'
                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            {integration.picture ? (
                                                <img
                                                    src={integration.picture}
                                                    alt={integration.name}
                                                    className="w-10 h-10 rounded-full border border-white/10 object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                    <Send size={16} className="text-white/40" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{integration.name}</p>
                                                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                                                    {platformEmoji} {platformLabel}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <div className="w-6 h-6 bg-engine-orange flex items-center justify-center">
                                                    <Check size={14} className="text-black" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Send Error */}
                    {sendError && (
                        <div className="engine-card !border-l-red-500">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={16} className="text-red-400" />
                                <p className="text-xs font-mono text-red-400">{sendError}</p>
                            </div>
                        </div>
                    )}

                    {/* Send Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={onSend}
                            disabled={sending || !hasSelection || renderedSlides.length === 0}
                            className={`btn-engine flex items-center gap-3 ${(sending || !hasSelection) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {sending ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    <span>
                                        {selectedIntegrations.length > 1
                                            ? `Send to ${selectedIntegrations.length} Channels`
                                            : selectedIntegrations.length === 1
                                                ? `Send to ${getPlatformLabel(selectedIntegrations[0].identifier)} Inbox`
                                                : 'Select a Channel'
                                        }
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
