"use client";
import { appTheme } from "@/constant/theme/global";
import { FaPlane } from "react-icons/fa";

const page = () => {
  const { colors } = appTheme;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-4 border-gray-100 border-dashed rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-0 border-4 border-t-rose-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
        <div className="absolute inset-0 animate-spin">
          <div className="h-full w-full relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full">
               <FaPlane className="text-rose-600 text-xl transform rotate-45" />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className=" w-20 h-20 rounded-full flex items-center justify-center animate-pulse">
             <span className="text-3xl">✈️</span>
          </div>
        </div>
      </div>

      {/* ================= Text Content ================= */}
      <div className="text-center space-y-2">
        <h2 className={`text-2xl font-extrabold ${colors.text.heading} tracking-tight`}>
          Bismillah Travels
        </h2>
        
        <div className="flex items-center justify-center gap-1">
          <span className="w-2 h-2 bg-rose-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 bg-rose-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 bg-rose-600 rounded-full animate-bounce"></span>
        </div>
        
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-2">
          Preparing your journey...
        </p>
      </div>

    </div>
  );
};

export default page;