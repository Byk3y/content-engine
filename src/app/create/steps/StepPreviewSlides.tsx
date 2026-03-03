'use client';

import {
    ArrowRight,
    ArrowLeft,
    Loader2,
    RefreshCw,
    Sparkles,
    AlertTriangle,
} from 'lucide-react';

interface StepPreviewSlidesProps {
    renderedSlides: string[];
    renderingSlides: boolean;
    onRerender: () => void;
    onBack: () => void;
    onNext: () => void;
}

export default function StepPreviewSlides({
    renderedSlides,
    renderingSlides,
    onRerender,
    onBack,
    onNext,
}: StepPreviewSlidesProps) {
    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-2xl mb-2">Preview Slides</h3>
                    <p className="text-white/40 font-mono text-xs">
                        Review your rendered carousel slides. AI images may take a few seconds to generate.
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to Config
                </button>
            </div>

            {renderingSlides ? (
                <div className="engine-card flex flex-col items-center justify-center py-32 gap-6">
                    <div className="relative">
                        <Loader2 size={48} className="text-engine-orange animate-spin" />
                        <Sparkles size={20} className="text-engine-orange absolute -top-2 -right-2 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-sm font-mono uppercase tracking-widest">Rendering Content Engine...</p>
                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                            Fetching assets + generating AI visuals
                        </p>
                    </div>
                </div>
            ) : renderedSlides.length > 0 ? (
                <div className="space-y-8">
                    <div className="flex overflow-x-auto pb-6 gap-6 snap-x no-scrollbar">
                        {renderedSlides.map((src, i) => (
                            <div key={i} className="snap-center shrink-0">
                                <div className="relative group">
                                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-black border border-white/10 flex items-center justify-center text-xs font-mono font-bold z-10">
                                        {i + 1}
                                    </div>
                                    <img
                                        src={src}
                                        alt={`Slide ${i + 1}`}
                                        className="w-[300px] aspect-[4/5] border border-white/10 shadow-2xl object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] font-mono uppercase text-white/60 tracking-widest">
                                            Slide {i + 1} • 1080×1350
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6">
                        <button
                            onClick={onRerender}
                            className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors"
                        >
                            <RefreshCw size={14} />
                            Regenerate Visuals
                        </button>
                        <button
                            onClick={onNext}
                            className="btn-engine flex items-center gap-3"
                        >
                            <span>Finish & Export</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="engine-card text-center py-20 bg-red-500/5 border-red-500/20">
                    <AlertTriangle size={48} className="mx-auto text-red-500/40 mb-4" />
                    <p className="text-sm font-mono text-red-400">Rendering failed. Please try again.</p>
                    <button
                        onClick={onRerender}
                        className="mt-4 px-6 py-2 border border-red-500/30 text-red-400 text-[10px] font-mono uppercase tracking-widest hover:bg-red-500/10 transition-all"
                    >
                        Retry Render
                    </button>
                </div>
            )}
        </div>
    );
}
