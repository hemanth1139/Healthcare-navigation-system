"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MapPin, Navigation, Search, Check, Sparkles, Building2 } from "lucide-react";

export interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocationName: string;
  isUsingGps: boolean;
  onSelectManualLocation: (locationText: string) => void;
  onRequestGpsLocation: () => void;
  isLocating: boolean;
}

const TAMIL_NADU_DISTRICTS = [
  "Chennai, Tamil Nadu",
  "Coimbatore, Tamil Nadu",
  "Madurai, Tamil Nadu",
  "Tiruchirappalli, Tamil Nadu",
  "Salem, Tamil Nadu",
  "Tirunelveli, Tamil Nadu",
  "Vellore, Tamil Nadu",
  "Erode, Tamil Nadu",
  "Thanjavur, Tamil Nadu",
  "Thoothukudi, Tamil Nadu",
  "Kanchipuram, Tamil Nadu",
  "Tiruvallur, Tamil Nadu",
  "Dindigul, Tamil Nadu",
  "Tiruppur, Tamil Nadu",
  "The Nilgiris (Ooty), Tamil Nadu",
  "All Tamil Nadu",
];

const CHENNAI_LOCALITIES = [
  "Anna Nagar, Chennai",
  "T. Nagar, Chennai",
  "Adyar, Chennai",
  "Vadapalani, Chennai",
  "Thousand Lights, Chennai",
  "Park Town, Chennai",
  "Kilpauk, Chennai",
  "Royapettah, Chennai",
  "Guindy, Chennai",
  "Velachery, Chennai",
  "Perumbakkam / OMR, Chennai",
  "Manapakkam, Chennai",
  "Mogappair, Chennai",
  "Tambaram, Chennai",
];

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLocationName,
  isUsingGps,
  onSelectManualLocation,
  onRequestGpsLocation,
  isLocating,
}) => {
  const [searchInput, setSearchInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectManualLocation(searchInput.trim());
      setSearchInput("");
      onClose();
    }
  };

  const handleQuickSelect = (area: string) => {
    onSelectManualLocation(area);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Location in Tamil Nadu"
      subtitle="Discover hospitals across Chennai localities or major Tamil Nadu districts"
    >
      <div className="flex flex-col gap-5 pt-2">
        {/* GPS Quick Action */}
        <div className="bg-[#F0FDFA] border border-[#0D9488]/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Navigation className={`w-5 h-5 ${isLocating ? "animate-spin" : ""}`} />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-[#0F172A]">
                Use Exact Device GPS
              </h4>
              <p className="text-xs text-[#64748B]">
                {isUsingGps
                  ? "Currently active: " + currentLocationName
                  : "Detect coordinates within Tamil Nadu to calculate nearby distance"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              onRequestGpsLocation();
              onClose();
            }}
            disabled={isLocating}
            variant={isUsingGps ? "secondary" : "primary"}
            size="sm"
            className="shrink-0 font-bold rounded-xl"
          >
            <Navigation className="w-3.5 h-3.5 mr-1.5" />
            <span>{isLocating ? "Detecting..." : isUsingGps ? "Re-detect GPS" : "Detect GPS"}</span>
          </Button>
        </div>

        {/* Manual Location Search Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Search Tamil Nadu Area, City or Pincode
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-[#0D9488] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="e.g. Anna Nagar, Chennai or Madurai or 600003"
                className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
                autoFocus
              />
            </div>
            <Button type="submit" variant="primary" size="md" disabled={!searchInput.trim()} className="font-bold rounded-xl">
              <Search className="w-4 h-4 mr-1.5" />
              <span>Apply</span>
            </Button>
          </div>
        </form>

        {/* Tamil Nadu Districts */}
        <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
            <Building2 className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Tamil Nadu Districts</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {TAMIL_NADU_DISTRICTS.map((district) => {
              const isSelected = !isUsingGps && currentLocationName.toLowerCase().includes(district.toLowerCase().split(",")[0]);
              return (
                <button
                  key={district}
                  type="button"
                  onClick={() => handleQuickSelect(district)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#0D9488] text-white border-[#0D9488] shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-[#0D9488] hover:bg-[#F0FDFA]"
                  }`}
                >
                  <MapPin className={`w-3 h-3 ${isSelected ? "text-white" : "text-[#0D9488]"}`} />
                  <span>{district.replace(", Tamil Nadu", "")}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chennai Localities */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
            <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Chennai Localities (Primary Focus)</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
            {CHENNAI_LOCALITIES.map((area) => {
              const isSelected = !isUsingGps && currentLocationName.toLowerCase().includes(area.toLowerCase().split(",")[0]);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => handleQuickSelect(area)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-xl border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#0D9488] text-white border-[#0D9488] shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-[#0D9488] hover:bg-[#F0FDFA]"
                  }`}
                >
                  <span>{area.replace(", Chennai", "")}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
