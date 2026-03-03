'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Cpu, BookOpen, BarChart2, Drill, Terminal } from 'lucide-react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', icon: LayoutGrid, href: '/' },
    { name: 'Create Post', icon: Drill, href: '/create' },
    { name: 'Asset Library', icon: BookOpen, href: '/library' },
    { name: 'Results', icon: BarChart2, href: '/performance' },
    { name: 'Logs', icon: Terminal, href: '/settings' },
  ];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <title>BRIGO | TikTok Engine</title>
      </head>
      <body className="antialiased min-h-screen bg-grid">
        <div className="flex bg-black/20">
          {/* Industrial Sidebar */}
          <aside className="w-72 bg-engine-black border-r border-white/5 h-screen sticky top-0 hidden lg:flex flex-col z-50">
            <div className="p-8 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-engine-orange flex items-center justify-center font-display text-2xl text-black">BR</div>
                <div>
                  <h1 className="text-2xl leading-none font-display">Brigo</h1>
                  <p className="text-[10px] font-mono text-engine-orange tracking-[0.2em] font-bold">TIKTOK ENGINE</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 py-10 px-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 px-6 py-4 rounded-none border-l-2 transition-all group ${isActive
                        ? 'border-engine-orange bg-white/5'
                        : 'border-transparent hover:border-engine-orange hover:bg-white/5'
                      }`}
                  >
                    <item.icon
                      size={18}
                      className={isActive ? 'text-engine-orange' : 'text-white/40 group-hover:text-engine-orange transition-colors'}
                    />
                    <span className={`font-display text-xl tracking-wider uppercase transition-all ${isActive ? 'opacity-100 text-engine-orange' : 'opacity-60 group-hover:opacity-100 text-white'
                      }`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* System Status */}
            <div className="p-8 border-t border-white/5">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-white/40 uppercase">System Status</span>
                    <span className="text-engine-orange">57%</span>
                  </div>
                  <div className="h-1 bg-white/5 w-full">
                    <div className="h-full bg-engine-orange glow-orange transition-all duration-1000" style={{ width: '57%' }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">TikTok Connected</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 p-6 lg:p-16 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
