import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { buildEmbedUrl } from '../utils/parseLinkedin.js';

const COLORS = ['#FF6347', '#0A66C2', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'];

const colorFor = (id) => {
  if (!id) return COLORS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
};

export default function PostCard({ post, theme, displayMode, onDelete }) {
  const accentColor = post.color || colorFor(post.id);
  const embedUrl = buildEmbedUrl(post.activity_id);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(post.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0, rotateZ: -3 }}
      animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className={`relative overflow-hidden rounded-2xl border-l-[5px] flex flex-col h-full ${
        post.isNew ? 'animate-pulse-glow' : ''
      }`}
      style={{
        backgroundColor: theme.card,
        color: theme.cardText,
        borderLeftColor: accentColor,
        boxShadow: post.isNew
          ? `0 0 0 3px ${accentColor}66, 0 8px 24px rgba(0,0,0,0.18)`
          : '0 4px 16px rgba(0,0,0,0.10)',
      }}
    >
      {!displayMode && onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 left-2 z-20 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition shadow"
          aria-label="Delete post"
        >
          <Trash2 size={12} />
        </button>
      )}

      {post.isNew && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-black bg-vibe-orange text-white"
        >
          NEW
        </motion.div>
      )}

      {embedUrl ? (
        <iframe
          src={embedUrl}
          title="LinkedIn post"
          className="w-full h-full border-0 rounded-2xl"
          allowFullScreen
        />
      ) : (
        <div className="flex-1 p-4 overflow-hidden">
          <p className="text-sm font-semibold whitespace-pre-wrap break-words" style={{ color: theme.cardText }}>
            {post.composed_text || post.name || ''}
          </p>
        </div>
      )}
    </motion.div>
  );
}
