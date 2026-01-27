"use client";
import { statsData } from "@/constant/data";
import { appTheme } from "@/constant/theme/global";
import { FaUserFriends, FaMapMarkedAlt, FaThumbsUp, FaStar } from "react-icons/fa";

const Stats = () => {
  const { layout } = appTheme;

  const getIcon = (iconName: string) => {

    const iconClass = "text-3xl md:text-4xl text-rose-500 relative z-10 transition-colors duration-300 group-hover:text-white";
    

    const wrapperClass = "w-16 h-16 md:w-20 md:h-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 transition-all duration-500 group-hover:bg-rose-600 group-hover:scale-110 shadow-[0_0_20px_rgba(225,29,72,0.2)] group-hover:shadow-[0_0_30px_rgba(225,29,72,0.6)]";

    let IconComponent;
    switch (iconName) {
      case "users": IconComponent = FaUserFriends; break;
      case "map": IconComponent = FaMapMarkedAlt; break;
      case "like": IconComponent = FaThumbsUp; break;
      default: IconComponent = FaStar; break;
    }

    return (
        <div className={wrapperClass}>
            <IconComponent className={iconClass} />
        </div>
    );
  };

  return (
    <section className="relative py-20 overflow-hidden bg-gray-950 text-white">
      
      {/* ================= Decorative Background Elements ================= */}
      {/* Left Glow Blob */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-rose-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      {/* Right Glow Blob */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className={`${layout.container} relative z-10`}>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {statsData.map((stat) => (
            <div 
              key={stat.id} 
              className="group relative bg-gray-900/40 backdrop-blur-md border border-gray-800 hover:border-rose-500/50 p-8 rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-900/20"
            >
              {/* Icon Section */}
              {getIcon(stat.icon)}
              
              {/* Number Value */}
              <h3 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
                {stat.value}
              </h3>
              
              {/* Label */}
              <p className="text-gray-400 uppercase tracking-widest text-xs font-bold group-hover:text-rose-400 transition-colors duration-300">
                {stat.label}
              </p>

              {/* Decorative Corner (Optional Detail) */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-rose-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Stats;