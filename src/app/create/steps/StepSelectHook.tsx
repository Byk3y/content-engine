'use client';

import {
    ArrowRight,
    Check,
    PenLine,
    Clock,
    X,
} from 'lucide-react';
import { Hook, DraftData } from '../types';
import { getRelativeTime } from '../draft-helpers';

interface StepSelectHookProps {
    hooks: Hook[];
    loadingHooks: boolean;
    selectedHook: Hook | null;
    setSelectedHook: (hook: Hook | null) => void;
    customHook: string;
    setCustomHook: (val: string) => void;
    useCustom: boolean;
    setUseCustom: (val: boolean) => void;
    canProceed: boolean;
    onNext: () => void;
    drafts: DraftData[];
    onResumeDraft: (draft: DraftData) => void;
    onDeleteDraft: (id: string) => void;
    onStartFresh: () => void;
    currentDraftId: string | null;
}

export default function StepSelectHook({
    hooks,
    loadingHooks,
    selectedHook,
    setSelectedHook,
    customHook,
    setCustomHook,
    useCustom,
    setUseCustom,
    canProceed,
    onNext,
    drafts,
    onResumeDraft,
    onDeleteDraft,
    onStartFresh,
    currentDraftId,
}: StepSelectHookProps) {
    return (
        <div className="space-y-12">
            {/* Recent Drafts Section */}
            {drafts.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
                            <Clock size={16} />
                            Recent Drafts
                        </h3>
                        <button
                            onClick={onStartFresh}
                            className="text-[10px] font-mono uppercase tracking-widest text-engine-orange hover:text-white transition-colors"
                        >
                            Start New Post
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {drafts.map((draft) => (
                            <div
                                key={draft.id}
                                className={`group relative p-5 border ${currentDraftId === draft.id
                                    ? 'border-engine-orange bg-engine-orange/5'
                                    : 'border-white/10 bg-white/5 hover:border-white/20'
                                    } transition-all`}
                            >
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-white/40">
                                        <span>Step {draft.step}</span>
                                        <span>{getRelativeTime(draft.updatedAt)}</span>
                                    </div>
                                    <p className="text-sm line-clamp-2 font-medium">
                                        {draft.hook}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => onResumeDraft(draft)}
                                        className="text-[10px] font-mono uppercase tracking-widest bg-white text-black px-3 py-1.5 hover:bg-engine-orange hover:text-white transition-colors"
                                    >
                                        Resume
                                    </button>
                                    <button
                                        onClick={() => onDeleteDraft(draft.id)}
                                        className="text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white transition-colors p-1.5"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-8">
                <div>
                    <h3 className="text-2xl mb-2">Select Hook</h3>
                    <p className="text-white/40 font-mono text-xs">
                        Choose a hook from the bank or write your own. Untested hooks appear first.
                    </p>
                </div>

                {/* Hook Cards */}
                {loadingHooks ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="engine-card animate-pulse">
                                <div className="h-5 w-3/4 bg-white/5 rounded" />
                                <div className="h-3 w-20 bg-white/5 rounded mt-3" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {hooks.map((hook) => {
                            const isSelected = !useCustom && selectedHook?.id === hook.id;
                            return (
                                <button
                                    key={hook.id}
                                    onClick={() => {
                                        setSelectedHook(hook);
                                        setUseCustom(false);
                                    }}
                                    className={`w-full text-left engine-card transition-all ${isSelected
                                        ? '!border-l-engine-orange !bg-engine-orange/10'
                                        : 'hover:!bg-white/[0.04]'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="text-sm font-mono leading-relaxed flex-1">
                                            &ldquo;{hook.text}&rdquo;
                                        </p>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-[9px] font-mono text-white/30 uppercase">
                                                Used {hook.times_used}×
                                            </span>
                                            {hook.status === 'untested' && (
                                                <span className="status-tag bg-engine-orange/20 text-engine-orange">
                                                    Untested
                                                </span>
                                            )}
                                            {isSelected && (
                                                <div className="w-5 h-5 bg-engine-orange flex items-center justify-center">
                                                    <Check size={14} className="text-black" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Custom Hook Input */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-1 h-6 ${useCustom ? 'bg-engine-orange' : 'bg-white/10'}`} />
                        <h3 className="text-lg">Write Your Own</h3>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={customHook}
                            onChange={(e) => {
                                setCustomHook(e.target.value);
                                setUseCustom(true);
                                setSelectedHook(null);
                            }}
                            onFocus={() => {
                                setUseCustom(true);
                                setSelectedHook(null);
                            }}
                            placeholder="My mum spent £200 on a tutor until I showed her what this does in 5 minutes"
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-sm font-mono placeholder:text-white/15 focus:border-engine-orange focus:outline-none transition-colors"
                        />
                        {useCustom && customHook.trim() && (
                            <div className="w-10 h-10 bg-engine-orange/20 border border-engine-orange/40 flex items-center justify-center shrink-0 self-center">
                                <PenLine size={16} className="text-engine-orange" />
                            </div>
                        )}
                    </div>
                    {useCustom && customHook.trim().length > 0 && customHook.trim().length <= 10 && (
                        <p className="text-[10px] font-mono text-red-400">
                            Hook is too short — aim for a full sentence
                        </p>
                    )}
                </div>

                {/* Proceed Button */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={onNext}
                        disabled={!canProceed}
                        className={`btn-engine flex items-center gap-3 ${!canProceed ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                    >
                        <span>Generate Config</span>
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
