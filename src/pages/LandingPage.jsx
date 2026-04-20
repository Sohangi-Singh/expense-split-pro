import React from 'react';
import { Link } from 'react-router-dom';
import {
  SplitSquareVertical, Users, TrendingUp, ShieldCheck,
  Sparkles, ArrowRight, CheckCircle, Star,
  Plane, Home, PartyPopper, Receipt,
} from 'lucide-react';

// ── Static data ───────────────────────────────────────────────────
const FEATURES = [
  {
    icon: SplitSquareVertical,
    title: 'Smart Splitting',
    desc:  'Equal or fully custom splits. The engine handles rounding so every paisa is accounted for.',
    color: 'bg-primary-100 text-primary-600',
  },
  {
    icon: TrendingUp,
    title: 'Debt Simplification',
    desc:  'Minimise transactions with our greedy algorithm. Instead of 10 transfers, settle in 3.',
    color: 'bg-success-50 text-success-600',
  },
  {
    icon: Sparkles,
    title: 'Natural Language Input',
    desc:  'Type "Dinner 1200 split 4" and we parse it instantly — no forms, no fuss.',
    color: 'bg-accent-100 text-accent-500',
  },
  {
    icon: ShieldCheck,
    title: 'Firebase-Backed',
    desc:  'Real-time sync, persistent login and Firestore storage — your data is always safe.',
    color: 'bg-warning-50 text-warning-600',
  },
];

const USE_CASES = [
  { icon: Plane,        label: 'Trip groups',    color: 'bg-sky-100 text-sky-600'        },
  { icon: Home,         label: 'Roommates',      color: 'bg-emerald-100 text-emerald-600' },
  { icon: PartyPopper,  label: 'Events & parties', color: 'bg-pink-100 text-pink-600'    },
  { icon: Users,        label: 'Friend squads',  color: 'bg-violet-100 text-violet-600'  },
];

const TESTIMONIALS = [
  { name: 'Priya S.',   role: 'Engineering student', text: 'Finally split our Goa trip costs without a single argument. This is 10×better than spreadsheets.' },
  { name: 'Arjun M.',   role: 'Flatmate, Mumbai',    text: 'We use it every month for rent and utilities. Debt simplification alone saved us 6 bank transfers.' },
  { name: 'Neha R.',    role: 'MBA student',          text: 'The NLP input is addictive. I just type the expense and it figures out the rest.' },
];

const CHECKLIST = [
  'Equal & custom unequal splits',
  'Debt simplification engine',
  'Natural language expense input',
  'Real-time Firebase sync',
  'Group management & invite codes',
  'Mobile-responsive design',
];

// ── Sub-components ─────────────────────────────────────────────────
function NavBar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-40 border-b border-white/10 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">₹</div>
          <span className="font-bold text-slate-900">ExpenseSplit <span className="text-primary-600">Pro</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"  className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Sign in</Link>
          <Link to="/signup" className="text-sm font-semibold bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors">
            Get started free
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-br from-primary-100 to-accent-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto space-y-6">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full">
          <Sparkles size={13} /> Smart expense splitting for modern groups
        </span>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
          Split expenses.<br />
          <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
            Not friendships.
          </span>
        </h1>

        <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
          ExpenseSplit Pro makes shared finances effortless — smart splits, debt
          simplification, and NLP input for students, roommates &amp; travelers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/signup"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-7 py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Start for free <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 bg-white text-slate-700 font-semibold px-7 py-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            Sign in
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-xs text-slate-400 pt-1">
          No credit card required · Firebase-backed · 100% free
        </p>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section className="py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-3">
          {USE_CASES.map(({ icon: Icon, label, color }) => (
            <div key={label} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl ${color} font-semibold text-sm`}>
              <Icon size={17} /> {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Everything you need</h2>
          <p className="text-slate-500">Built for real shared-expense scenarios, not just demos.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
              <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
                <Icon size={20} />
              </div>
              <h3 className="font-bold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChecklistSection() {
  return (
    <section className="py-16 px-4 bg-gradient-to-br from-primary-600 to-accent-600">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-white mb-3">What's included</h2>
        <p className="text-primary-200 mb-10">A fully-functional product — not a prototype.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-10">
          {CHECKLIST.map((item) => (
            <div key={item} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <CheckCircle size={18} className="text-green-300 shrink-0" />
              <span className="text-white text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>

        <Link
          to="/signup"
          className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
        >
          Get started now <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20 px-4 bg-surface-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Loved by users</h2>
          <div className="flex items-center justify-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
            <span className="text-sm text-slate-500 ml-2">5.0 from early users</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ name, role, text }) => (
            <div key={name} className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
              <p className="text-slate-600 text-sm leading-relaxed mb-4">"{text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                  {name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{name}</p>
                  <p className="text-xs text-slate-400">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10 px-4 border-t border-slate-100 bg-white">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xs">₹</div>
          <span className="font-semibold text-slate-700">ExpenseSplit Pro</span>
        </div>
        <p className="text-xs text-slate-400">
          Built with ❤️ using React + Firebase · College End-Term Project 2025
        </p>
        <div className="flex gap-4 text-xs font-medium text-slate-500">
          <Link to="/signup" className="hover:text-primary-600 transition-colors">Sign up</Link>
          <Link to="/login"  className="hover:text-primary-600 transition-colors">Login</Link>
        </div>
      </div>
    </footer>
  );
}

// ── Main export ───────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <HeroSection />
      <UseCasesSection />
      <FeaturesSection />
      <ChecklistSection />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}
