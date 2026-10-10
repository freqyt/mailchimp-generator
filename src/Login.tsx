import { useState, type FormEvent } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (remember: boolean) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === 'theplug11') {
      onLogin(remember);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 selection:bg-freqBlue selection:text-white">
      {/* Background glow effect */}
      <div className="absolute w-96 h-96 bg-[#0078D4] rounded-full blur-[140px] opacity-10 pointer-events-none" />

      <div className="w-full max-w-sm z-10">
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Brand header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-[#141414] border border-[#222] rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <img 
                src="https://music-store-pi.vercel.app/favicon.svg" 
                alt="FREQ" 
                className="w-7 h-7" 
                onError={(e) => {
                  // Fallback icon if SVG fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">FREQ Vault</h1>
            <p className="text-xs text-gray-500 mt-1">Newsletter & Email Generator</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 flex items-center justify-between">
                <span>Access Password</span>
                <span className="flex items-center text-[10px] text-gray-600">
                  <ShieldCheck size={12} className="mr-1 text-freqBlue" /> Protected
                </span>
              </label>
              
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Enter password..."
                  autoFocus
                  className={`w-full bg-[#121212] border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 transition-all focus:outline-none ${
                    error 
                      ? 'border-red-500 ring-2 ring-red-500/20' 
                      : 'border-[#222] focus:border-freqBlue focus:ring-2 focus:ring-freqBlue/20'
                  }`}
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>

              {error && (
                <p className="text-xs text-red-400 font-medium animate-pulse">
                  Incorrect password. Try again.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-[#333] bg-[#141414] text-freqBlue focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-gray-400 hover:text-gray-300 transition-colors">
                  Remember me
                </span>
              </label>
              <span className="text-[11px] text-gray-600">30-day session</span>
            </div>

            <button
              type="submit"
              className="w-full bg-freqBlue hover:bg-[#006cc0] text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-freqBlue/25 hover:shadow-freqBlue/40 active:scale-[0.99]"
            >
              <span>Unlock Generator</span>
              <ArrowRight size={15} />
            </button>
          </form>

        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          FREQ Sounds & Production Tools &copy; 2026
        </p>
      </div>
    </div>
  );
}
