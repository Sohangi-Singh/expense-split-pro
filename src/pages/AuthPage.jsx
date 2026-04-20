import React from 'react';
import { Link } from 'react-router-dom';
import { SplitSquareVertical, Users, TrendingUp, ShieldCheck } from 'lucide-react';
import LoginForm  from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';

const FEATURES = [
  { icon: SplitSquareVertical, text: 'Smart equal & unequal splits'  },
  { icon: Users,               text: 'Group expense tracking'        },
  { icon: TrendingUp,          text: 'Debt simplification engine'    },
  { icon: ShieldCheck,         text: 'Secure Firebase-backed data'   },
];

export default function AuthPage({ mode = 'login' }) {
  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: branding ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 flex-col justify-between p-12 text-white">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
            ₹
          </div>
          <span className="text-xl font-bold tracking-tight">ExpenseSplit Pro</span>
        </Link>

        {/* Hero copy */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
              Split expenses.<br />Not friendships.
            </h1>
            <p className="text-primary-200 text-lg leading-relaxed max-w-sm">
              The smartest way for students, roommates, and travelers to manage
              group finances — fairly and effortlessly.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon size={16} />
                </div>
                <span className="text-sm font-medium text-primary-100">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer blurb */}
        <p className="text-primary-300 text-xs">
          Built with React + Firebase · College End-Term Project
        </p>
      </div>

      {/* ── Right panel: form ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-white">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
            ₹
          </div>
          <span className="text-lg font-bold text-slate-900">ExpenseSplit Pro</span>
        </Link>

        <div className="w-full max-w-sm space-y-7 animate-fade-in">
          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-slate-500">
              {isLogin
                ? 'Sign in to manage your group expenses.'
                : 'Join thousands splitting expenses smarter.'}
            </p>
          </div>

          {/* Form */}
          {isLogin ? <LoginForm /> : <SignupForm />}

          {/* Demo credentials hint */}
          {isLogin && (
            <div className="rounded-xl bg-surface-100 border border-surface-200 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">Demo credentials</p>
              <p className="text-xs text-slate-600">Email: <span className="font-mono">demo@expensesplit.pro</span></p>
              <p className="text-xs text-slate-600">Password: <span className="font-mono">demo1234</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
