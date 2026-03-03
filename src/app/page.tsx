import { Plus, Play, Info, ArrowUpRight, Clock, Eye, Share2 } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const stats = [
    { label: 'Live Views', value: '14.2K', growth: '+12%', icon: Eye },
    { label: 'Posts Sent', value: '28', growth: '+4', icon: Share2 },
    { label: 'Asset Utilization', value: '82%', growth: 'Optimal', icon: Info },
  ];

  const recentPosts = [
    { title: 'Skeptic Angle: Resits Hack', date: '2h ago', status: 'Published', views: '1.2K' },
    { title: 'Pet Stage 1: The Guilt Trip', date: '1d ago', status: 'Sent', views: '8.4K' },
    { title: 'Feature: Notes to Podcast', date: '2d ago', status: 'Published', views: '4.6K' },
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
              <span className="text-[10px] font-mono bg-engine-orange/10 text-engine-orange px-2 py-1">
                {stat.growth}
              </span>
            </div>
            <div className="text-4xl font-display uppercase tracking-widest">{stat.value}</div>
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Recent Activity & Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Posts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-2xl">Recent Posts</h3>
            <button className="text-[10px] font-mono text-engine-orange hover:underline uppercase">View All Logs</button>
          </div>

          <div className="space-y-4">
            {recentPosts.map((post, i) => (
              <div key={i} className="flex items-center justify-between p-4 group hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-engine-gray/50 flex items-center justify-center font-display text-xl border border-white/10 group-hover:border-engine-orange transition-colors">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="text-xl group-hover:text-engine-orange transition-colors">{post.title}</h4>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">
                      <span className="flex items-center gap-1"><Clock size={10} /> {post.date}</span>
                      <span className="flex items-center gap-1 text-green-500"><div className="w-1 h-1 bg-green-500 rounded-full" /> {post.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xl font-display">{post.views}</div>
                    <div className="text-[10px] font-mono text-white/40 uppercase">Views</div>
                  </div>
                  <button className="p-2 border border-white/10 hover:bg-engine-orange hover:text-black transition-all">
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Queue / CTA */}
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-2xl">Asset Insights</h3>
          </div>
          <div className="engine-card bg-gradient-to-br from-engine-orange/20 to-transparent border-white/10">
            <p className="text-sm border-l-2 border-engine-orange pl-4 mb-6">
              Your "Pet Evolution" asset series is performing 40% better than static screenshots.
            </p>
            <Link href="/library" className="text-[10px] font-mono uppercase bg-white/5 hover:bg-white/10 px-4 py-2 block text-center border border-white/5 transition-all">
              Update Asset Library
            </Link>
          </div>

          <div className="p-6 border border-dashed border-white/10 space-y-4">
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Next Scheduled Sync</p>
            <div className="text-3xl font-display">T - 04:12:00</div>
            <div className="w-full h-1 bg-white/5">
              <div className="h-full bg-engine-yellow w-1/3 shadow-[0_0_10px_rgba(240,240,0,0.3)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
