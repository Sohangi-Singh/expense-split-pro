import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

// Maps Firebase error codes to friendly messages
function friendlyError(code) {
  const map = {
    'auth/user-not-found':    'No account found with this email.',
    'auth/wrong-password':    'Incorrect password. Please try again.',
    'auth/invalid-email':     'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/invalid-credential':'Invalid email or password.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

export default function LoginForm() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const { toastSuccess, toastError } = useToast();

  // Controlled form state
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [errors,    setErrors]    = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Client-side validation before hitting Firebase
  const validate = useCallback(() => {
    const errs = {};
    if (!email.trim())              errs.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email.';
    if (!password)                  errs.password = 'Password is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [email, password]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(email, password);
      toastSuccess('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toastError(friendlyError(err.code));
      setErrors({ form: friendlyError(err.code) });
    } finally {
      setSubmitting(false);
    }
  }, [email, password, login, navigate, validate, toastSuccess, toastError]);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Global error banner */}
      {errors.form && (
        <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3">
          {errors.form}
        </p>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email address
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
            placeholder="you@example.com"
            className={`
              w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-all duration-150
              ${errors.email ? 'border-danger-400 bg-danger-50' : 'border-slate-200 bg-white hover:border-slate-300'}
            `}
          />
        </div>
        {errors.email && <p className="text-xs text-danger-600">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
            placeholder="••••••••"
            className={`
              w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-all duration-150
              ${errors.password ? 'border-danger-400 bg-danger-50' : 'border-slate-200 bg-white hover:border-slate-300'}
            `}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-danger-600">{errors.password}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="
          w-full flex items-center justify-center gap-2
          bg-primary-600 hover:bg-primary-700 active:bg-primary-800
          text-white font-semibold text-sm py-2.5 rounded-xl
          shadow-sm transition-all duration-150
          disabled:opacity-60 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        "
      >
        {submitting ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <LogIn size={16} />
        )}
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>

      {/* Switch to signup */}
      <p className="text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
          Sign up free
        </Link>
      </p>
    </form>
  );
}
