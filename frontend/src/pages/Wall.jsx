import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import PostCard from '../components/PostCard.jsx';
import PaperPlane from '../components/PaperPlane.jsx';
import ParticleCanvas from '../components/ParticleCanvas.jsx';
import HostPanel from '../components/HostPanel.jsx';
import { useWallPosts } from '../hooks/useWallPosts.js';
import { THEMES, DEFAULT_THEME_KEY } from '../themes/themes.js';
import { apiDelete } from '../utils/api.js';

const SPONSORS = [
  'Emergent', 'Y Combinator', 'OpenAI', 'MongoDB', 'AWS', 'Razorpay',
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

function ThemeSwitcher({ themeKey, setThemeKey, theme }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed top-4 right-4 z-40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur shadow flex items-center gap-1.5"
        style={{ backgroundColor: theme.card, color: theme.cardText }}
      >
        {theme.name} <ChevronDown size={12} />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-44 rounded-xl shadow-2xl overflow-hidden border"
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
        >
          {Object.entries(THEMES).map(([k, t]) => (
            <button
              key={k}
              onClick={() => { setThemeKey(k); setOpen(false); }}
              className={`block w-full text-left px-4 py-2 text-xs font-bold ${k === themeKey ? 'bg-black/10' : 'hover:bg-black/5'}`}
              style={{ color: theme.cardText }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Wall() {
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() =>
    localStorage.getItem('vibecon_theme') || DEFAULT_THEME_KEY
  );
  const theme = THEMES[themeKey] || THEMES[DEFAULT_THEME_KEY];

  useEffect(() => {
    localStorage.setItem('vibecon_theme', themeKey);
  }, [themeKey]);

  const [displayMode, setDisplayMode] = useState(false);
  const { posts, postCount, setPostCount, planeTrigger, removePost } = useWallPosts();

  // ESC exits display mode
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setDisplayMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onDelete = useCallback(
    async (postId) => {
      const token = localStorage.getItem('vibecon_admin_token');
      removePost(postId);
      try {
        await apiDelete(`/api/posts/${postId}`, token);
      } catch {}
    },
    [removePost]
  );

  const onLogout = () => {
    localStorage.removeItem('vibecon_admin_token');
    navigate('/login');
  };

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
      <AnimatePresence>
        {!displayMode && (
          <motion.header
            initial={{ y: 0 }}
            exit={{ y: -64 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="relative z-30 h-14 px-6 flex items-center justify-between border-b"
            style={{ backgroundColor: theme.header, color: theme.headerText, borderColor: theme.cardBorder }}
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-vibe-orange flex items-center justify-center text-white font-black">V</div>
              <div className="leading-tight">
                <p className="font-black text-sm">VibeCon 2026</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Live Social Wall</p>
              </div>
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
              <span className="opacity-60">Emergent × YC</span>
              <span className="px-2 py-0.5 rounded-full bg-vibe-orange text-white">16 APR 2026</span>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Grid */}
      <motion.main
        layout
        className="relative z-10 flex-1 grid grid-cols-4 grid-rows-2 gap-4 p-4 min-h-0"
        style={{ height: displayMode ? 'calc(100vh - 48px)' : 'calc(100vh - 56px - 48px)' }}
      >
        <AnimatePresence>
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              theme={theme}
              displayMode={displayMode}
              onDelete={displayMode ? null : onDelete}
            />
          ))}
        </AnimatePresence>
      </motion.main>

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

      {!displayMode && (
        <ThemeSwitcher themeKey={themeKey} setThemeKey={setThemeKey} theme={theme} />
      )}

      {!displayMode && (
        <HostPanel
          onDisplayMode={() => setDisplayMode(true)}
          onLogout={onLogout}
          postCount={postCount}
          setPostCount={setPostCount}
        />
      )}

      {displayMode && (
        <button
          onClick={() => setDisplayMode(false)}
          className="fixed bottom-16 right-4 z-50 px-3 py-1 rounded-full bg-black/70 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur"
        >
          ESC
        </button>
      )}
    </div>
  );
}
