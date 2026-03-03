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
    selectedIntegration: Integration | null;
    setSelectedIntegration: (val: Integration) => void;
    sending: boolean;
    sent: boolean;
    sendError: string | null;
    captionCopied: boolean;
    onSend: () => void;
    onCopyCaption: () => void;
    onBack: () => void;
    onStartFresh: () => void;
}

export default function StepSendToTikTok({
    renderedSlides,
    caption,
    setCaption,
    integrations,
    loadingIntegrations,
    selectedIntegration,
    setSelectedIntegration,
    sending,
    sent,
    sendError,
    captionCopied,
    onSend,
    onCopyCaption,
    onBack,
    onStartFresh,
}: StepSendToTikTokProps) {
    return (
        <div className="space-y-8">
            {sent ? (
                /* ─── Success Screen ─────────────────────────── */
                <div className="engine-card text-center py-20 space-y-6">
                    <PartyPopper size={64} className="mx-auto text-engine-orange" />
                    <h3 className="text-3xl font-bold">Carousel Sent! 🔥</h3>
                    <div className="max-w-md mx-auto space-y-4">
                        <p className="text-white/60 font-mono text-sm leading-relaxed">
                            Your carousel is in your TikTok drafts. Open TikTok → Go to your profile → Drafts → Add a trending sound → Paste the caption → Hit publish 🔥
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
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-2xl mb-2">Send to TikTok</h3>
                            <p className="text-white/40 font-mono text-xs">
                                Review your caption, select a TikTok channel, and send as a draft.
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

                    {/* TikTok Channel Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                            TikTok Channel
                        </label>
                        {loadingIntegrations ? (
                            <div className="engine-card flex items-center gap-3 py-4">
                                <Loader2 size={16} className="text-engine-orange animate-spin" />
                                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Loading channels...</span>
                            </div>
                        ) : integrations.length === 0 ? (
                            <div className="engine-card py-6 text-center">
                                <AlertTriangle size={24} className="mx-auto text-yellow-500/60 mb-2" />
                                <p className="text-xs font-mono text-white/40">No TikTok channels found. Connect a TikTok account in Postiz first.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {integrations.map((integration) => {
                                    const isSelected = selectedIntegration?.id === integration.id;
                                    return (
                                        <button
                                            key={integration.id}
                                            onClick={() => setSelectedIntegration(integration)}
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
                                                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">TikTok</p>
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
                            disabled={sending || !selectedIntegration || renderedSlides.length === 0}
                            className={`btn-engine flex items-center gap-3 ${(sending || !selectedIntegration) ? 'opacity-50 cursor-not-allowed' : ''
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
                                    <span>Send to TikTok Drafts</span>
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
