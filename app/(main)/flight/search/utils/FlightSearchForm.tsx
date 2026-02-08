"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plane, Repeat } from "lucide-react";
import { FaLayerGroup } from "react-icons/fa";

import OneWayForm from "../utils/OneWayForm";
import RoundTripForm from "../utils/RoundTripForm";
import MultiCityForm from "../utils/MultiCityForm";

type TabId = "one_way" | "round_trip" | "multi_city";

type Tab = {
  id: TabId;
  icon: React.ElementType;
  label: string;
  subtitle: string;
};

const TABS: Tab[] = [
  {
    id: "round_trip",
    icon: Repeat,
    label: "Round Trip",
    subtitle: "Go and return on selected dates",
  },
  {
    id: "one_way",
    icon: Plane,
    label: "One Way",
    subtitle: "Single journey to your destination",
  },
  {
    id: "multi_city",
    icon: FaLayerGroup,
    label: "Multi City",
    subtitle: "Visit multiple cities in one itinerary",
  },
];

export default function FlightSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("round_trip");

  // URL থেকে tab sync
  useEffect(() => {
    const typeParam = searchParams.get("type");

    if (
      typeParam === "one_way" ||
      typeParam === "round_trip" ||
      typeParam === "multi_city"
    ) {
      setActiveTab(typeParam);
    }
  }, [searchParams]);

  const activeMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  // Tab change করলে শুধু type সেট করব, trigger মুছে দেব
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("type", tabId);
    nextParams.delete("trigger");

    router.replace(`?${nextParams.toString()}`, { scroll: false });
  };

  // Search বাটনে ক্লিক করলে trigger=1 সহ push করব
  const handleSearchPush = (params: URLSearchParams) => {
    params.set("trigger", "1");
    router.push(`/flight/search?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      className="
        w-full
        rounded-3xl
        relative z-20
      "
    >
      {/* Top: Header + Big Tabs */}
      <div className="px-4 md:px-6 pt-4 pb-3 bg-white rounded-t-3xl border-b border-slate-100">
        <div className="flex flex-col gap-4">
          {/* Small label row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 shadow-sm shadow-rose-100/80">
                <Plane className="w-5 h-5 -rotate-45" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500">
                  Flights
                </p>
                <p className="text-xs md:text-sm font-semibold text-slate-900">
                  Choose your trip type
                </p>
              </div>
            </div>

            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-slate-50 text-[10px] font-medium shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live availability
            </div>
          </div>

          {/* Big pill tabs */}
          <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-1.5 shadow-sm shadow-slate-100">
            <div
              className="grid grid-cols-3 gap-1.5"
              role="tablist"
              aria-label="Flight type"
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    role="tab"
                    aria-selected={isActive}
                    className={`
                      relative
                      flex items-center justify-start gap-3
                      px-4 md:px-5
                      h-12 md:h-14
                      rounded-2xl
                      text-left
                      transition-all duration-200 ease-out
                      cursor-pointer
                      border
                      ${
                        isActive
                          ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-300/70 scale-[1.02]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }
                    `}
                  >
                    <div
                      className={`
                        inline-flex items-center justify-center
                        w-8 h-8 rounded-full
                        text-sm
                        ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-rose-50 text-rose-600"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`
                          text-[11px] md:text-xs font-bold uppercase tracking-[0.16em]
                          ${isActive ? "text-white" : "text-slate-700"}
                        `}
                      >
                        {tab.label}
                      </span>
                      <span
                        className={`
                          text-[10px] md:text-[11px] font-medium truncate
                          ${
                            isActive ? "text-rose-50/90" : "text-slate-400"
                          }
                        `}
                      >
                        {tab.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active tab subtitle নিচে */}
          <p className="text-[11px] md:text-xs text-slate-500 font-medium px-1">
            {activeMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Forms */}
      <div className="bg-white rounded-b-3xl min-h-[150px]">
        <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300">
          {activeTab === "one_way" && (
            <div className="transition-opacity duration-300 relative z-30">
              <OneWayForm onSearch={handleSearchPush} />
            </div>
          )}

          {activeTab === "round_trip" && (
            <div className="transition-opacity duration-300 relative z-30">
              <RoundTripForm onSearch={handleSearchPush} />
            </div>
          )}

          {activeTab === "multi_city" && (
            <div className="transition-opacity duration-300 relative z-30">
              <MultiCityForm onSearch={handleSearchPush} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}