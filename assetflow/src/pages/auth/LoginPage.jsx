import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import brandLogo from '../../assets/activotrack-logo.png';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode]       = useState('login'); // 'login' | 'signup'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]       = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Name is required.'); setLoading(false); return; }
        await signup(email, password, name.trim());
      }
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  function friendlyError(code) {
    const map = {
      'auth/user-not-found':    'No account found with this email.',
      'auth/wrong-password':    'Incorrect password.',
      'auth/email-already-in-use': 'Email already registered. Please log in.',
      'auth/weak-password':     'Password must be at least 6 characters.',
      'auth/invalid-email':     'Please enter a valid email address.',
      'auth/invalid-credential':'Invalid email or password.',
    };
    return map[code] ?? 'Something went wrong. Please try again.';
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <img src={brandLogo} alt="Activotrack" className="w-16 h-16 mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-slate-100">Activotrack</h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise Asset Management</p>
        </div>

        {/* Card */}
        <div className="glass-card p-7">
          <h2 className="text-lg font-semibold text-slate-100 mb-5">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-900/20 border border-red-800/50 rounded-lg p-3 mb-5">
              <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  className="w-full"
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {mode === 'signup' && (
            <p className="text-xs text-slate-500 mt-4 text-center">
              Sign up creates an <strong className="text-slate-400">employee</strong> account.
              Admin roles are assigned later.
            </p>
          )}

          <p className="text-sm text-slate-400 text-center mt-5">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              {mode === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
