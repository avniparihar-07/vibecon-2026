import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Users } from 'lucide-react';
import vibeconLogo from '../assets/vibecon-logo.svg';

const SPONSORS = ['Emergent', 'Polaris School of Technology', 'OpenAI', 'MongoDB', 'Stripe', 'AWS'];

const fakeCards = [
  { name: 'Aanya', text: 'Day 1 at #vibecon2026 ⚡', color: '#FF6347' },
  { name: 'Marcus', text: '300 builders. One room.', color: '#0A66C2' },
  { name: 'Priya', text: 'Shipped a clinical tool in 90m', color: '#8B5CF6' },
  { name: 'Diego', text: 'The wall is glowing 🔥', color: '#10B981' },
];

export default function Landing() {
  return (
    <div className="min-h-full bg-[#FFF8F1] dot-grid relative overflow-hidden">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-orange-200 opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-200 opacity-40 blur-3xl" />

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <img src={vibeconLogo} alt="VibeCon" className="h-8" />
        </div>
        <Link
          to="/login"
          className="text-xs font-bold text-gray-600 hover:text-vibe-orange transition"
        >
          Host Login
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-8 py-12 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm text-xs font-bold mb-6">
            <Sparkles size={14} className="text-vibe-orange" />
            April 16, 2026 · Emergent x Polaris · LIVE Wall
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight">
            300 builders.
            <br />
            One room.
            <br />
            <span className="text-vibe-orange">One wall.</span>
          </h1>

          <p className="mt-6 text-lg font-semibold text-gray-700 max-w-md">
            Share your VibeCon moment on LinkedIn and watch it land on the wall in front
            of the room — live, in real time.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/guide"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-vibe-orange text-white font-black shadow-lg shadow-orange-200 hover:scale-[1.03] transition"
            >
              Join the Live Wall <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-6 text-sm font-bold text-gray-600">
            <div className="flex items-center gap-1.5">
              <Users size={16} />
              300 Builders
            </div>
            <div>·</div>
            <div>April 16, 2026</div>
            <div>·</div>
            <div>LIVE Wall</div>
          </div>
        </motion.div>

        {/* Browser mockup with mini grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotateZ: 1 }}
          animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.15 }}
          className="relative"
        >
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 border-b">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-[10px] font-bold text-gray-500">vibecon.com/wall</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 bg-[#FFF8F1]">
              {fakeCards.map((c, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg p-2 border-l-[3px] shadow-sm"
                  style={{ borderLeftColor: c.color }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-5 w-5 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.name[0]}
                    </div>
                    <span className="text-[10px] font-black truncate">{c.name}</span>
                  </div>
                  <p className="text-[9px] mt-1 text-gray-700 font-semibold line-clamp-2">{c.text}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-black shadow-lg"
          >
            🎉 LIVE
          </motion.div>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 3.5 }}
            className="absolute -bottom-3 -left-3 px-3 py-1 rounded-full bg-vibe-orange text-white text-xs font-black shadow-lg"
          >
            300 builders
          </motion.div>
        </motion.div>
      </main>

      {/* Sponsor bar */}
      <footer className="relative z-10 mt-12 border-t border-gray-200 bg-white/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-8 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-black text-gray-600 uppercase tracking-wider">
          {SPONSORS.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
