"use client";

import React from "react";

export const HospitalLoadingSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white border-2 border-slate-200/60 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
              <div className="h-3.5 bg-slate-100 rounded-lg w-1/2" />
            </div>
            <div className="h-6 w-14 bg-slate-200 rounded-lg shrink-0" />
          </div>

          <div className="h-10 bg-slate-100 rounded-xl w-full" />

          <div className="flex items-center gap-2">
            <div className="h-6 bg-slate-200 rounded-lg w-20" />
            <div className="h-6 bg-slate-200 rounded-lg w-24" />
            <div className="h-6 bg-slate-200 rounded-lg w-16" />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="h-4 bg-slate-200 rounded-lg w-28" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-16 bg-slate-200 rounded-lg" />
              <div className="h-7 w-24 bg-slate-200 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
