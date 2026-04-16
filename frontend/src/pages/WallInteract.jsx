import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ExternalLink, ArrowLeft } from 'lucide-react';
import { buildEmbedUrl } from '../utils/parseLinkedin.js';

export default function WallInteract() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vibecon_submitted_post');
      if (raw) setSubmitted(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      navigate('/guide');
      return;
    }
    const id = setTimeout(() => setSecondsLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, navigate]);

  return (
    <div className="min-h-full bg-[#FFF8F1] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-200 opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-200 opacity-50 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="mx-auto h-16 w-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg"
        >
          <Check size={32} strokeWidth={3} />
        </motion.div>

        <h1 className="mt-5 text-3xl font-black tracking-tight">
          You're on the wall! 🎉
        </h1>
        <p className="mt-2 text-sm font-semibold text-gray-600">
          Thanks for sharing, {submitted?.name || 'builder'}. Your post will animate in within seconds.
        </p>

        {submitted?.activity_id && (
          <div className="mt-5 rounded-xl overflow-hidden border border-gray-200">
            <iframe
              src={buildEmbedUrl(submitted.activity_id)}
              title="Your LinkedIn post"
              className="w-full h-72"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        )}

        <p className="mt-6 text-xs font-black uppercase tracking-widest text-gray-500">
          Going live in {secondsLeft}s…
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {submitted?.linkedin_url && (
            <a
              href={submitted.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-linkedin-blue hover:underline"
            >
              View on LinkedIn <ExternalLink size={12} />
            </a>
          )}
          <Link
            to="/guide"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={12} /> Back to guide
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
