// app/documentation/page.tsx

"use client";

import React from "react";

const PlaneIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const SearchIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const TicketIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
  </svg>
);

const ShieldIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const EmailIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const CreditCardIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

const RocketIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const CodeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);

const GlobeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const UserIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const CogIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BoltIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const ChartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

// ============ SUBTLE BACKGROUND ============
const SubtleBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-rose-100/60 rounded-full blur-[120px]" />
    <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-pink-50/80 rounded-full blur-[100px]" />
    <div className="absolute bottom-20 right-1/4 w-[350px] h-[350px] bg-rose-50/70 rounded-full blur-[100px]" />
    <div
      className="absolute inset-0 opacity-[0.35]"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(244 63 94 / 0.07) 1px, transparent 0)`,
        backgroundSize: "40px 40px",
      }}
    />
  </div>
);

// ============ SECTION HEADER ============
const SectionHeader = ({
  number,
  title,
  subtitle,
  icon: Icon,
}: {
  number: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="flex items-start gap-4 mb-8">
    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">
        Section {number}
      </span>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{title}</h2>
      <p className="text-gray-500 mt-1 text-sm md:text-base">{subtitle}</p>
    </div>
  </div>
);

// ============ WORKFLOW STEP ============
const WorkflowStep = ({
  step,
  title,
  description,
  icon: Icon,
  isLast = false,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isLast?: boolean;
}) => (
  <div className="relative flex gap-4">
    {!isLast && (
      <div className="absolute left-6 top-14 w-[2px] h-[calc(100%-2rem)] bg-gradient-to-b from-rose-300 to-transparent" />
    )}
    <div className="relative z-10 flex-shrink-0">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
        <span className="text-white font-bold text-sm">{step}</span>
      </div>
    </div>
    <div className="flex-1 pb-8">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xl shadow-gray-100 hover:shadow-md hover:border-rose-200 transition-all duration-300">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-rose-500" />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

// ============ FEATURE CARD ============
const FeatureCard = ({
  title,
  description,
  icon: Icon,
  tags = [],
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tags?: string[];
}) => (
<div className="group relative bg-white border border-gray-200 rounded-2xl p-6  shadow-2xl shadow-gray-100 hover:shadow-lg hover:border-rose-300 transition-all duration-500 hover:-translate-y-1">
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mb-4 shadow-md shadow-rose-500/15">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-gray-900 font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-3">{description}</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-rose-50 text-rose-500 border border-rose-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ============ SERVICE CARD ============
const ServiceCard = ({
  emoji,
  name,
  service,
  purpose,
  keys,
}: {
  emoji: string;
  name: string;
  service: string;
  purpose: string;
  keys: string[];
}) => (
  <div className="group bg-white border border-gray-200 rounded-2xl p-6  shadow-2xl shadow-gray-100 hover:shadow-lg hover:border-rose-300 transition-all duration-300">
    <div className="flex items-start gap-4 mb-4">
      <span className="text-3xl">{emoji}</span>
      <div className="flex-1">
        <h3 className="text-gray-900 font-bold text-lg">{name}</h3>
        <span className="text-xs font-semibold text-rose-500">{service}</span>
      </div>
    </div>
    <p className="text-gray-500 text-sm mb-4 leading-relaxed">{purpose}</p>
    <div className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
        Required Keys
      </span>
      {keys.map((key, i) => (
        <div
          key={i}
          className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
        >
          <code className="text-rose-500 text-xs font-mono font-semibold">{key}</code>
        </div>
      ))}
    </div>
  </div>
);

// ============ STATUS BADGE ============
const StatusBadge = ({ status, label }: { status: "done" | "pending"; label: string }) => (
  <div
    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
      status === "done"
        ? "bg-rose-50 border-rose-200"
        : "bg-amber-50 border-amber-200"
    }`}
  >
    {status === "done" ? (
      <CheckCircleIcon className="w-5 h-5 text-rose-500 flex-shrink-0" />
    ) : (
      <ClockIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
    )}
    <span
      className={`text-sm font-medium ${
        status === "done" ? "text-rose-700" : "text-amber-700"
      }`}
    >
      {label}
    </span>
    <span
      className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
        status === "done"
          ? "bg-rose-100 text-rose-600"
          : "bg-amber-100 text-amber-600"
      }`}
    >
      {status === "done" ? "100%" : "In Progress"}
    </span>
  </div>
);

// ============ WEBHOOK EVENT ============
const WebhookEvent = ({
  event,
  description,
}: {
  event: string;
  description: string;
}) => (
  <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-rose-300 transition-colors group">
    <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 flex-shrink-0 group-hover:shadow-md group-hover:shadow-rose-500/30 transition-shadow" />
    <div>
      <code className="text-rose-600 text-sm font-mono font-bold">{event}</code>
      <p className="text-gray-500 text-xs mt-1 leading-relaxed">{description}</p>
    </div>
  </div>
);

// ============ MAIN PAGE ============
export default function DocumentationPage() {
  return (
    <>
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
      `}</style>

      <div className="min-h-screen bg-[#fafafa] text-gray-900 relative">
        <SubtleBackground />

        {/* ========== HERO ========== */}
        <header className="relative z-10 pt-8 pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Nav */}
            <nav className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <PlaneIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-gray-900 font-bold text-lg">Fly Bismillah</span>
                  <span className="block text-[10px] text-rose-500 font-medium tracking-wider uppercase">
                    Documentation
                  </span>
                </div>
              </div>
              <a
                href="https://flybismillah.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 transition-all duration-300"
              >
                Visit Live Site →
              </a>
            </nav>

            {/* Hero Content */}
            <div className="text-center max-w-4xl mx-auto animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 mb-6">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-rose-600 text-xs font-semibold tracking-wider uppercase">
                  B2C Online Travel Agency Platform
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 animate-gradient">
                  Fly Bismillah
                </span>
                <br />
                <span className="text-gray-800 text-3xl sm:text-4xl md:text-5xl">
                  Platform Documentation
                </span>
              </h1>

              <p className="text-gray-500 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-8">
                Real-time global flight search, booking, ticket hold and instant ticket
                issuance — all in one fully automated platform. Powered by{" "}
                <span className="text-rose-500 font-semibold">Duffel API</span>.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {[
                  { value: "500+", label: "Airlines" },
                  { value: "Real-time", label: "Flight Data" },
                  { value: "100%", label: "Automated" },
                  { value: "Secure", label: "Webhooks" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 rounded-xl p-4  shadow-2xl shadow-gray-100"
                  >
                    <div className="text-rose-500 font-bold text-xl">{stat.value}</div>
                    <div className="text-gray-400 text-xs font-medium mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* ========== MAIN ========== */}
        <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 space-y-24 pb-32">
          {/* SECTION 1 — PROJECT OVERVIEW */}
          <section>
            <SectionHeader
              number="01"
              title="Project Overview"
              subtitle="What Fly Bismillah is and how the platform works"
              icon={GlobeIcon}
            />
            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8  shadow-2xl shadow-gray-100">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <PlaneIcon className="w-5 h-5 text-rose-500" />
                    What Is This Platform?
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    <span className="text-rose-500 font-semibold">Fly Bismillah</span> is
                    a modern B2C (Business to Consumer) online travel agency platform. It
                    provides users with real-time global flight search, booking, ticket
                    hold (Pay Later) and instant ticket issuance capabilities.
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    The system is built on top of the{" "}
                    <span className="text-rose-500 font-semibold">Duffel API</span> and is
                    powered by a fully automated email and notification system.
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BoltIcon className="w-5 h-5 text-rose-500" />
                    Core Technologies
                  </h3>
                  {[
                    { name: "Next.js 14", desc: "App Router + Server Components" },
                    { name: "Duffel API", desc: "Flight Search & Booking Engine" },
                    { name: "MongoDB Atlas", desc: "Cloud Database" },
                    { name: "Resend + React Email", desc: "Transactional Emails" },
                    { name: "Stripe", desc: "Payment Processing" },
                    { name: "Vercel", desc: "Edge Deployment" },
                  ].map((tech, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-gray-900 text-sm font-semibold">
                        {tech.name}
                      </span>
                      <span className="text-gray-400 text-xs">— {tech.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2 — CORE WORKFLOW */}
          <section>
            <SectionHeader
              number="02"
              title="Core Workflow"
              subtitle="Complete flow from search to ticket delivery"
              icon={RocketIcon}
            />
            <div className="max-w-2xl mx-auto">
              <WorkflowStep
                step={1}
                title="Flight Search"
                description="Users search flights by route (Origin → Destination), date and passenger count. Supports One-way, Round-trip and Multi-city searches."
                icon={SearchIcon}
              />
              <WorkflowStep
                step={2}
                title="Flight Selection"
                description="Real-time data and pricing from Duffel API is displayed. Users select their preferred flight with filtering and sorting options."
                icon={TicketIcon}
              />
              <WorkflowStep
                step={3}
                title="Hold Booking"
                description="Users can hold a ticket without payment for a limited time. The system generates a PNR and Payment Deadline from the airline."
                icon={ClockIcon}
              />
              <WorkflowStep
                step={4}
                title="Payment & Markup"
                description="When the user pays, the system charges (Base Fare + Admin Markup + Gateway Fee) as the total amount."
                icon={CreditCardIcon}
              />
              <WorkflowStep
                step={5}
                title="Ticket Issuance"
                description="Once payment is confirmed, the admin or automated system issues the ticket from Duffel."
                icon={CheckCircleIcon}
              />
              <WorkflowStep
                step={6}
                title="Ticket Delivery"
                description="Webhook automatically sends the e-ticket (PDF) to the customer's email with a beautiful template and download button."
                icon={EmailIcon}
                isLast
              />
            </div>
          </section>

          {/* SECTION 3 — FEATURES */}
          <section>
            <SectionHeader
              number="03"
              title="Feature List"
              subtitle="Detailed features for users, admins and backend systems"
              icon={BoltIcon}
            />

            {/* User Features */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  User / Customer Features
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FeatureCard
                  title="Advanced Flight Search"
                  description="Search One-way, Round-trip and Multi-city flights across all routes with real-time data."
                  icon={SearchIcon}
                  tags={["One-way", "Round-trip", "Multi-city"]}
                />
                <FeatureCard
                  title="Smart Filtering"
                  description="Filter flights by price, airline, stops (Direct/1 Stop) and departure time."
                  icon={CogIcon}
                  tags={["Price", "Airline", "Stops", "Time"]}
                />
                <FeatureCard
                  title="Passenger Management"
                  description="Save passport information and passenger names accurately with form validation."
                  icon={UserIcon}
                  tags={["Passport", "Validation"]}
                />
                <FeatureCard
                  title="Hold Booking (Pay Later)"
                  description="Reserve a seat without payment. The hold lasts until the airline's deadline expires."
                  icon={ClockIcon}
                  tags={["PNR", "Deadline", "No Payment"]}
                />
                <FeatureCard
                  title="Automated Emails"
                  description="Booking confirmation, ticket issuance, password reset and 2FA alerts — all automatic."
                  icon={EmailIcon}
                  tags={["Confirmation", "E-Ticket", "OTP"]}
                />
                <FeatureCard
                  title="Fully Responsive UI"
                  description="Works beautifully on mobile, tablet and desktop devices with modern design."
                  icon={GlobeIcon}
                  tags={["Mobile", "Tablet", "Desktop"]}
                />
              </div>
            </div>

            {/* Admin Features */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <CogIcon className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Admin Dashboard Features
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FeatureCard
                  title="Overview Dashboard"
                  description="View total sales, total profit (Markup) and today's booking count as summary cards."
                  icon={ChartIcon}
                  tags={["Sales", "Profit", "Today"]}
                />
                <FeatureCard
                  title="Booking Management"
                  description="Full list of all bookings with PNR, Route and Date. Status filters: Held, Paid, Issued, Cancelled."
                  icon={TicketIcon}
                  tags={["PNR", "Filter", "Status"]}
                />
                <FeatureCard
                  title="Action Controls"
                  description="Issue Ticket button after payment confirmation. Cancel Booking option for admins."
                  icon={BoltIcon}
                  tags={["Issue", "Cancel", "Manual"]}
                />
                <FeatureCard
                  title="Risk Alert System"
                  description="Dashboard alerts when airlines change flight schedules or modify booking conditions."
                  icon={ShieldIcon}
                  tags={["Risk Alert", "Schedule Change"]}
                />
              </div>
            </div>

            {/* Backend */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <CodeIcon className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Backend & Automation
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Duffel */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6  shadow-2xl shadow-gray-100">
                  <h4 className="text-gray-900 font-bold text-lg mb-2 flex items-center gap-2">
                    ✈️ Duffel API Integration
                  </h4>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-gray-900 font-semibold">
                          Real-time Inventory:
                        </span>
                        <span className="text-gray-500">
                          {" "}
                          Live data from 500+ airlines worldwide
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-gray-900 font-semibold">
                          Pricing Engine:
                        </span>
                        <span className="text-gray-500">
                          {" "}
                          Airline base fare and tax calculation
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6  shadow-2xl shadow-gray-100">
                  <h4 className="text-gray-900 font-bold text-lg mb-2 flex items-center gap-2">
                    🔐 Security
                  </h4>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-gray-900 font-semibold">
                          Webhook Signature:
                        </span>
                        <span className="text-gray-500">
                          {" "}
                          v2 Signature verification with Regex & Crypto
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-gray-900 font-semibold">
                          Secure Headers:
                        </span>
                        <span className="text-gray-500">
                          {" "}
                          x-duffel-signature verification
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-gray-900 font-semibold">
                          Data Validation:
                        </span>
                        <span className="text-gray-500">
                          {" "}
                          Crash-proof data handling
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhook Events */}
              <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6  shadow-2xl shadow-gray-100">
                <h4 className="text-gray-900 font-bold text-lg mb-4 flex items-center gap-2">
                  🔔 Webhook System — Automated Events
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <WebhookEvent
                    event="order.tickets_issued"
                    description="Updates database and sends e-ticket email to customer on ticket issuance"
                  />
                  <WebhookEvent
                    event="order.payment_required"
                    description="Instantly updates database when airline shortens payment deadline"
                  />
                  <WebhookEvent
                    event="order.airline_initiated_change"
                    description="Sends Risk Alert to admin when airline changes flight schedule"
                  />
                  <WebhookEvent
                    event="order_cancellation"
                    description="Auto-updates booking status when a cancellation occurs"
                  />
                  <WebhookEvent
                    event="payment.succeeded"
                    description="Tracks and logs successful payment events"
                  />
                  <WebhookEvent
                    event="refunded"
                    description="Updates status when a refund is processed"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4 — FINANCIAL MODEL */}
          <section>
            <SectionHeader
              number="04"
              title="Financial Model"
              subtitle="Revenue generation and pricing logic"
              icon={ChartIcon}
            />
            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8  shadow-2xl shadow-gray-100">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Revenue */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    💰 Revenue Generation
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">
                          Cost (Duffel Net Fare)
                        </span>
                        <span className="text-red-500 font-mono text-sm">
                          - Base Price
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">Your Markup</span>
                        <span className="text-rose-500 font-mono text-sm">
                          + Your Profit
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm">Gateway Fee</span>
                        <span className="text-amber-500 font-mono text-sm">
                          + Processing
                        </span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 font-bold text-sm">
                            Sell Price
                          </span>
                          <span className="text-rose-500 font-mono font-bold">
                            = Total
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                      <span className="text-rose-600 text-xs font-bold uppercase tracking-wider">
                        Profit Formula
                      </span>
                      <div className="mt-2 font-mono text-sm text-gray-900">
                        Profit = Sell Price - (Net Fare + Gateway Fee)
                      </div>
                    </div>
                  </div>
                </div>
                {/* Refund */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    🔄 Refund Logic
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-rose-500 text-xs font-bold">1</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                          Refund is processed back to the original payment method (card)
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-amber-600 text-xs font-bold">2</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                          Airline penalty charges are deducted
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-red-500 text-xs font-bold">3</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                          Service charges are retained
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5 — PROJECT STATUS */}
          <section>
            <SectionHeader
              number="05"
              title="Project Status"
              subtitle="Which features are ready and which are in progress"
              icon={ChartIcon}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <StatusBadge status="done" label="Search & Booking System" />
              <StatusBadge status="done" label="Email System (Resend & React Email)" />
              <StatusBadge
                status="done"
                label="Webhook & Automation (Fully Tested)"
              />
              <StatusBadge status="done" label="MongoDB Connection & Schema" />
              <StatusBadge
                status="pending"
                label="Payment Gateway (Stripe / SSLCommerz)"
              />
              <StatusBadge
                status="pending"
                label="Live Production Deployment"
              />
            </div>
            <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6  shadow-2xl shadow-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-900 font-bold text-sm">
                  Overall Progress
                </span>
                <span className="text-rose-500 font-bold text-sm">75%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full relative"
                  style={{ width: "75%" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-gray-400 text-xs">
                  4 of 6 modules complete
                </span>
                <span className="text-gray-400 text-xs">
                  2 modules in progress
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 6 — EXTERNAL SERVICES */}
          <section>
            <SectionHeader
              number="06"
              title="External Services"
              subtitle="All required services, tools and credentials to run the project"
              icon={CogIcon}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <ServiceCard
                emoji="✈️"
                name="Flight Engine"
                service="Duffel API"
                purpose="Flight search, booking, hold and ticket issuance. Connected to 500+ airlines worldwide."
                keys={["DUFFEL_ACCESS_TOKEN", "DUFFEL_WEBHOOK_SECRET"]}
              />
              <ServiceCard
                emoji="🗄️"
                name="Database"
                service="MongoDB Atlas (Cloud)"
                purpose="Stores user information, booking history and payment status."
                keys={["MONGODB_URI"]}
              />
              <ServiceCard
                emoji="📧"
                name="Email System"
                service="Resend & React Email"
                purpose="Automated ticket delivery, booking confirmations and OTP emails."
                keys={["RESEND_API_KEY", "ADMIN_EMAIL"]}
              />
              <ServiceCard
                emoji="💳"
                name="Payment Gateway"
                service="Stripe"
                purpose="Secure international-standard payment processing from customer cards."
                keys={[
                  "STRIPE_SECRET_KEY",
                  "STRIPE_PUBLISHABLE_KEY",
                  "STRIPE_WEBHOOK_SECRET",
                ]}
              />
              <ServiceCard
                emoji="🚀"
                name="Deployment"
                service="Vercel (Next.js Optimized)"
                purpose="Website hosting on the Edge Network so everyone can browse it."
                keys={["NEXT_PUBLIC_APP_URL"]}
              />
              <ServiceCard
                emoji="🔐"
                name="Security"
                service="JWT + Crypto"
                purpose="Keeps login sessions secure and verifies all webhook signatures."
                keys={["JWT_SECRET"]}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-5 mt-5">
              <div className="bg-white border border-gray-200 rounded-2xl p-6  shadow-2xl shadow-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">💻</span>
                  <div>
                    <h3 className="text-gray-900 font-bold">
                      Source Code Management
                    </h3>
                    <span className="text-xs text-rose-500 font-semibold">
                      GitHub (Private Repo)
                    </span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Code is stored securely in the cloud and connected to Vercel for
                  auto-deployment.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6  shadow-2xl shadow-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🌐</span>
                  <div>
                    <h3 className="text-gray-900 font-bold">Domain</h3>
                    <span className="text-xs text-rose-500 font-semibold">
                      flybismillah.com
                    </span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">
                  DNS Records (DKIM, SPF, DMARC) have been configured for domain
                  verification.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 7 — ARCHITECTURE */}
          <section>
            <SectionHeader
              number="07"
              title="System Architecture"
              subtitle="Complete system flow diagram"
              icon={CodeIcon}
            />
            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8  shadow-2xl shadow-gray-100">
              <div className="flex flex-col items-center space-y-4">
                {/* User */}
                <div className="w-full max-w-md">
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
                    <span className="text-2xl mb-1 block">👤</span>
                    <span className="text-rose-600 font-bold text-sm">
                      Customer / User
                    </span>
                    <p className="text-gray-400 text-xs mt-1">
                      Flight search & booking
                    </p>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-gradient-to-b from-rose-400 to-rose-200" />

                {/* Next.js */}
                <div className="w-full max-w-lg">
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-center">
                    <span className="text-2xl mb-1 block">⚡</span>
                    <span className="text-rose-600 font-bold">
                      Next.js 14 Application
                    </span>
                    <p className="text-gray-400 text-xs mt-1">
                      Frontend + API Routes + Server Components
                    </p>
                    <div className="flex justify-center gap-2 mt-3">
                      {["SSR", "API", "Auth", "Middleware"].map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-bold rounded-full border border-rose-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-0.5 h-4 bg-rose-200" />

                {/* Services */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                  {[
                    { icon: "✈️", label: "Duffel API", sub: "Flight Engine" },
                    { icon: "🗄️", label: "MongoDB", sub: "Database" },
                    { icon: "📧", label: "Resend", sub: "Email" },
                    { icon: "💳", label: "Stripe", sub: "Payments" },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-rose-200" />
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center w-full hover:border-rose-300 hover:shadow-md transition-all">
                        <span className="text-lg">{item.icon}</span>
                        <p className="text-gray-900 text-xs font-bold mt-1">
                          {item.label}
                        </p>
                        <p className="text-gray-400 text-[10px]">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="w-0.5 h-6 bg-gradient-to-b from-rose-200 to-amber-200" />

                {/* Webhook */}
                <div className="w-full max-w-md">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <span className="text-2xl mb-1 block">🔔</span>
                    <span className="text-amber-600 font-bold text-sm">
                      Webhook Handler
                    </span>
                    <p className="text-gray-400 text-xs mt-1">
                      Receives and processes real-time events from Duffel & Stripe
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="border-t border-gray-200 pt-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <PlaneIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
                  Fly Bismillah
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-2">
                B2C Online Travel Agency Platform — Powered by Duffel API
              </p>
              <a
                href="https://flybismillah.com"
                className="text-rose-500 text-sm font-semibold hover:text-rose-600 transition-colors"
              >
                flybismillah.com
              </a>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
                <span>Next.js 14</span>
                <span>•</span>
                <span>MongoDB</span>
                <span>•</span>
                <span>Duffel API</span>
                <span>•</span>
                <span>Resend</span>
                <span>•</span>
                <span>Vercel</span>
              </div>
              <p className="text-gray-300 text-xs mt-4">
                © {new Date().getFullYear()} Fly Bismillah. All rights reserved.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}