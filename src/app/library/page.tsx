'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Trash2, Image as ImageIcon, X, Check, AlertTriangle } from 'lucide-react';

// ─── Tag Configuration ─────────────────────────────────────────────
const ALL_TAGS = [
    'pet_stage_1',
    'pet_stage_2',
    'pet_stage_3',
    'app_onboarding',
    'app_chat',
    'app_studio',
    'app_add_material',
    'cta',
    'hero',
    'tips_card',
    'app_flashcards',
    'app_quiz',
    'app_predict',
    'app_podcast',
    'app_studio_results',
] as const;

type AssetTag = (typeof ALL_TAGS)[number];

const TAG_LABELS: Record<AssetTag, string> = {
    pet_stage_1: 'Pet Stage 1',
    pet_stage_2: 'Pet Stage 2',
    pet_stage_3: 'Pet Stage 3',
    app_onboarding: 'App Onboarding',
    app_chat: 'App Chat',
    app_studio: 'App Studio',
    app_add_material: 'Add Material',
    cta: 'CTA',
    hero: 'Hero',
    tips_card: 'Tips Card',
    app_flashcards: 'App Flashcards',
    app_quiz: 'App Quiz',
    app_predict: 'App Predict',
    app_podcast: 'App Podcast',
    app_studio_results: 'App Studio Results',
};

// ─── Types ──────────────────────────────────────────────────────────
type Asset = {
    id: string;
    app_id: string | null;
    storage_url: string;
    tag: string;
    label: string | null;
    use_count: number;
    created_at: string;
};

// Brigo app ID from the seed data
const BRIGO_APP_ID = '4fafdac6-6d64-4881-8bed-842dcdd8491f';

// ─── Sub-Components ───────────────────────────────────────────────
function AssetCard({
    asset,
    onDelete,
    deleting,
}: {
    asset: Asset;
    onDelete: (asset: Asset) => void;
    deleting: string | null;
}) {
    return (
        <div className="group relative engine-card !p-0 overflow-hidden max-w-[320px] mx-auto w-full">
            {/* Thumbnail */}
            <div className="aspect-[4/5] relative bg-engine-gray/30 overflow-hidden">
                <img
                    src={asset.storage_url}
                    alt={asset.label || asset.tag}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <button
                        onClick={() => onDelete(asset)}
                        disabled={deleting === asset.id}
                        className="p-3 bg-red-500/20 border border-red-500/50 hover:bg-red-500 hover:text-white text-red-400 transition-all"
                    >
                        {deleting === asset.id ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                        ) : (
                            <Trash2 size={20} />
                        )}
                    </button>
                </div>
            </div>

            {/* Info bar */}
            <div className="p-3 space-y-1 bg-engine-black/80 backdrop-blur-sm border-t border-white/5">
                <p className="text-[10px] font-mono truncate text-white/80 uppercase tracking-wider">
                    {asset.label || 'Untitled'}
                </p>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-engine-orange uppercase tracking-widest opacity-80">
                        {TAG_LABELS[asset.tag as AssetTag] || asset.tag}
                    </span>
                    <span className="text-[9px] font-mono text-white/30">
                        {asset.use_count}×
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Component ──────────────────────────────────────────────────────
export default function AssetLibraryPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [filterTag, setFilterTag] = useState<AssetTag | 'all'>('all');
    const [dragOver, setDragOver] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [uploadTag, setUploadTag] = useState<AssetTag>('app_onboarding');
    const [uploadLabel, setUploadLabel] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Fetch Assets ───────────────────────────────────────────────
    const fetchAssets = useCallback(async () => {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            showToast('Failed to load assets', 'error');
            console.error(error);
        } else {
            setAssets(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    // ─── Toast ──────────────────────────────────────────────────────
    function showToast(message: string, type: 'success' | 'error') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    // ─── Upload Handler ─────────────────────────────────────────────
    async function handleUpload() {
        if (pendingFiles.length === 0) return;
        setUploading(true);

        for (const file of pendingFiles) {
            const ext = file.name.split('.').pop() || 'png';
            const timestamp = Date.now();
            const storagePath = `${uploadTag}/${timestamp}_${file.name}`;

            // 1. Upload to Storage
            const { error: storageError } = await supabase.storage
                .from('content-assets')
                .upload(storagePath, file, { contentType: file.type, upsert: false });

            if (storageError) {
                showToast(`Upload failed: ${storageError.message}`, 'error');
                console.error(storageError);
                continue;
            }

            // 2. Get public URL
            const { data: urlData } = supabase.storage
                .from('content-assets')
                .getPublicUrl(storagePath);

            // 3. Insert into assets table
            const { error: dbError } = await supabase.from('assets').insert({
                app_id: BRIGO_APP_ID,
                storage_url: urlData.publicUrl,
                tag: uploadTag,
                label: uploadLabel || file.name.replace(/\.[^.]+$/, ''),
                use_count: 0,
            });

            if (dbError) {
                showToast(`DB insert failed: ${dbError.message}`, 'error');
                console.error(dbError);
            }
        }

        showToast(`${pendingFiles.length} asset(s) uploaded`, 'success');
        setPendingFiles([]);
        setUploadLabel('');
        setShowUploadModal(false);
        setUploading(false);
        fetchAssets();
    }

    // ─── Delete Handler ─────────────────────────────────────────────
    async function handleDelete(asset: Asset) {
        setDeleting(asset.id);

        // Extract storage path from the full URL
        const url = new URL(asset.storage_url);
        const pathParts = url.pathname.split('/storage/v1/object/public/content-assets/');
        const storagePath = pathParts[1] ? decodeURIComponent(pathParts[1]) : null;

        // 1. Delete from Storage
        if (storagePath) {
            const { error: storageError } = await supabase.storage
                .from('content-assets')
                .remove([storagePath]);

            if (storageError) {
                showToast(`Storage delete failed: ${storageError.message}`, 'error');
                setDeleting(null);
                return;
            }
        }

        // 2. Delete from DB
        const { error: dbError } = await supabase
            .from('assets')
            .delete()
            .eq('id', asset.id);

        if (dbError) {
            showToast(`DB delete failed: ${dbError.message}`, 'error');
        } else {
            showToast('Asset deleted', 'success');
            setAssets((prev) => prev.filter((a) => a.id !== asset.id));
        }

        setDeleting(null);
    }

    // ─── Drag & Drop ───────────────────────────────────────────────
    function onDragOver(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(true);
    }

    function onDragLeave(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
    }

    function onDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files).filter((f) =>
            f.type.startsWith('image/')
        );
        if (files.length > 0) {
            setPendingFiles(files);
            setShowUploadModal(true);
        }
    }

    function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []).filter((f) =>
            f.type.startsWith('image/')
        );
        if (files.length > 0) {
            setPendingFiles(files);
            setShowUploadModal(true);
        }
        // Reset input so re-selecting the same file works
        e.target.value = '';
    }

    // ─── Filtered & Grouped ─────────────────────────────────────────
    const filtered =
        filterTag === 'all'
            ? assets
            : assets.filter((a) => a.tag === filterTag);

    const grouped = ALL_TAGS.reduce<Record<string, Asset[]>>((acc, tag) => {
        const tagAssets = filtered.filter((a) => a.tag === tag);
        if (tagAssets.length > 0) acc[tag] = tagAssets;
        return acc;
    }, {});

    // ─── Render ─────────────────────────────────────────────────────
    return (
        <div className="space-y-12">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl md:text-6xl mb-2">Asset Library</h2>
                    <p className="text-engine-orange font-mono text-sm tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-engine-orange rounded-full" />
                        {assets.length} ASSETS // {Object.keys(grouped).length} CATEGORIES
                    </p>
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-engine flex items-center gap-4"
                >
                    <Upload size={24} />
                    <span>Upload Assets</span>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onFileSelect}
                />
            </header>

            {/* Tag Filters */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilterTag('all')}
                    className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all ${filterTag === 'all'
                        ? 'bg-engine-orange text-black border-engine-orange'
                        : 'bg-transparent text-white/60 border-white/10 hover:border-engine-orange hover:text-engine-orange'
                        }`}
                >
                    All ({assets.length})
                </button>
                {ALL_TAGS.map((tag) => {
                    const count = assets.filter((a) => a.tag === tag).length;
                    return (
                        <button
                            key={tag}
                            onClick={() => setFilterTag(tag)}
                            className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-all ${filterTag === tag
                                ? 'bg-engine-orange text-black border-engine-orange'
                                : 'bg-transparent text-white/60 border-white/10 hover:border-engine-orange hover:text-engine-orange'
                                }`}
                        >
                            {TAG_LABELS[tag]} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed cursor-pointer transition-all duration-200 p-12 flex flex-col items-center justify-center gap-4 ${dragOver
                    ? 'border-engine-orange bg-engine-orange/10'
                    : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                    }`}
            >
                <Upload
                    size={32}
                    className={`transition-colors ${dragOver ? 'text-engine-orange' : 'text-white/30'
                        }`}
                />
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                    {dragOver
                        ? 'Drop files here'
                        : 'Drag & drop images here, or click to browse'}
                </p>
            </div>

            {/* Asset Grid (grouped by tag) */}
            {loading ? (
                <div className="space-y-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-4">
                            <div className="h-6 w-40 bg-white/5 animate-pulse" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[1, 2, 3].map((j) => (
                                    <div
                                        key={j}
                                        className="aspect-[4/5] bg-white/5 animate-pulse rounded-sm"
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : Object.keys(grouped).length === 0 ? (
                <div className="text-center py-20">
                    <ImageIcon size={48} className="mx-auto text-white/10 mb-4" />
                    <h3 className="text-2xl mb-2">No Assets Yet</h3>
                    <p className="text-white/40 font-mono text-sm">
                        Upload your first screenshots to get started
                    </p>
                </div>
            ) : filterTag === 'all' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {assets.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} deleting={deleting} />
                    ))}
                </div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(grouped).map(([tag, tagAssets]) => (
                        <section key={tag}>
                            {/* Section Header */}
                            <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-6">
                                <div className="w-1 h-6 bg-engine-orange" />
                                <h3 className="text-2xl font-display uppercase tracking-tight">
                                    {TAG_LABELS[tag as AssetTag] || tag}
                                </h3>
                                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest bg-white/5 px-2 py-0.5 border border-white/5">
                                    {tagAssets.length} asset{tagAssets.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Asset Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {tagAssets.map((asset) => (
                                    <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} deleting={deleting} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-lg mx-4 bg-engine-black border border-white/10 p-8 space-y-6">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl">Upload Assets</h3>
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setPendingFiles([]);
                                }}
                                className="p-2 hover:bg-white/5 transition-colors"
                            >
                                <X size={20} className="text-white/40" />
                            </button>
                        </div>

                        {/* File List */}
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {pendingFiles.map((file, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/5"
                                >
                                    <ImageIcon size={16} className="text-engine-orange shrink-0" />
                                    <span className="text-xs font-mono truncate flex-1">
                                        {file.name}
                                    </span>
                                    <span className="text-[9px] font-mono text-white/40 shrink-0">
                                        {(file.size / 1024).toFixed(0)} KB
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Tag Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
                                Tag
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {ALL_TAGS.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => setUploadTag(tag)}
                                        className={`px-3 py-2 text-[9px] font-mono uppercase tracking-wider border transition-all ${uploadTag === tag
                                            ? 'bg-engine-orange text-black border-engine-orange'
                                            : 'bg-transparent text-white/60 border-white/10 hover:border-engine-orange'
                                            }`}
                                    >
                                        {TAG_LABELS[tag]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Label Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
                                Label (optional)
                            </label>
                            <input
                                type="text"
                                value={uploadLabel}
                                onChange={(e) => setUploadLabel(e.target.value)}
                                placeholder="e.g. Onboarding Screen 1"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-sm font-mono placeholder:text-white/20 focus:border-engine-orange focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setPendingFiles([]);
                                }}
                                className="flex-1 px-4 py-3 border border-white/10 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="flex-1 btn-engine flex items-center justify-center gap-2 !py-3"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black animate-spin rounded-full" />
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        <span>
                                            Upload {pendingFiles.length} File
                                            {pendingFiles.length !== 1 ? 's' : ''}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 border text-sm font-mono transition-all animate-in ${toast.type === 'success'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                >
                    {toast.type === 'success' ? (
                        <Check size={16} />
                    ) : (
                        <AlertTriangle size={16} />
                    )}
                    {toast.message}
                </div>
            )}
        </div>
    );
}
