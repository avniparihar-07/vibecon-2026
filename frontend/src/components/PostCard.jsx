import { motion } from 'framer-motion';
import { ExternalLink, Heart, Trash2 } from 'lucide-react';
import { useState } from 'react';

const COLORS = ['#FF6347', '#0A66C2', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'];

const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const colorFor = (id) => {
  if (!id) return COLORS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
};

// Lightweight inline highlighter for @mentions and #hashtags. The post text
// from LinkedIn's embed already inlines the mention as plain text — we just
// recolor the tokens for visual punch on the wall.
function highlight(text, theme) {
  if (!text) return null;
  const parts = text.split(/(\s+)/);
  return parts.map((part, i) => {
    if (/^[@#]\w/.test(part)) {
      return (
        <span key={i} style={{ color: theme.accent, fontWeight: 700 }}>
          {part}
        </span>
      );
    }
    return part;
  });
}

const LinkedInBadge = ({ size = 18 }) => (
  <span
    className="inline-flex items-center justify-center rounded-sm font-black text-white"
    style={{
      width: size,
      height: size,
      backgroundColor: '#0A66C2',
      fontSize: Math.round(size * 0.65),
      lineHeight: 1,
    }}
    aria-label="LinkedIn"
  >
    in
  </span>
);

function Avatar({ avatarUrl, name, color }) {
  const [errored, setErrored] = useState(false);
  if (avatarUrl && !errored) {
    return (
      <img
        src={avatarUrl}
        alt={name || ''}
        onError={() => setErrored(true)}
        referrerPolicy="no-referrer"
        className="h-12 w-12 rounded-full object-cover bg-gray-100 ring-2 ring-white shadow-sm"
      />
    );
  }
  return (
    <div
      className="h-12 w-12 rounded-full flex items-center justify-center font-black text-white text-lg ring-2 ring-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      {initialsOf(name)}
    </div>
  );
}

export default function PostCard({ post, theme, displayMode, onDelete }) {
  const meta = post.scraped_meta || {};
  const author = meta.author_name || post.name || 'Anonymous';
  const headline = meta.author_headline || '';
  const text = meta.post_text || post.composed_text || '';
  const image = meta.post_image_url || null;
  const likes = meta.likes;
  const time = meta.posted_relative || 'just now';
  const accentColor = post.color || colorFor(post.id);

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

      <div className="flex items-start gap-3 p-4 pb-2">
        <Avatar avatarUrl={meta.author_avatar_url} name={author} color={accentColor} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-[15px] truncate" style={{ color: theme.cardText }}>
              {author}
            </span>
            <LinkedInBadge size={16} />
          </div>
          {headline && (
            <p className="text-xs font-semibold opacity-70 truncate" style={{ color: theme.cardText }}>
              {headline}
            </p>
          )}
          <p className="text-[10px] font-bold opacity-50 mt-0.5" style={{ color: theme.cardText }}>
            {time}
          </p>
        </div>
      </div>

      <div className="px-4 pb-2 flex-1 overflow-hidden">
        <p
          className="text-[13px] leading-snug font-semibold whitespace-pre-wrap break-words line-clamp-[8]"
          style={{ color: theme.cardText }}
        >
          {highlight(text, { accent: accentColor })}
        </p>
      </div>

      {image && (
        <div className="px-4 pb-2">
          <img
            src={image}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-20 object-cover rounded-md"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <div
        className="flex items-center justify-between px-4 py-2 border-t text-[11px] font-bold"
        style={{ borderColor: theme.cardBorder, color: theme.cardText, opacity: 0.75 }}
      >
        <span className="flex items-center gap-1">
          <Heart size={12} />
          {likes != null ? likes.toLocaleString() : '—'}
        </span>
        {post.linkedin_url && post.linkedin_url !== '#' ? (
          <a
            href={post.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline"
          >
            View <ExternalLink size={11} />
          </a>
        ) : (
          <span className="opacity-60">#vibecon2026</span>
        )}
      </div>
    </motion.div>
  );
}
