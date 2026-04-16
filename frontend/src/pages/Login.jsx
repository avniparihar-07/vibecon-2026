import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { apiPostJson } from '../utils/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = email.length > 0 && password.length > 0 && !loading;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const data = await apiPostJson('/api/auth/login', { email, password });
      localStorage.setItem('vibecon_admin_token', data.access_token);
      navigate('/wall');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#FFF8F1] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-200 opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-200 opacity-50 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 border border-gray-100"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-lg bg-vibe-orange flex items-center justify-center text-white font-black">V</div>
            <span className="font-black text-xl">VibeCon 2026</span>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">Host Login</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
              Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="admin@emergent"
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-vibe-orange focus:outline-none font-semibold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-2.5 pr-10 rounded-lg border-2 border-gray-200 focus:border-vibe-orange focus:outline-none font-semibold text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700"
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 rounded-lg bg-vibe-orange text-white font-black shadow-lg shadow-orange-200 hover:scale-[1.01] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? 'Signing in…' : 'Sign In to Wall'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
