import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Copy, ExternalLink, ArrowRight } from 'lucide-react';
import { apiPostJson } from '../utils/api.js';
import { isValidLinkedInPostUrl } from '../utils/parseLinkedin.js';

const LINKEDIN_SHARE_URL =
  'https://www.linkedin.com/sharing/share-offsite/?url=https://vibecon.com';

const buildTemplate = (name) =>
  `Day 1 at #vibecon2026 ⚡

300 builders. One room. One wall. ${name ? name + ' here — ' : ''}feeling lucky to be in the room with the most ambitious people I have ever met.

Big shoutout to @Emergent and @YCombinator for putting this together.

If you're building, ship something today. The bar just moved. 🚀

#vibecon2026 #buildinpublic`;

export default function Guide() {
  const navigate = useNavigate();
  const [name, setName] = useState(() => localStorage.getItem('vibecon_user') || '');
  const [text, setText] = useState(
    () => localStorage.getItem('vibecon_composed_text') || buildTemplate('')
  );
  const [textWasEdited, setTextWasEdited] = useState(
    () => !!localStorage.getItem('vibecon_composed_text')
  );
  const [shared, setShared] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Auto-personalize template when name changes (unless user has edited it).
  useEffect(() => {
    if (!textWasEdited) {
      setText(buildTemplate(name));
    }
  }, [name, textWasEdited]);

  // Debounced persistence of composed text to localStorage.
  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem('vibecon_composed_text', text);
    }, 200);
    return () => clearTimeout(id);
  }, [text]);

  const onTextChange = (e) => {
    setText(e.target.value);
    setTextWasEdited(true);
  };

  const canShare = name.trim().length > 0;

  const onShare = async () => {
    if (!canShare) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard may be denied — still proceed.
    }
    localStorage.setItem('vibecon_user', name.trim());
    localStorage.setItem('vibecon_composed_text', text);
    window.open(LINKEDIN_SHARE_URL, '_blank', 'noopener,noreferrer');
    setShared(true);
  };

  const urlValid = useMemo(() => isValidLinkedInPostUrl(linkedinUrl), [linkedinUrl]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!urlValid) {
      setSubmitError('That doesn’t look like a valid LinkedIn post URL.');
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiPostJson('/api/posts', {
        name: name.trim(),
        linkedin_url: linkedinUrl.trim(),
        composed_text: text,
      });
      localStorage.setItem(
        'vibecon_submitted_post',
        JSON.stringify({
          name: data.name,
          activity_id: data.activity_id,
          linkedin_url: data.linkedin_url,
        })
      );
      navigate('/wall-interact');
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#FFF8F1] dot-grid relative">
      <div className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-200 opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-200 opacity-40 blur-3xl" />

      <div className="relative max-w-2xl mx-auto px-6 py-10 space-y-10">
        {/* Section 1 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
        >
          <h1 className="text-3xl font-black tracking-tight">
            Share your moment <span className="text-vibe-orange">on LinkedIn</span>
          </h1>
          <p className="mt-1 text-sm font-semibold text-gray-600">
            Step 1 of 2 — write your post, copy it, share to LinkedIn.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                Your name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aanya Sharma"
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-vibe-orange focus:outline-none font-semibold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                Your post
              </label>
              <textarea
                value={text}
                onChange={onTextChange}
                rows={9}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-vibe-orange focus:outline-none font-semibold text-sm leading-relaxed"
              />
              <p className="mt-1 text-[11px] font-bold text-gray-400">
                Edit it freely. We save it and use it on the wall as a fallback if scraping fails.
              </p>
            </div>

            <button
              onClick={onShare}
              disabled={!canShare}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-vibe-orange text-white font-black shadow-lg shadow-orange-200 hover:scale-[1.01] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {shared ? (
                <>
                  <Check size={18} /> Text copied — LinkedIn is open!
                </>
              ) : (
                <>
                  <Copy size={18} /> Copy text & Open LinkedIn
                </>
              )}
            </button>

            {shared && (
              <motion.ol
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm font-semibold text-green-900 space-y-1"
              >
                <li>1. LinkedIn composer is open in a new tab.</li>
                <li>2. Paste (Ctrl+V or Cmd+V) and post.</li>
                <li>3. Come back here and paste your post URL below.</li>
              </motion.ol>
            )}
          </div>
        </motion.section>

        {/* Section 2 */}
        {shared && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
          >
            <h2 className="text-2xl font-black tracking-tight">
              Paste your <span className="text-vibe-orange">LinkedIn post URL</span>
            </h2>
            <p className="mt-1 text-sm font-semibold text-gray-600">
              On your published post, click the three dots → Copy link to post. Paste it here.
            </p>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                  LinkedIn post URL
                </label>
                <input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/posts/..."
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-vibe-orange focus:outline-none font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                  Your name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-vibe-orange focus:outline-none font-semibold text-sm"
                />
              </div>

              {submitError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !linkedinUrl}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-vibe-orange text-white font-black shadow-lg shadow-orange-200 hover:scale-[1.01] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? 'Adding to wall…' : (
                  <>
                    Add to the Wall <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <a
              href={LINKEDIN_SHARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              Open LinkedIn composer again <ExternalLink size={12} />
            </a>
          </motion.section>
        )}
      </div>
    </div>
  );
}
