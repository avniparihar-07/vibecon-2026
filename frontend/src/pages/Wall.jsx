import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from '../components/PostCard.jsx';
import PaperPlane from '../components/PaperPlane.jsx';
import ParticleCanvas from '../components/ParticleCanvas.jsx';
import { useWallPosts } from '../hooks/useWallPosts.js';
import { THEMES, DEFAULT_THEME_KEY } from '../themes/themes.js';
import vibeconLogo from '../assets/vibecon-logo.svg';

const SPONSORS = [
  'Emergent', 'Polaris School of Technology', 'OpenAI', 'MongoDB', 'AWS', 'Razorpay',
  'Stripe', 'Anthropic', 'Wispr Flow', 'Linear', 'Vercel', 'Supabase',
];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{now.toTimeString().slice(0, 8)}</span>;
}

export default function Wall() {
  const [themeKey] = useState(() =>
    localStorage.getItem('vibecon_theme') || DEFAULT_THEME_KEY
  );
  const theme = THEMES[themeKey] || THEMES[DEFAULT_THEME_KEY];

  const { posts, postCount, planeTrigger } = useWallPosts();
  const visiblePosts = useMemo(() => posts.slice(0, 8), [posts]);

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col relative"
      style={{ backgroundColor: theme.bg, backgroundImage: theme.bgGradient }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${theme.grid} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <ParticleCanvas color={theme.particle} />

      {/* Header bar */}
      <header
        className="relative z-30 h-14 px-6 flex items-center justify-between border-b"
        style={{ backgroundColor: theme.header, color: theme.headerText, borderColor: theme.cardBorder }}
      >
        <div className="flex items-center gap-3">
          <img src={vibeconLogo} alt="VibeCon" className="h-7" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: theme.live }}
            />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.live }}>
              LIVE
            </span>
          </div>
          <span className="text-xs font-bold opacity-70">{postCount} posts</span>
          <span className="text-xs font-bold opacity-70">300 BUILDERS</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-bold">
          <Clock />
          <span className="opacity-60">Emergent x Polaris</span>
          <span className="px-2 py-0.5 rounded-full bg-vibe-orange text-white">16 APR 2026</span>
        </div>
      </header>

      {/* Grid */}
      <main className="relative z-10 flex-1 grid grid-cols-4 auto-rows-fr gap-3 p-3 min-h-0 overflow-y-auto">
        <AnimatePresence>
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              theme={theme}
              displayMode={false}
              onDelete={null}
            />
          ))}
        </AnimatePresence>
      </main>

      {/* Sponsor ticker */}
      <div
        className="relative z-20 h-12 flex items-center overflow-hidden border-t"
        style={{ backgroundColor: theme.ticker, color: theme.tickerText, borderColor: theme.cardBorder }}
      >
        <div className="px-4 py-1 mr-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 flex items-center gap-1 shrink-0">
          ★ Sponsors
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...SPONSORS, ...SPONSORS].map((s, i) => (
              <span key={i} className="px-6 text-xs font-black uppercase tracking-widest">
                {s} ·
              </span>
            ))}
          </div>
        </div>
      </div>

      <PaperPlane trigger={planeTrigger} />
    </div>
  );
}
