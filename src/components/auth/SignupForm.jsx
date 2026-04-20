import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'This email is already registered. Try logging in.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password must be at least 6 characters.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

// Password strength scorer (0–4)
function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)                score++;
  if (/[A-Z]/.test(pw))             score++;
  if (/[0-9]/.test(pw))             score++;
  if (/[^A-Za-z0-9]/.test(pw))     score++;
  return score;
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = [
  'bg-danger-500', 'bg-danger-500', 'bg-warning-500', 'bg-warning-500', 'bg-success-500',
];

export default function SignupForm() {
  const navigate    = useNavigate();
  const { register } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [errors,    setErrors]    = useState({});
  const [submitting, setSubmitting] = useState(false);

  const strength = password ? passwordStrength(password) : -1;

  const validate = useCallback(() => {
    const errs = {};
    if (!name.trim())                      errs.name     = 'Name is required.';
    if (!email.trim())                     errs.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email    = 'Enter a valid email.';
    if (!password)                         errs.password = 'Password is required.';
    else if (password.length < 6)          errs.password = 'Must be at least 6 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [name, email, password]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(name.trim(), email, password);
      toastSuccess('Account created! Welcome aboard 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg = friendlyError(err.code);
      toastError(msg);
      setErrors({ form: msg });
    } finally {
      setSubmitting(false);
    }
  }, [name, email, password, register, navigate, validate, toastSuccess, toastError]);

  const field = (id, label, type, value, onChange, placeholder, icon, errorKey) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          id={id}
          type={type}
          autoComplete={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all duration-150
            ${errors[errorKey] ? 'border-danger-400 bg-danger-50' : 'border-slate-200 bg-white hover:border-slate-300'}
          `}
        />
      </div>
      {errors[errorKey] && <p className="text-xs text-danger-600">{errors[errorKey]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {errors.form && (
        <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3">
          {errors.form}
        </p>
      )}

      {/* Name */}
      {field(
        'name', 'Full name', 'text', name,
        (e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); },
        'Alex Johnson',
        <User size={16} />,
        'name'
      )}

      {/* Email */}
      {field(
        'email', 'Email address', 'email', email,
        (e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); },
        'you@example.com',
        <Mail size={16} />,
        'email'
      )}

      {/* Password + strength meter */}
      <div className="space-y-1.5">
        <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="new-password"
            type={showPass ? 'text' : 'password'}
            autoComplete="new-password"
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

        {/* Strength bar */}
        {password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300
                    ${i < strength ? STRENGTH_COLORS[strength] : 'bg-slate-200'}`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">{STRENGTH_LABELS[Math.max(strength, 0)]}</p>
          </div>
        )}
        {errors.password && <p className="text-xs text-danger-600">{errors.password}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="
          w-full flex items-center justify-center gap-2 mt-1
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
          <UserPlus size={16} />
        )}
        {submitting ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  );
}
