'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, Save, Check, Clock, TrendingUp, AlertTriangle, BarChart2 } from 'lucide-react';

interface Post {
    id: string;
    hook_text: string;
    status: string;
    views: number;
    created_at: string;
    caption: string;
    postiz_post_id: string | null;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

function formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
}

export default function ResultsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [savingId, setSavingId] = useState<string | null>(null);
    const [savedId, setSavedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        const { data, error: fetchError } = await supabase
            .from('posts')
            .select('id, hook_text, status, views, created_at, caption, postiz_post_id')
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('Failed to fetch posts:', fetchError.message);
            setError(fetchError.message);
        } else {
            setPosts(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleSaveViews = async (postId: string) => {
        const newViews = parseInt(editValue, 10);
        if (isNaN(newViews) || newViews < 0) return;

        setSavingId(postId);
        try {
            const response = await fetch('/api/update-views', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: postId, views: newViews }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Update failed');
            }

            // Update locally without reload
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, views: newViews } : p
            ));
            setEditingId(null);
            setSavedId(postId);
            setTimeout(() => setSavedId(null), 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSavingId(null);
        }
    };

    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalPosts = posts.length;
    const avgViews = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;

    return (
        <div className="space-y-12">
            {/* Header */}
            <header>
                <h2 className="text-4xl md:text-6xl mb-2">Results</h2>
                <p className="text-engine-orange font-mono text-sm tracking-widest flex items-center gap-2">
                    <BarChart2 size={14} />
                    MANUAL VIEW TRACKING // CLICK TO EDIT VIEWS
                </p>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="engine-card">
                    <div className="flex justify-between items-start mb-4">
                        <Eye size={20} className="text-engine-orange" />
                    </div>
                    <div className="text-4xl font-display uppercase tracking-widest">{formatNumber(totalViews)}</div>
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">Total Views</div>
                </div>
                <div className="engine-card">
                    <div className="flex justify-between items-start mb-4">
                        <TrendingUp size={20} className="text-engine-orange" />
                    </div>
                    <div className="text-4xl font-display uppercase tracking-widest">{totalPosts}</div>
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">Posts Sent</div>
                </div>
                <div className="engine-card">
                    <div className="flex justify-between items-start mb-4">
                        <BarChart2 size={20} className="text-engine-orange" />
                    </div>
                    <div className="text-4xl font-display uppercase tracking-widest">{formatNumber(avgViews)}</div>
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">Avg Views / Post</div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 border border-red-500/30 bg-red-500/10 flex items-center gap-3">
                    <AlertTriangle size={16} className="text-red-400" />
                    <span className="text-red-400 font-mono text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400 text-xs font-mono">DISMISS</button>
                </div>
            )}

            {/* Posts Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-2xl">All Posts</h3>
                    <button
                        onClick={fetchPosts}
                        className="text-[10px] font-mono text-engine-orange hover:underline uppercase tracking-widest"
                    >
                        Refresh
                    </button>
                </div>

                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Hook</div>
                    <div className="col-span-2">Sent</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-3 text-right">Views</div>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="engine-card animate-pulse">
                                <div className="flex items-center gap-6">
                                    <div className="w-10 h-10 bg-white/5 rounded" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-white/5 rounded" />
                                        <div className="h-3 w-1/3 bg-white/5 rounded" />
                                    </div>
                                    <div className="h-8 w-24 bg-white/5 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-white/10">
                        <BarChart2 size={32} className="text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 font-mono text-sm uppercase tracking-widest">No posts yet</p>
                        <p className="text-white/20 font-mono text-xs mt-2">Send your first post to start tracking results</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {posts.map((post, i) => (
                            <div
                                key={post.id}
                                className="group grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all"
                            >
                                {/* Number */}
                                <div className="col-span-1 hidden md:block">
                                    <div className="w-10 h-10 bg-engine-gray/50 flex items-center justify-center font-display text-lg border border-white/10 group-hover:border-engine-orange/50 transition-colors">
                                        {i + 1}
                                    </div>
                                </div>

                                {/* Hook Text */}
                                <div className="col-span-5">
                                    <h4 className="text-sm font-medium group-hover:text-engine-orange transition-colors line-clamp-2">
                                        {post.hook_text || 'Untitled Post'}
                                    </h4>
                                    <p className="text-[10px] font-mono text-white/20 mt-1 line-clamp-1">
                                        {post.caption?.substring(0, 80)}...
                                    </p>
                                </div>

                                {/* Date */}
                                <div className="col-span-2">
                                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1">
                                        <Clock size={10} />
                                        {timeAgo(post.created_at)}
                                    </span>
                                </div>

                                {/* Status */}
                                <div className="col-span-1">
                                    <span className={`text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 ${post.status === 'sent' ? 'text-green-500' : 'text-engine-orange'
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${post.status === 'sent' ? 'bg-green-500' : 'bg-engine-orange'
                                            }`} />
                                        {post.status}
                                    </span>
                                </div>

                                {/* Views — Inline Editable */}
                                <div className="col-span-3 flex items-center gap-2 justify-end">
                                    {editingId === post.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveViews(post.id);
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                                autoFocus
                                                className="w-28 px-3 py-1.5 bg-white/5 border border-engine-orange/50 text-sm font-mono text-right focus:outline-none focus:border-engine-orange"
                                            />
                                            <button
                                                onClick={() => handleSaveViews(post.id)}
                                                disabled={savingId === post.id}
                                                className="p-1.5 bg-engine-orange/20 border border-engine-orange/40 hover:bg-engine-orange hover:text-black transition-all disabled:opacity-50"
                                            >
                                                <Save size={14} />
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="p-1.5 border border-white/10 hover:border-white/30 transition-all text-white/40 hover:text-white"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingId(post.id);
                                                setEditValue(String(post.views || 0));
                                            }}
                                            className="flex items-center gap-3 group/views"
                                        >
                                            <div className="text-right">
                                                <div className="text-xl font-display group-hover/views:text-engine-orange transition-colors">
                                                    {formatNumber(post.views || 0)}
                                                </div>
                                                <div className="text-[9px] font-mono text-white/20 uppercase">views</div>
                                            </div>
                                            {savedId === post.id ? (
                                                <div className="p-1.5 border border-green-500/30 text-green-500">
                                                    <Check size={14} />
                                                </div>
                                            ) : (
                                                <div className="p-1.5 border border-white/10 text-white/20 group-hover/views:border-engine-orange/40 group-hover/views:text-engine-orange transition-all">
                                                    <Eye size={14} />
                                                </div>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 pt-6">
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest text-center">
                    Click any views count to update it manually from TikTok • Data persists in Supabase
                </p>
            </div>
        </div>
    );
}
