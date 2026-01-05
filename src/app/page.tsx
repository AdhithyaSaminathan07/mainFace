'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BranchLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/branch-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // Redirect to branch dashboard (currently just a placeholder or could be /branch/dashboard)
        // For now, let's assume there is a /dashboard or we just show success
        const data = await res.json();
        console.log('Login success:', data);
        alert('Branch login successful! Redirecting to branch dashboard...');
        // router.push('/branch/dashboard'); // TODO: Create this page
      } else {
        const data = await res.json();
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white/5 p-8 shadow-2xl backdrop-blur-xl border border-white/10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Branch Portal</h1>
          <p className="text-gray-400 mt-2">Sign in to manage your branch</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-center text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              className="w-full rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
              placeholder="branch@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              className="w-full rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-green-500 hover:shadow-green-500/30 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Enter Portal'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <a href="/admin/login" className="text-sm text-gray-500 hover:text-white transition-colors">
            Are you an Administrator?
          </a>
        </div>
      </div>
    </div>
  );
}
