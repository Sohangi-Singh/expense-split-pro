import React, { useState } from 'react';
import { Sparkles, CheckCircle, Loader } from 'lucide-react';
import { useAuth }   from '../../hooks/useAuth';
import { useGroups } from '../../hooks/useGroups';
import { useToast }  from '../../hooks/useToast';
import { seedDemoData } from '../../utils/seedData';
import Button from './Button';

/**
 * DemoSetup — one-click button to populate Firestore with
 * realistic demo data so the app looks great during demos.
 *
 * Shown only when the user has 0 groups.
 */
export default function DemoSetup() {
  const { user }                           = useAuth();
  const { loadGroups }                     = useGroups();
  const { toastSuccess, toastError }       = useToast();
  const [status, setStatus]                = useState('idle'); // idle | loading | done

  const steps = [
    'Creating "Goa Trip 2025" group…',
    'Creating "Flat 4B" group…',
    'Adding 8 sample expenses…',
    'Recording a sample settlement…',
    'Refreshing your dashboard…',
  ];
  const [stepIdx, setStepIdx] = useState(0);

  const handleSeed = async () => {
    if (!user) return;
    setStatus('loading');
    setStepIdx(0);

    // Cycle step labels for visual progress
    const interval = setInterval(() => {
      setStepIdx((i) => (i < steps.length - 1 ? i + 1 : i));
    }, 900);

    try {
      await seedDemoData(user);
      clearInterval(interval);
      setStepIdx(steps.length - 1);
      await loadGroups();
      setStatus('done');
      toastSuccess('Demo data loaded! Explore your dashboard 🎉');
    } catch (err) {
      clearInterval(interval);
      setStatus('idle');
      toastError(`Seeding failed: ${err.message}`);
    }
  };

  if (status === 'done') {
    return (
      <div className="flex items-center gap-2 text-success-600 text-sm font-semibold animate-fade-in">
        <CheckCircle size={18} /> Demo data loaded — refresh the page if groups don't appear.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-100 rounded-2xl px-6 py-8 text-center max-w-sm mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-white shadow-card flex items-center justify-center">
        <Sparkles size={26} className="text-primary-500" />
      </div>

      <div>
        <p className="font-bold text-slate-900">Load demo data</p>
        <p className="text-sm text-slate-500 mt-1">
          Instantly populate two groups, 8 expenses, and a settlement so you can demo all features.
        </p>
      </div>

      {status === 'loading' ? (
        <div className="flex items-center gap-2 text-sm text-primary-700 font-medium">
          <Loader size={15} className="animate-spin" />
          {steps[stepIdx]}
        </div>
      ) : (
        <Button
          variant="primary"
          icon={Sparkles}
          onClick={handleSeed}
          fullWidth
        >
          Load demo data
        </Button>
      )}

      <p className="text-xs text-slate-400">
        Uses your Firebase project · data can be deleted from the console
      </p>
    </div>
  );
}
