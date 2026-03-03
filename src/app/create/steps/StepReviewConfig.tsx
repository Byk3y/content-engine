'use client';

import {
    ArrowRight,
    ArrowLeft,
    Loader2,
    RefreshCw,
    Sparkles,
    BookOpen,
    AlertTriangle,
    Image as ImageIcon,
} from 'lucide-react';
import { PostConfig } from '../types';

interface StepReviewConfigProps {
    hookText: string;
    config: PostConfig | null;
    generatingConfig: boolean;
    configError: string | null;
    onRegenerate: () => void;
    onUpdateOverlay: (slideIndex: number, text: string) => void;
    onBack: () => void;
    onNext: () => void;
}

export default function StepReviewConfig({
    hookText,
    config,
    generatingConfig,
    configError,
    onRegenerate,
    onUpdateOverlay,
    onBack,
    onNext,
}: StepReviewConfigProps) {
    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-2xl mb-2">Review Config</h3>
                    <p className="text-white/40 font-mono text-xs max-w-xl">
                        Claude generated a 6-slide config for your hook. Edit any text overlay, then approve to render.
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

            {/* Selected Hook Banner */}
            <div className="engine-card !border-l-engine-orange">
                <p className="text-[10px] font-mono text-engine-orange uppercase tracking-widest mb-2">
                    Selected Hook
                </p>
                <p className="text-sm font-mono leading-relaxed">
                    &ldquo;{hookText}&rdquo;
                </p>
            </div>

            {/* Loading / Error / Config Display */}
            {generatingConfig ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 size={32} className="text-engine-orange animate-spin" />
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                        Claude is writing your carousel config...
                    </p>
                </div>
            ) : configError ? (
                <div className="engine-card !border-l-red-500 space-y-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={18} className="text-red-400" />
                        <p className="text-sm font-mono text-red-400">{configError}</p>
                    </div>
                    <button
                        onClick={onRegenerate}
                        className="flex items-center gap-2 px-4 py-2 border border-white/10 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:bg-white/5 transition-colors"
                    >
                        <RefreshCw size={14} />
                        Retry
                    </button>
                </div>
            ) : config ? (
                <div className="space-y-6">
                    {/* Slide Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {config.slides.map((slide, i) => (
                            <div key={slide.slide_number} className="engine-card space-y-4">
                                {/* Slide Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 bg-engine-orange/20 text-engine-orange flex items-center justify-center text-xs font-mono font-bold">
                                            {slide.slide_number}
                                        </span>
                                        <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                                            Slide {slide.slide_number}
                                        </span>
                                    </div>
                                    <span
                                        className={`status-tag ${slide.image_source === 'ai_generate'
                                            ? 'bg-purple-500/20 text-purple-400'
                                            : 'bg-blue-500/20 text-blue-400'
                                            }`}
                                    >
                                        {slide.image_source === 'ai_generate' ? (
                                            <span className="flex items-center gap-1">
                                                <Sparkles size={10} />
                                                AI Generate
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <BookOpen size={10} />
                                                Library
                                            </span>
                                        )}
                                    </span>
                                </div>

                                {/* Asset Tag (if library) */}
                                {slide.asset_tag && (
                                    <div className="flex items-center gap-2">
                                        <ImageIcon size={12} className="text-white/20" />
                                        <span className="text-[10px] font-mono text-white/50">
                                            {slide.asset_tag}
                                        </span>
                                    </div>
                                )}

                                {/* Image Prompt (if AI, collapsed) */}
                                {slide.image_prompt && (
                                    <details className="group">
                                        <summary className="text-[10px] font-mono text-white/30 uppercase tracking-widest cursor-pointer hover:text-white/50">
                                            Image Prompt ▸
                                        </summary>
                                        <p className="mt-2 text-[11px] font-mono text-white/40 leading-relaxed">
                                            {slide.image_prompt}
                                        </p>
                                    </details>
                                )}

                                {/* Editable Text Overlay */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                                        Text Overlay
                                    </label>
                                    <textarea
                                        value={slide.text_overlay || ''}
                                        onChange={(e) => onUpdateOverlay(i, e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 text-xs font-mono placeholder:text-white/15 focus:border-engine-orange focus:outline-none transition-colors resize-none"
                                        placeholder="No text overlay"
                                    />
                                </div>

                                {/* Text Position */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-white/20 uppercase">Position:</span>
                                    <span className="text-[9px] font-mono text-engine-orange uppercase">
                                        {slide.text_position}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4">
                        <button
                            onClick={onRegenerate}
                            disabled={generatingConfig}
                            className="flex items-center gap-2 px-4 py-3 border border-white/10 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:bg-white/5 transition-colors"
                        >
                            <RefreshCw size={14} className={generatingConfig ? 'animate-spin' : ''} />
                            Regenerate
                        </button>
                        <button
                            onClick={onNext}
                            className="btn-engine flex items-center gap-3"
                        >
                            <span>Render Slides</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
