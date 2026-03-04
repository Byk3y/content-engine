import { Plus, Info, ArrowUpRight, Clock, Eye, Share2 } from 'lucide-react';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function getDashboardData() {
  // Run all queries in parallel
  const [viewsResult, postsCountResult, recentPostsResult, assetsResult] = await Promise.all([
    // Total views
    supabaseServer.from('posts').select('views'),
    // Posts sent count
    supabaseServer.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
    // Recent 5 posts
    supabaseServer.from('posts').select('id, hook_text, status, created_at, views, postiz_post_id').order('created_at', { ascending: false }).limit(5),
    // All assets for utilization
    supabaseServer.from('assets').select('tag, use_count'),
  ]);

  // Calculate total views
  const totalViews = (viewsResult.data || []).reduce((sum: number, row: any) => sum + (row.views || 0), 0);

  // Posts sent count
  const postsSent = postsCountResult.count || 0;

  // Asset utilization
  const assets = assetsResult.data || [];
  const totalAssets = assets.length;
  const usedAssets = assets.filter((a: any) => (a.use_count || 0) > 0).length;
  const assetUtilization = totalAssets > 0 ? Math.round((usedAssets / totalAssets) * 100) : 0;

  // Recent posts
  const recentPosts = (recentPostsResult.data || []).map((post: any) => ({
    id: post.id,
    title: post.hook_text || 'Untitled Post',
    status: post.status || 'unknown',
    created_at: post.created_at,
    views: post.views || 0,
    postiz_post_id: post.postiz_post_id,
  }));

  // Asset insight — find most used tag
  const tagUsage: Record<string, number> = {};
  assets.forEach((a: any) => {
    const tag = a.tag || 'unknown';
    tagUsage[tag] = (tagUsage[tag] || 0) + (a.use_count || 0);
  });
  const topTag = Object.entries(tagUsage).sort(([, a], [, b]) => (b as number) - (a as number))[0];
  let assetInsight = '';
  if (topTag && (topTag[1] as number) > 0) {
    const tagLabel = (topTag[0] as string).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    assetInsight = `Your "${tagLabel}" assets are the most used with ${topTag[1]} total uses across posts.`;
  } else if (postsSent > 0 && totalAssets > 0) {
    assetInsight = `${postsSent} post${postsSent === 1 ? '' : 's'} sent with ${totalAssets} assets available. Asset usage tracking will appear as you create more posts.`;
  } else if (postsSent > 0 && totalAssets === 0) {
    assetInsight = `${postsSent} post${postsSent === 1 ? '' : 's'} sent. Upload assets to the library to use them in future posts.`;
  } else if (totalAssets > 0 && postsSent === 0) {
    assetInsight = `You have ${totalAssets} assets uploaded. Create your first post to start using them.`;
  } else {
    assetInsight = 'No posts yet — create your first post to see insights.';
  }

  return { totalViews, postsSent, assetUtilization, recentPosts, assetInsight };
}

export default async function Dashboard() {
  const { totalViews, postsSent, assetUtilization, recentPosts, assetInsight } = await getDashboardData();

  const stats = [
    { label: 'Live Views', value: formatNumber(totalViews), icon: Eye },
    { label: 'Posts Sent', value: String(postsSent), icon: Share2 },
    { label: 'Asset Utilization', value: `${assetUtilization}%`, growth: assetUtilization > 70 ? 'Optimal' : assetUtilization > 0 ? 'Active' : '—', icon: Info },
  ];

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl md:text-6xl mb-2">Dashboard</h2>
          <p className="text-engine-orange font-mono text-sm tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-engine-orange animate-ping rounded-full" />
            SYSTEM OPERATIONAL // LOGGED AS ADMINISTRATOR
          </p>
        </div>

        <Link href="/create" className="btn-engine flex items-center gap-4">
          <Plus size={24} />
          <span>New Post</span>
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="engine-card">
            <div className="flex justify-between items-start mb-4">
              <stat.icon size={20} className="text-engine-orange" />
              {stat.growth && (
                <span className="text-[10px] font-mono bg-engine-orange/10 text-engine-orange px-2 py-1">
                  {stat.growth}
                </span>
              )}
            </div>
            <div className="text-4xl font-display uppercase tracking-widest">{stat.value}</div>
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Recent Activity & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Posts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-2xl">Recent Posts</h3>
            <Link href="/results" className="text-[10px] font-mono text-engine-orange hover:underline uppercase">View All Logs</Link>
          </div>

          <div className="space-y-4">
            {recentPosts.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10">
                <p className="text-white/40 font-mono text-sm uppercase tracking-widest">No posts yet</p>
                <Link href="/create" className="text-engine-orange font-mono text-xs mt-2 hover:underline uppercase inline-block">
                  Create your first post →
                </Link>
              </div>
            ) : (
              recentPosts.map((post: any, i: number) => (
                <div key={post.id} className="flex items-center justify-between p-4 group hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-engine-gray/50 flex items-center justify-center font-display text-xl border border-white/10 group-hover:border-engine-orange transition-colors">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-xl group-hover:text-engine-orange transition-colors">{post.title}</h4>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">
                        <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(post.created_at)}</span>
                        <span className={`flex items-center gap-1 ${post.status === 'sent' ? 'text-green-500' : 'text-engine-orange'}`}>
                          <div className={`w-1 h-1 rounded-full ${post.status === 'sent' ? 'bg-green-500' : 'bg-engine-orange'}`} />
                          {post.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xl font-display">{formatNumber(post.views)}</div>
                      <div className="text-[10px] font-mono text-white/40 uppercase">Views</div>
                    </div>
                    {post.postiz_post_id && post.postiz_post_id !== 'unknown' ? (
                      <a
                        href={`https://app.postiz.com/p/${post.postiz_post_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-white/10 hover:bg-engine-orange hover:text-black transition-all"
                      >
                        <ArrowUpRight size={18} />
                      </a>
                    ) : (
                      <div className="p-2 border border-white/5 text-white/20">
                        <ArrowUpRight size={18} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Asset Insights */}
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-2xl">Asset Insights</h3>
          </div>
          <div className="engine-card bg-gradient-to-br from-engine-orange/20 to-transparent border-white/10">
            <p className="text-sm border-l-2 border-engine-orange pl-4 mb-6">
              {assetInsight}
            </p>
            <Link href="/library" className="text-[10px] font-mono uppercase bg-white/5 hover:bg-white/10 px-4 py-2 block text-center border border-white/5 transition-all">
              Update Asset Library
            </Link>
          </div>

          <div className="p-6 border border-dashed border-white/10 space-y-4">
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Total Assets</p>
            <div className="text-3xl font-display">{assetUtilization}% Used</div>
            <div className="w-full h-1 bg-white/5">
              <div
                className="h-full bg-engine-orange shadow-[0_0_10px_rgba(240,140,0,0.3)]"
                style={{ width: `${assetUtilization}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
