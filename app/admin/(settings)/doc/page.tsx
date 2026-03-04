// app/documentation/page.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";

// ============ ICON COMPONENTS ============
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

const ArrowDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
  </svg>
);

const ArrowRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

// ============ SCROLL REVEAL HOOK ============
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// ============ ANIMATED SECTION WRAPPER ============
const RevealSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const { ref, isVisible } = useReveal();
  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// ============ FLOATING PARTICLES ============
const FloatingParticles = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* Gradient Orbs */}
    <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-rose-200/40 via-pink-100/30 to-transparent rounded-full blur-[100px] animate-float-slow" />
    <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] bg-gradient-to-br from-pink-100/50 via-rose-50/30 to-transparent rounded-full blur-[120px] animate-float-medium" />
    <div className="absolute bottom-32 right-1/3 w-[400px] h-[400px] bg-gradient-to-br from-amber-100/30 via-rose-50/20 to-transparent rounded-full blur-[100px] animate-float-fast" />

    {/* Dot Grid */}
    <div
      className="absolute inset-0 opacity-[0.25]"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(244 63 94 / 0.08) 1px, transparent 0)`,
        backgroundSize: "48px 48px",
      }}
    />

    {/* Floating Micro Elements */}
    <div className="absolute top-[15%] left-[10%] w-3 h-3 bg-rose-300/30 rounded-full animate-float-particle-1" />
    <div className="absolute top-[35%] right-[15%] w-2 h-2 bg-pink-400/20 rounded-full animate-float-particle-2" />
    <div className="absolute top-[60%] left-[20%] w-4 h-4 bg-rose-200/20 rounded-full animate-float-particle-3" />
    <div className="absolute top-[80%] right-[25%] w-2 h-2 bg-amber-300/25 rounded-full animate-float-particle-1" />
    <div className="absolute top-[25%] right-[40%] w-3 h-3 bg-rose-300/15 rounded-full animate-float-particle-2" />
  </div>
);

// ============ TABLE OF CONTENTS ============
const TableOfContents = () => {
  const [activeSection, setActiveSection] = useState("hero");

  const sections = [
    { id: "overview", label: "Overview", number: "01" },
    { id: "workflow", label: "Workflow", number: "02" },
    { id: "features", label: "Features", number: "03" },
    { id: "financial", label: "Financial", number: "04" },
    { id: "status", label: "Status", number: "05" },
    { id: "services", label: "Services", number: "06" },
    { id: "architecture", label: "Architecture", number: "07" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const section of sections.reverse()) {
        const el = document.getElementById(section.id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(section.id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="hidden xl:flex fixed right-8 top-1/2 -translate-y-1/2 z-50 flex-col gap-2">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`group flex items-center gap-3 transition-all duration-300 ${
            activeSection === s.id ? "scale-100" : "scale-95 opacity-60 hover:opacity-100"
          }`}
        >
          <span
            className={`text-[10px] font-bold tracking-wider transition-colors ${
              activeSection === s.id ? "text-rose-500" : "text-gray-300 group-hover:text-gray-400"
            }`}
          >
            {s.number}
          </span>
          <div
            className={`h-[3px] rounded-full transition-all duration-300 ${
              activeSection === s.id
                ? "w-8 bg-gradient-to-r from-rose-500 to-pink-500"
                : "w-4 bg-gray-200 group-hover:w-6 group-hover:bg-gray-300"
            }`}
          />
          <span
            className={`text-[11px] font-semibold transition-all duration-300 ${
              activeSection === s.id
                ? "text-rose-600 opacity-100 translate-x-0"
                : "text-gray-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
            }`}
          >
            {s.label}
          </span>
        </a>
      ))}
    </nav>
  );
};

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
  <div className="flex items-start gap-5 mb-10">
    <div className="relative flex-shrink-0">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-xl shadow-rose-500/25 rotate-3 hover:rotate-0 transition-transform duration-500">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-lg bg-white border-2 border-rose-200 flex items-center justify-center shadow-sm">
        <span className="text-[10px] font-black text-rose-500">{number}</span>
      </div>
    </div>
    <div>
      <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{title}</h2>
      <p className="text-gray-400 mt-2 text-base md:text-lg">{subtitle}</p>
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
  color = "rose",
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isLast?: boolean;
  color?: string;
}) => (
  <RevealSection delay={step * 80}>
    <div className="relative flex gap-5">
      {!isLast && (
        <div className="absolute left-7 top-16 w-[2px] h-[calc(100%-2.5rem)] bg-gradient-to-b from-rose-300 via-rose-200 to-transparent" />
      )}
      <div className="relative z-10 flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-xl shadow-rose-500/25 group-hover:shadow-2xl transition-shadow">
          <span className="text-white font-black text-base">{String(step).padStart(2, "0")}</span>
        </div>
      </div>
      <div className="flex-1 pb-10">
        <div className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:border-rose-200 hover:-translate-y-0.5 transition-all duration-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <Icon className="w-5 h-5 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed pl-12">{description}</p>
        </div>
      </div>
    </div>
  </RevealSection>
);

// ============ FEATURE CARD ============
const FeatureCard = ({
  title,
  description,
  icon: Icon,
  tags = [],
  delay = 0,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tags?: string[];
  delay?: number;
}) => (
  <RevealSection delay={delay}>
    <div className="group relative bg-white border border-gray-100 rounded-2xl p-6 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:border-rose-200 transition-all duration-500 hover:-translate-y-1 overflow-hidden h-full">
      {/* Hover Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50/0 via-transparent to-pink-50/0 group-hover:from-rose-50/80 group-hover:to-pink-50/60 transition-all duration-700 rounded-2xl" />

      {/* Decorative Corner */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-rose-100/0 to-rose-100/0 group-hover:from-rose-100/40 group-hover:to-pink-100/30 rounded-full transition-all duration-500 blur-xl" />

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mb-5 shadow-lg shadow-rose-500/15 group-hover:shadow-rose-500/25 group-hover:scale-110 transition-all duration-500">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-gray-900 font-bold text-lg mb-2 group-hover:text-rose-900 transition-colors">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-4">{description}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-rose-50 text-rose-500 border border-rose-100 group-hover:bg-rose-100 group-hover:border-rose-200 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  </RevealSection>
);

// ============ SERVICE CARD ============
const ServiceCard = ({
  emoji,
  name,
  service,
  purpose,
  keys,
  delay = 0,
}: {
  emoji: string;
  name: string;
  service: string;
  purpose: string;
  keys: string[];
  delay?: number;
}) => (
  <RevealSection delay={delay}>
    <div className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:border-rose-200 transition-all duration-500 hover:-translate-y-1 h-full">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:shadow-md transition-all duration-500">
          {emoji}
        </div>
        <div className="flex-1">
          <h3 className="text-gray-900 font-bold text-lg">{name}</h3>
          <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">{service}</span>
        </div>
      </div>
      <p className="text-gray-500 text-sm mb-5 leading-relaxed">{purpose}</p>
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
          Required Keys
        </span>
        {keys.map((key, i) => (
          <div
            key={i}
            className="flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 group-hover:border-rose-100 group-hover:bg-rose-50/30 transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-3 flex-shrink-0" />
            <code className="text-rose-600 text-xs font-mono font-bold">{key}</code>
          </div>
        ))}
      </div>
    </div>
  </RevealSection>
);

// ============ STATUS BADGE ============
const StatusBadge = ({ status, label, delay = 0 }: { status: "done" | "pending"; label: string; delay?: number }) => (
  <RevealSection delay={delay}>
    <div
      className={`group flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        status === "done"
          ? "bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 hover:border-rose-300"
          : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300"
      }`}
    >
      {status === "done" ? (
        <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
          <CheckCircleIcon className="w-5 h-5 text-rose-500" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
          <ClockIcon className="w-5 h-5 text-amber-500" />
        </div>
      )}
      <span className={`text-sm font-semibold flex-1 ${status === "done" ? "text-rose-800" : "text-amber-800"}`}>
        {label}
      </span>
      <span
        className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
          status === "done" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
        }`}
      >
        {status === "done" ? "Complete" : "In Progress"}
      </span>
    </div>
  </RevealSection>
);

// ============ WEBHOOK EVENT ============
const WebhookEvent = ({ event, description }: { event: string; description: string }) => (
  <div className="group flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-rose-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 mt-1.5 flex-shrink-0 group-hover:shadow-md group-hover:shadow-rose-400/40 group-hover:scale-125 transition-all" />
    <div>
      <code className="text-rose-600 text-sm font-mono font-bold group-hover:text-rose-700 transition-colors">{event}</code>
      <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">{description}</p>
    </div>
  </div>
);

// ============ TECH BADGE ============
const TechBadge = ({ name, desc, delay = 0 }: { name: string; desc: string; delay?: number }) => (
  <RevealSection delay={delay}>
    <div className="group flex items-center gap-4 px-5 py-3.5 bg-white border border-gray-100 rounded-2xl hover:border-rose-200 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 group-hover:scale-150 transition-transform" />
      <span className="text-gray-900 text-sm font-bold">{name}</span>
      <span className="text-gray-300 text-xs">—</span>
      <span className="text-gray-400 text-xs font-medium">{desc}</span>
    </div>
  </RevealSection>
);

// ============ ARCHITECTURE NODE ============
const ArchNode = ({
  emoji,
  label,
  sub,
  color = "rose",
  size = "md",
}: {
  emoji: string;
  label: string;
  sub: string;
  color?: "rose" | "amber" | "gray";
  size?: "sm" | "md" | "lg";
}) => {
  const colors = {
    rose: "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 hover:border-rose-300",
    amber: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300",
    gray: "bg-white border-gray-200 hover:border-rose-200",
  };
  const sizes = {
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div className={`${colors[color]} ${sizes[size]} border rounded-2xl text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
      <span className={`block mb-2 ${size === "lg" ? "text-3xl" : "text-2xl"}`}>{emoji}</span>
      <span className={`font-bold block ${size === "lg" ? "text-base" : "text-sm"} ${color === "gray" ? "text-gray-900" : color === "rose" ? "text-rose-700" : "text-amber-700"}`}>
        {label}
      </span>
      <p className="text-gray-400 text-[11px] mt-1">{sub}</p>
    </div>
  );
};

// ============ MAIN PAGE ============
export default function DocumentationPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(2deg); }
          66% { transform: translate(-20px, 20px) rotate(-1deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, -20px); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-15px, 15px); }
          75% { transform: translate(15px, -10px); }
        }
        @keyframes float-particle-1 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-30px) scale(1.5); opacity: 0.8; }
        }
        @keyframes float-particle-2 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.3); opacity: 0.7; }
        }
        @keyframes float-particle-3 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-25px) scale(1.4); opacity: 0.6; }
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes hero-slide-up {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 15s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 12s ease-in-out infinite; }
        .animate-float-particle-1 { animation: float-particle-1 6s ease-in-out infinite; }
        .animate-float-particle-2 { animation: float-particle-2 8s ease-in-out infinite; }
        .animate-float-particle-3 { animation: float-particle-3 7s ease-in-out infinite; }
        .animate-gradient-x { background-size: 300% 300%; animation: gradient-x 4s ease infinite; }
        .animate-hero-slide-up { animation: hero-slide-up 0.8s ease-out forwards; }
        .animate-hero-fade-in { animation: hero-fade-in 1s ease-out forwards; }
        .animate-pulse-ring { animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
        .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }

        html { scroll-behavior: smooth; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #fafafa; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>

      <div className="min-h-screen bg-[#fafafa] text-gray-900 relative">
        <FloatingParticles />
        <TableOfContents />

        {/* ========== STICKY NAV ========== */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            scrolled
              ? "bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-gray-200/20 py-3"
              : "bg-transparent py-5"
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20 transition-all duration-300 ${scrolled ? "w-9 h-9" : "w-10 h-10"}`}>
                <PlaneIcon className={`text-white transition-all ${scrolled ? "w-4 h-4" : "w-5 h-5"}`} />
              </div>
              <div>
                <span className={`font-black transition-all ${scrolled ? "text-base" : "text-lg"} text-gray-900`}>
                  Fly Bismillah
                </span>
                <span className="block text-[9px] text-rose-500 font-bold tracking-[0.25em] uppercase">
                  Documentation
                </span>
              </div>
            </div>
            <a
              href="https://flybismillah.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-bold hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 transition-all duration-300 flex items-center gap-2"
            >
              Visit Live Site
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </nav>

        {/* ========== HERO ========== */}
        <header className="relative z-10 pt-32 pb-24 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-5xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white border border-rose-100 mb-8 shadow-lg shadow-gray-100/50 animate-hero-slide-up">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                </span>
                <span className="text-rose-600 text-xs font-bold tracking-[0.15em] uppercase">
                  B2C Online Travel Agency Platform
                </span>
              </div>

              {/* Title */}
              <h1 className="animate-hero-slide-up delay-100 opacity-0" style={{ animationFillMode: "forwards" }}>
                <span className="block text-5xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 animate-gradient-x leading-tight pb-2">
                  Fly Bismillah
                </span>
                <span className="block text-2xl sm:text-3xl md:text-5xl font-bold text-gray-800 mt-2 tracking-tight">
                  Platform Documentation
                </span>
              </h1>

              {/* Description */}
              <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mt-8 animate-hero-slide-up delay-200 opacity-0" style={{ animationFillMode: "forwards" }}>
                Real-time global flight search, booking, ticket hold and instant ticket
                issuance — all in one fully automated platform powered by{" "}
                <span className="text-rose-500 font-bold">Duffel API</span>.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-12 animate-hero-slide-up delay-300 opacity-0" style={{ animationFillMode: "forwards" }}>
                {[
                  { value: "500+", label: "Airlines", icon: "✈️" },
                  { value: "Real-time", label: "Flight Data", icon: "⚡" },
                  { value: "100%", label: "Automated", icon: "🤖" },
                  { value: "Secure", label: "Webhooks", icon: "🔐" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:border-rose-200 hover:-translate-y-1 transition-all duration-500"
                  >
                    <span className="text-2xl block mb-2 group-hover:scale-125 transition-transform duration-300">
                      {stat.icon}
                    </span>
                    <div className="text-rose-500 font-black text-xl">{stat.value}</div>
                    <div className="text-gray-400 text-xs font-semibold mt-1 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Scroll Indicator */}
              <div className="mt-16 animate-hero-fade-in delay-500 opacity-0" style={{ animationFillMode: "forwards" }}>
                <a href="#overview" className="inline-flex flex-col items-center text-gray-300 hover:text-rose-400 transition-colors">
                  <span className="text-xs font-semibold tracking-wider uppercase mb-2">Explore</span>
                  <ArrowDownIcon className="w-5 h-5 animate-bounce-gentle" />
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* ========== MAIN ========== */}
        <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 space-y-32 pb-32">
          {/* ==================== SECTION 1 — OVERVIEW ==================== */}
          <section id="overview">
            <RevealSection>
              <SectionHeader
                number="01"
                title="Project Overview"
                subtitle="What Fly Bismillah is and how the platform works"
                icon={GlobeIcon}
              />
            </RevealSection>

            <RevealSection delay={100}>
              <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-100/50 overflow-hidden relative">
                {/* Decorative */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-rose-100/50 to-transparent rounded-full blur-3xl" />

                <div className="grid md:grid-cols-2 gap-10 relative z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                        <PlaneIcon className="w-5 h-5 text-rose-500" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900">What Is This?</h3>
                    </div>
                    <p className="text-gray-500 text-sm leading-[1.8] mb-4">
                      <span className="text-rose-500 font-bold">Fly Bismillah</span> is
                      a modern B2C online travel agency platform. It provides users with real-time
                      global flight search, booking, ticket hold (Pay Later) and instant ticket
                      issuance capabilities.
                    </p>
                    <p className="text-gray-500 text-sm leading-[1.8]">
                      The system is built on top of the{" "}
                      <span className="text-rose-500 font-bold">Duffel API</span> and is powered by a
                      fully automated email and notification system.
                    </p>

                    {/* Mini Feature Tags */}
                    <div className="flex flex-wrap gap-2 mt-6">
                      {["Flight Search", "Hold Booking", "Instant Issue", "Automated Email"].map((f) => (
                        <span key={f} className="px-3 py-1.5 text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-full">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                        <BoltIcon className="w-5 h-5 text-rose-500" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900">Tech Stack</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: "Next.js 14", desc: "App Router + Server Components" },
                        { name: "Duffel API", desc: "Flight Search & Booking Engine" },
                        { name: "MongoDB Atlas", desc: "Cloud Database" },
                        { name: "Resend + React Email", desc: "Transactional Emails" },
                        { name: "Stripe", desc: "Payment Processing" },
                        { name: "Vercel", desc: "Edge Deployment" },
                      ].map((tech, i) => (
                        <TechBadge key={i} name={tech.name} desc={tech.desc} delay={i * 50} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </section>

          {/* ==================== SECTION 2 — WORKFLOW ==================== */}
          <section id="workflow">
            <RevealSection>
              <SectionHeader
                number="02"
                title="Core Workflow"
                subtitle="Complete flow from search to ticket delivery"
                icon={RocketIcon}
              />
            </RevealSection>
            <div className="max-w-2xl mx-auto">
              <WorkflowStep step={1} title="Flight Search" description="Users search flights by route (Origin → Destination), date and passenger count. Supports One-way, Round-trip and Multi-city searches." icon={SearchIcon} />
              <WorkflowStep step={2} title="Flight Selection" description="Real-time data and pricing from Duffel API is displayed. Users select their preferred flight with advanced filtering and sorting." icon={TicketIcon} />
              <WorkflowStep step={3} title="Hold Booking" description="Users can hold a ticket without payment for a limited time. The system generates a PNR and Payment Deadline from the airline." icon={ClockIcon} />
              <WorkflowStep step={4} title="Payment & Markup" description="When the user pays, the system charges (Base Fare + Admin Markup + Gateway Fee) as the total amount." icon={CreditCardIcon} />
              <WorkflowStep step={5} title="Ticket Issuance" description="Once payment is confirmed, the admin or automated system issues the ticket from Duffel." icon={CheckCircleIcon} />
              <WorkflowStep step={6} title="Ticket Delivery" description="Webhook automatically sends the e-ticket (PDF) to the customer's email with a beautiful template and download button." icon={EmailIcon} isLast />
            </div>
          </section>

          {/* ==================== SECTION 3 — FEATURES ==================== */}
          <section id="features">
            <RevealSection>
              <SectionHeader
                number="03"
                title="Feature List"
                subtitle="Detailed features for users, admins and backend systems"
                icon={BoltIcon}
              />
            </RevealSection>

            {/* User Features */}
            <div className="mb-16">
              <RevealSection>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 border border-rose-200 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">Customer Features</h3>
                    <p className="text-gray-400 text-sm">Everything your users can do</p>
                  </div>
                </div>
              </RevealSection>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <FeatureCard title="Advanced Flight Search" description="Search One-way, Round-trip and Multi-city flights across all routes with real-time data." icon={SearchIcon} tags={["One-way", "Round-trip", "Multi-city"]} delay={0} />
                <FeatureCard title="Smart Filtering" description="Filter flights by price, airline, stops (Direct/1 Stop) and departure time." icon={CogIcon} tags={["Price", "Airline", "Stops", "Time"]} delay={80} />
                <FeatureCard title="Passenger Management" description="Save passport information and passenger names accurately with form validation." icon={UserIcon} tags={["Passport", "Validation"]} delay={160} />
                <FeatureCard title="Hold Booking (Pay Later)" description="Reserve a seat without payment. The hold lasts until the airline's deadline expires." icon={ClockIcon} tags={["PNR", "Deadline", "No Payment"]} delay={0} />
                <FeatureCard title="Automated Emails" description="Booking confirmation, ticket issuance, password reset and 2FA alerts — all automatic." icon={EmailIcon} tags={["Confirmation", "E-Ticket", "OTP"]} delay={80} />
                <FeatureCard title="Fully Responsive UI" description="Works beautifully on mobile, tablet and desktop devices with modern design." icon={GlobeIcon} tags={["Mobile", "Tablet", "Desktop"]} delay={160} />
              </div>
            </div>

            {/* Admin Features */}
            <div className="mb-16">
              <RevealSection>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 border border-rose-200 flex items-center justify-center">
                    <CogIcon className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">Admin Dashboard</h3>
                    <p className="text-gray-400 text-sm">Backend management capabilities</p>
                  </div>
                </div>
              </RevealSection>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <FeatureCard title="Overview Dashboard" description="View total sales, profit (Markup) and today's booking count." icon={ChartIcon} tags={["Sales", "Profit"]} delay={0} />
                <FeatureCard title="Booking Management" description="All bookings with PNR, Route and Date. Status filters available." icon={TicketIcon} tags={["PNR", "Filter"]} delay={80} />
                <FeatureCard title="Action Controls" description="Issue Ticket and Cancel Booking controls for admins." icon={BoltIcon} tags={["Issue", "Cancel"]} delay={160} />
                <FeatureCard title="Risk Alerts" description="Dashboard alerts for airline schedule changes." icon={ShieldIcon} tags={["Alert"]} delay={240} />
              </div>
            </div>

            {/* Backend */}
            <div>
              <RevealSection>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 border border-rose-200 flex items-center justify-center">
                    <CodeIcon className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">Backend & Automation</h3>
                    <p className="text-gray-400 text-sm">Server-side integrations and event handling</p>
                  </div>
                </div>
              </RevealSection>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <RevealSection>
                  <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-lg shadow-gray-100/50 h-full">
                    <h4 className="text-gray-900 font-black text-xl mb-5 flex items-center gap-3">
                      <span className="text-2xl">✈️</span> Duffel API Integration
                    </h4>
                    <div className="space-y-4">
                      {[
                        { title: "Real-time Inventory", desc: "Live data from 500+ airlines worldwide" },
                        { title: "Pricing Engine", desc: "Airline base fare and tax calculation" },
                        { title: "Order Management", desc: "Create, hold, issue and cancel bookings" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 mt-2 flex-shrink-0" />
                          <div>
                            <span className="text-gray-900 font-bold">{item.title}:</span>
                            <span className="text-gray-400"> {item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </RevealSection>

                <RevealSection delay={100}>
                  <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-lg shadow-gray-100/50 h-full">
                    <h4 className="text-gray-900 font-black text-xl mb-5 flex items-center gap-3">
                      <span className="text-2xl">🔐</span> Security Layer
                    </h4>
                    <div className="space-y-4">
                      {[
                        { title: "Webhook Signature", desc: "v2 HMAC-SHA256 verification" },
                        { title: "Secure Headers", desc: "x-duffel-signature validation" },
                        { title: "Data Validation", desc: "Crash-proof error handling" },
                        { title: "JWT Auth", desc: "Secure session management" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 mt-2 flex-shrink-0" />
                          <div>
                            <span className="text-gray-900 font-bold">{item.title}:</span>
                            <span className="text-gray-400"> {item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </RevealSection>
              </div>

              {/* Webhook Events */}
              <RevealSection delay={150}>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-10 shadow-2xl overflow-hidden relative">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-500/10 to-transparent rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-3xl" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-xl shadow-rose-500/30">
                        <span className="text-xl">🔔</span>
                      </div>
                      <div>
                        <h4 className="text-white font-black text-2xl">Webhook System</h4>
                        <p className="text-gray-400 text-sm">Automated real-time event processing</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { event: "order.created", desc: "Detects instant or held bookings and updates database" },
                        { event: "order.updated", desc: "Sends ticket email when documents become available" },
                        { event: "order.airline_initiated_change", desc: "Risk Alert — airline schedule or route change" },
                        { event: "order_cancellation.confirmed", desc: "Auto-updates booking status to cancelled" },
                      ].map((w, i) => (
                        <div key={i} className="group flex items-start gap-4 p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-rose-500/30 transition-all duration-300">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 mt-1.5 flex-shrink-0 group-hover:shadow-md group-hover:shadow-rose-400/50 group-hover:scale-150 transition-all" />
                          <div>
                            <code className="text-rose-400 text-sm font-mono font-bold">{w.event}</code>
                            <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{w.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </RevealSection>
            </div>
          </section>

          {/* ==================== SECTION 4 — FINANCIAL ==================== */}
          <section id="financial">
            <RevealSection>
              <SectionHeader
                number="04"
                title="Financial Model"
                subtitle="Revenue generation and pricing logic"
                icon={ChartIcon}
              />
            </RevealSection>

            <RevealSection delay={100}>
              <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-100/50 overflow-hidden relative">
                <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-br from-rose-100/50 to-transparent rounded-full blur-3xl" />

                <div className="grid md:grid-cols-2 gap-10 relative z-10">
                  {/* Revenue */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-2xl">💰</span>
                      <h3 className="text-xl font-black text-gray-900">Revenue Generation</h3>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-5">
                      <div className="space-y-4">
                        {[
                          { label: "Cost (Duffel Net Fare)", value: "- Base Price", color: "text-gray-500" },
                          { label: "Your Markup", value: "+ Your Profit", color: "text-rose-500" },
                          { label: "Gateway Fee", value: "+ Processing", color: "text-amber-500" },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm">{row.label}</span>
                            <span className={`${row.color} font-mono text-sm font-bold`}>{row.value}</span>
                          </div>
                        ))}
                        <div className="border-t-2 border-dashed border-gray-200 pt-4 mt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 font-black text-base">Sell Price</span>
                            <span className="text-rose-500 font-mono font-black text-lg">= Total</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-5">
                      <span className="text-rose-600 text-[10px] font-black uppercase tracking-[0.2em]">
                        Profit Formula
                      </span>
                      <div className="mt-3 font-mono text-sm text-gray-900 font-bold bg-white rounded-xl px-4 py-3 border border-rose-100">
                        Profit = Sell Price - (Net Fare + Gateway Fee)
                      </div>
                    </div>
                  </div>

                  {/* Refund */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-2xl">🔄</span>
                      <h3 className="text-xl font-black text-gray-900">Refund Logic</h3>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                      <div className="space-y-5">
                        {[
                          { num: "1", color: "rose", text: "Refund is processed back to the original payment method (card)" },
                          { num: "2", color: "amber", text: "Airline penalty charges are deducted from refund amount" },
                          { num: "3", color: "red", text: "Service charges and markup are retained as revenue" },
                        ].map((step, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              step.color === "rose" ? "bg-rose-100" : step.color === "amber" ? "bg-amber-100" : "bg-red-100"
                            }`}>
                              <span className={`text-xs font-black ${
                                step.color === "rose" ? "text-rose-600" : step.color === "amber" ? "text-amber-600" : "text-red-600"
                              }`}>
                                {step.num}
                              </span>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed pt-1">{step.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </section>

          {/* ==================== SECTION 5 — STATUS ==================== */}
          <section id="status">
            <RevealSection>
              <SectionHeader
                number="05"
                title="Project Status"
                subtitle="Which features are ready and which are in progress"
                icon={ChartIcon}
              />
            </RevealSection>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <StatusBadge status="done" label="Search & Booking System" delay={0} />
              <StatusBadge status="done" label="Email System (Resend & React Email)" delay={80} />
              <StatusBadge status="done" label="Webhook & Automation (Fully Tested)" delay={160} />
              <StatusBadge status="done" label="MongoDB Connection & Schema" delay={240} />
              <StatusBadge status="pending" label="Payment Gateway (Stripe / SSLCommerz)" delay={320} />
              <StatusBadge status="pending" label="Live Production Deployment" delay={400} />
            </div>

            <RevealSection delay={200}>
              <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-gray-100/50 overflow-hidden relative">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-rose-100/50 to-transparent rounded-full blur-2xl" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                        <ChartIcon className="w-5 h-5 text-rose-500" />
                      </div>
                      <span className="text-gray-900 font-black text-lg">Overall Progress</span>
                    </div>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
                      75%
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 rounded-full relative shadow-lg shadow-rose-500/20"
                      style={{ width: "75%" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse rounded-full" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-rose-500 shadow-md" />
                    </div>
                  </div>
                  <div className="flex justify-between mt-3">
                    <span className="text-gray-400 text-xs font-semibold">4 of 6 modules complete</span>
                    <span className="text-rose-400 text-xs font-semibold">2 modules in progress</span>
                  </div>
                </div>
              </div>
            </RevealSection>
          </section>

          {/* ==================== SECTION 6 — SERVICES ==================== */}
          <section id="services">
            <RevealSection>
              <SectionHeader
                number="06"
                title="External Services"
                subtitle="All required services, tools and credentials"
                icon={CogIcon}
              />
            </RevealSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              <ServiceCard emoji="✈️" name="Flight Engine" service="Duffel API" purpose="Flight search, booking, hold and ticket issuance. Connected to 500+ airlines worldwide." keys={["DUFFEL_ACCESS_TOKEN", "DUFFEL_WEBHOOK_SECRET"]} delay={0} />
              <ServiceCard emoji="🗄️" name="Database" service="MongoDB Atlas" purpose="Stores user information, booking history and payment status." keys={["MONGODB_URI"]} delay={80} />
              <ServiceCard emoji="📧" name="Email System" service="Resend & React Email" purpose="Automated ticket delivery, booking confirmations and OTP emails." keys={["RESEND_API_KEY", "ADMIN_EMAIL"]} delay={160} />
              <ServiceCard emoji="💳" name="Payment" service="Stripe" purpose="Secure international-standard payment processing from customer cards." keys={["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"]} delay={0} />
              <ServiceCard emoji="🚀" name="Deployment" service="Vercel" purpose="Website hosting on the Edge Network for global access." keys={["NEXT_PUBLIC_APP_URL"]} delay={80} />
              <ServiceCard emoji="🔐" name="Security" service="JWT + Crypto" purpose="Secure login sessions and webhook signature verification." keys={["JWT_SECRET"]} delay={160} />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <RevealSection>
                <div className="group bg-white border border-gray-100 rounded-2xl p-7 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:border-rose-200 transition-all duration-300 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      💻
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-bold text-lg">Source Code</h3>
                      <span className="text-xs text-rose-500 font-bold uppercase tracking-wider">GitHub (Private)</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Code stored securely in the cloud, connected to Vercel for auto-deployment on push.
                  </p>
                </div>
              </RevealSection>

              <RevealSection delay={100}>
                <div className="group bg-white border border-gray-100 rounded-2xl p-7 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:border-rose-200 transition-all duration-300 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      🌐
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-bold text-lg">Domain</h3>
                      <span className="text-xs text-rose-500 font-bold uppercase tracking-wider">flybismillah.com</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    DNS Records (DKIM, SPF, DMARC) configured for email authentication and domain verification.
                  </p>
                </div>
              </RevealSection>
            </div>
          </section>

          {/* ==================== SECTION 7 — ARCHITECTURE ==================== */}
          <section id="architecture">
            <RevealSection>
              <SectionHeader
                number="07"
                title="System Architecture"
                subtitle="Complete system flow and integration map"
                icon={CodeIcon}
              />
            </RevealSection>

            <RevealSection delay={100}>
              <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-xl shadow-gray-100/50 overflow-hidden relative">
                {/* Decorative */}
                <div className="absolute -top-16 -left-16 w-40 h-40 bg-gradient-to-br from-rose-100/40 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-gradient-to-br from-amber-100/30 to-transparent rounded-full blur-3xl" />

                <div className="flex flex-col items-center space-y-5 relative z-10">
                  {/* User */}
                  <div className="w-full max-w-md">
                    <ArchNode emoji="👤" label="Customer / User" sub="Flight search, selection & booking" color="rose" size="lg" />
                  </div>

                  {/* Connector */}
                  <div className="flex flex-col items-center">
                    <div className="w-[3px] h-8 bg-gradient-to-b from-rose-400 to-rose-200 rounded-full" />
                    <div className="w-3 h-3 rounded-full bg-rose-400 shadow-md shadow-rose-400/30" />
                  </div>

                  {/* Next.js App */}
                  <div className="w-full max-w-xl">
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-3xl p-7 text-center hover:shadow-xl transition-shadow">
                      <span className="text-3xl mb-2 block">⚡</span>
                      <span className="text-rose-700 font-black text-xl">Next.js 14 Application</span>
                      <p className="text-gray-400 text-sm mt-2">Frontend + API Routes + Server Components</p>
                      <div className="flex justify-center gap-2 mt-4 flex-wrap">
                        {["SSR", "API Routes", "Auth", "Middleware", "Webhooks"].map((t) => (
                          <span key={t} className="px-3 py-1 bg-white text-rose-600 text-[10px] font-bold rounded-full border border-rose-200 shadow-sm">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-rose-300 shadow-md shadow-rose-300/30" />
                    <div className="w-[3px] h-6 bg-gradient-to-b from-rose-200 to-gray-200 rounded-full" />
                  </div>

                  {/* Services Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                    {[
                      { emoji: "✈️", label: "Duffel API", sub: "Flight Engine" },
                      { emoji: "🗄️", label: "MongoDB", sub: "Database" },
                      { emoji: "📧", label: "Resend", sub: "Email Service" },
                      { emoji: "💳", label: "Stripe", sub: "Payments" },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="w-[3px] h-5 bg-gray-200 rounded-full" />
                        <ArchNode emoji={item.emoji} label={item.label} sub={item.sub} color="gray" size="sm" />
                      </div>
                    ))}
                  </div>

                  {/* Connector */}
                  <div className="flex flex-col items-center">
                    <div className="w-[3px] h-6 bg-gradient-to-b from-gray-200 to-amber-200 rounded-full" />
                    <div className="w-3 h-3 rounded-full bg-amber-400 shadow-md shadow-amber-400/30" />
                  </div>

                  {/* Webhook */}
                  <div className="w-full max-w-md">
                    <ArchNode emoji="🔔" label="Webhook Handler" sub="Real-time event processing from Duffel & Stripe" color="amber" size="lg" />
                  </div>
                </div>
              </div>
            </RevealSection>
          </section>

          {/* ==================== FOOTER ==================== */}
          <RevealSection>
            <footer className="border-t border-gray-200 pt-16">
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-xl shadow-rose-500/25 rotate-3 hover:rotate-0 transition-transform duration-500">
                    <PlaneIcon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
                  Fly Bismillah
                </span>
                <p className="text-gray-400 text-sm mt-3 mb-3">
                  B2C Online Travel Agency Platform — Powered by Duffel API
                </p>
                <a
                  href="https://flybismillah.com"
                  className="inline-flex items-center gap-2 text-rose-500 text-sm font-bold hover:text-rose-600 transition-colors group"
                >
                  flybismillah.com
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>

                <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
                  {["Next.js 14", "MongoDB", "Duffel API", "Resend", "Stripe", "Vercel"].map((tech) => (
                    <span key={tech} className="px-3 py-1.5 text-xs font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded-full">
                      {tech}
                    </span>
                  ))}
                </div>

                <p className="text-gray-300 text-xs mt-8">
                  © {new Date().getFullYear()} Fly Bismillah. All rights reserved.
                </p>
              </div>
            </footer>
          </RevealSection>
        </main>
      </div>
    </>
  );
}