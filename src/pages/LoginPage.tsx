import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import { GraduationCap, Loader2 } from 'lucide-react';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
      else navigate('/');
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error);
      else navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-4 shadow-lg">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">EduCRM</h1>
          <p className="text-sm text-gray-500 mt-1">Educational Consultancy Management</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input label="Full Name" value={fullName} onChange={setFullName} required placeholder="John Doe" />
            )}
            <Input label="Email" value={email} onChange={setEmail} type="email" required placeholder="you@example.com" />
            <Input label="Password" value={password} onChange={setPassword} type="password" required placeholder="••••••••" />

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-6">
            By continuing, you agree to the terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
