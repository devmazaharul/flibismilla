"use client";
import { statsData } from "@/constant/data";
import { appTheme } from "@/constant/theme/global";
import {
  FaUserFriends,
  FaMapMarkedAlt,
  FaThumbsUp,
  FaStar,
} from "react-icons/fa";

const Stats = () => {
  const { layout } = appTheme;

  const getIcon = (iconName: string) => {
    let IconComponent;
    switch (iconName) {
      case "users":
        IconComponent = FaUserFriends;
        break;
      case "map":
        IconComponent = FaMapMarkedAlt;
        break;
      case "like":
        IconComponent = FaThumbsUp;
        break;
      default:
        IconComponent = FaStar;
        break;
    }
    return IconComponent;
  };

  // Gradient pairs for each card
  const cardAccents = [
    { from: "from-rose-500", to: "to-pink-500", bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100" },
    { from: "from-amber-500", to: "to-orange-500", bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100" },
    { from: "from-emerald-500", to: "to-teal-500", bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
    { from: "from-violet-500", to: "to-indigo-500", bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100" },
  ];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50">

      {/* ================= Decorative Background ================= */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-rose-50/30 rounded-full blur-[150px] pointer-events-none" />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #64748b 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className={`${layout.container} relative z-10`}>

        {/* ================= Section Header ================= */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            Our Achievements
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            Numbers That{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-rose-600">Speak</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-rose-100 rounded-full -z-0" />
            </span>{" "}
            For Us
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Our journey in numbers — delivering excellence every step of the way.
          </p>
        </div>

        {/* ================= Stats Grid ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {statsData.map((stat, index) => {
            const accent = cardAccents[index % cardAccents.length];
            const IconComp = getIcon(stat.icon);

            return (
              <div
                key={stat.id}
                className={`group relative bg-white p-8 lg:p-10 rounded-3xl border border-gray-100 shadow-[0_4px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_60px_rgba(225,29,72,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center overflow-hidden`}
              >
                {/* Top gradient accent */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent.from} ${accent.to} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Icon */}
                <div
                  className={`w-18 h-18 ${accent.bg} rounded-2xl flex items-center justify-center mb-6 ring-4 ${accent.ring} ring-offset-2 ring-offset-white group-hover:scale-110 transition-all duration-500`}
                  style={{ width: "72px", height: "72px" }}
                >
                  <IconComp className={`text-2xl ${accent.text}`} />
                </div>

                {/* Number */}
                <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
                  {stat.value}
                </h3>

                {/* Label */}
                <p className="text-gray-400 uppercase tracking-[0.15em] text-xs font-bold group-hover:text-rose-500 transition-colors duration-300">
                  {stat.label}
                </p>

                {/* Decorative bg circle */}
                <div
                  className={`absolute -bottom-6 -right-6 w-32 h-32 ${accent.bg} rounded-full opacity-0 group-hover:opacity-30 transition-all duration-700 pointer-events-none blur-md`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;