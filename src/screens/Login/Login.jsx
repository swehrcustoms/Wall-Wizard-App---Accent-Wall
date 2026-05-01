import { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import Button from '@/components/Button';

export default function Login() {
  const signIn = useSessionStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    const err = await signIn(email);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-brand-600 to-brand-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🪄</div>
          <h1 className="text-2xl font-bold text-gray-900">WallWizard</h1>
          <p className="text-gray-500 text-sm mt-1">Accent wall quotes in under 5 minutes</p>
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <div className="text-4xl">📬</div>
            <h2 className="font-semibold text-gray-800">Check your email</h2>
            <p className="text-sm text-gray-500">
              We sent a magic link to <strong>{email}</strong>. Tap it to sign in.
            </p>
            <button
              className="text-brand-600 text-sm hover:underline"
              onClick={() => setSent(false)}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !email}>
              {loading ? 'Sending…' : 'Send magic link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
