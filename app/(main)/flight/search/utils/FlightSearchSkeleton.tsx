'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Plane,
  Globe,
  Shield,
  Search,
  Sparkles,
  Clock,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------
interface LoadingStep {
  id: number;
  label: string;
  icon: React.ReactNode;
  range: [number, number]; // [start%, end%]
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------
const LOADING_STEPS: LoadingStep[] = [
  {
    id: 1,
    label: 'Connecting to airlines',
    icon: <Globe className="w-3.5 h-3.5" />,
    range: [0, 25],
  },
  {
    id: 2,
    label: 'Scanning 400+ carriers',
    icon: <Search className="w-3.5 h-3.5" />,
    range: [25, 55],
  },
  {
    id: 3,
    label: 'Comparing best prices',
    icon: <TrendingDown className="w-3.5 h-3.5" />,
    range: [55, 80],
  },
  {
    id: 4,
    label: 'Finalizing results',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    range: [80, 100],
  },
];

const TIPS = [
  'Flexible dates can save you up to 40%',
  'Tuesday & Wednesday flights are often cheapest',
  'Booking 3-6 weeks ahead gets the best deals',
  'Nearby airports may have better prices',
  'Early morning flights are usually cheaper',
];

// ----------------------------------------------------------------------
// Skeleton Card
// ----------------------------------------------------------------------
const SkeletonCard = ({ delay }: { delay: number }) => (
  <div
    className="bg-white rounded-2xl border border-gray-200/50 shadow-2xl shadow-gray-100 p-4 animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-4">
      {/* Airline logo */}
      <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />

      {/* Flight info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-4 w-16 bg-gray-100 rounded-lg" />
          <div className="flex-1 flex items-center gap-2">
            <div className="h-1 flex-1 bg-gray-50 rounded-full" />
            <Plane className="w-3 h-3 text-gray-200 rotate-90" />
            <div className="h-1 flex-1 bg-gray-50 rounded-full" />
          </div>
          <div className="h-4 w-16 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3 w-12 bg-gray-50 rounded-md" />
          <div className="h-3 w-20 bg-gray-50 rounded-md" />
          <div className="h-3 w-12 bg-gray-50 rounded-md" />
        </div>
      </div>

      {/* Price */}
      <div className="text-right shrink-0 pl-4 border-l border-gray-50">
        <div className="h-5 w-16 bg-gray-100 rounded-lg mb-1.5" />
        <div className="h-3 w-12 bg-gray-50 rounded-md ml-auto" />
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Flight Path Animation
// ----------------------------------------------------------------------
const FlightPathAnimation = ({ progress }: { progress: number }) => {
  const pathPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 20; i++) {
      const x = (i / 20) * 100;
      const y = 50 - Math.sin((i / 20) * Math.PI) * 35;
      points.push({ x, y });
    }
    return points;
  }, []);

  const pathD = useMemo(() => {
    return pathPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
  }, [pathPoints]);

  const planeIndex = Math.min(
    Math.floor((progress / 100) * pathPoints.length),
    pathPoints.length - 1
  );
  const planePos = pathPoints[planeIndex];

  return (
    <div className="relative w-full h-24 my-4">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        <path
          d={pathD}
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeDasharray="200"
          strokeDashoffset={200 - (progress / 100) * 200}
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
        </defs>
        <circle cx="0" cy="50" r="1.5" fill="#64748b" />
        <circle
          cx="100"
          cy="50"
          r="1.5"
          fill="#64748b"
          opacity={progress > 95 ? 1 : 0.3}
        />
        {pathPoints
          .filter((_, i) => i % 4 === 0 && i > 0 && i < 20)
          .map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="0.6"
              fill={point.x <= progress ? '#e11d48' : '#cbd5e1'}
              opacity={0.4}
              className="transition-colors duration-300"
            />
          ))}
      </svg>

      <div
        className="absolute transition-all duration-500 ease-out"
        style={{
          left: `${planePos?.x ?? 0}%`,
          top: `${planePos?.y ?? 50}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="relative">
          <div className="absolute inset-0 w-8 h-8 -m-1 bg-rose-400/20 rounded-full blur-md animate-pulse" />
          <div className="w-6 h-6 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Plane className="w-3 h-3 text-white rotate-45" />
          </div>
        </div>
      </div>

      <div className="absolute left-0 bottom-0">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mb-1" />
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
          Origin
        </span>
      </div>

      <div className="absolute right-0 bottom-0 text-right">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mb-1 ml-auto" />
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
          Destination
        </span>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export const FlightSearchSkleton = () => {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);

  // Progress animation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((old) => {
        const remaining = 99 - old;
        const speed = remaining > 50 ? 3 : remaining > 20 ? 1.5 : 0.5;
        const diff = Math.random() * speed;
        return Math.min(Math.floor(old + diff), 99);
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  // Rotate tips
  useEffect(() => {
    const timer = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((i) => (i + 1) % TIPS.length);
        setTipVisible(true);
      }, 300);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  // Current step
  const currentStep = useMemo(
    () =>
      LOADING_STEPS.find(
        (s) => progress >= s.range[0] && progress < s.range[1]
      ) ?? LOADING_STEPS[LOADING_STEPS.length - 1],
    [progress]
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Main Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/80 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/30 p-6 md:p-8">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.015]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        {/* Top accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400" />

        {/* Header */}
        <div className="relative text-center mb-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-100 mb-4">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
              Searching Live
            </span>
          </div>

          <h2 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight">
            Finding the best flights for you
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 font-medium">
            Scanning hundreds of airlines in real-time
          </p>
        </div>

        {/* Flight Path */}
        <FlightPathAnimation progress={progress} />

        {/* Progress Bar */}
        <div className="relative mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">Progress</span>
            <span className="text-sm font-black text-gray-900 tabular-nums">
              {progress}%
            </span>
          </div>

          <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-rose-500 to-rose-400 transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {LOADING_STEPS.map((step) => {
            const isActive =
              progress >= step.range[0] && progress < step.range[1];
            const isDone = progress >= step.range[1];

            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-500 ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-100'
                    : isActive
                    ? 'bg-rose-50 border-rose-100 shadow-sm shadow-rose-100/50'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-500 ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold leading-tight ${
                    isDone
                      ? 'text-emerald-700'
                      : isActive
                      ? 'text-rose-700'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Travel Tip */}
        <div className="bg-gray-900 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.18em] mb-0.5">
              Travel Tip
            </p>
            <p
              className={`text-[12px] font-medium text-gray-300 leading-relaxed transition-all duration-300 ${
                tipVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-1'
              }`}
            >
              💡 {TIPS[tipIndex]}
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-4 mt-5">
          <div className="flex items-center gap-1.5 text-gray-300">
            <Shield className="w-3 h-3" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">
              Secure Search
            </span>
          </div>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-1.5 text-gray-300">
            <Clock className="w-3 h-3" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">
              Real-time Prices
            </span>
          </div>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-1.5 text-gray-300">
            <Globe className="w-3 h-3" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">
              400+ Airlines
            </span>
          </div>
        </div>
      </div>

      {/* Skeleton Cards Preview */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse" />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Preparing results
          </span>
        </div>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} delay={i * 150} />
        ))}

        {/* Fade out overlay */}
        <div className="relative h-16 -mt-16 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
      </div>

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};