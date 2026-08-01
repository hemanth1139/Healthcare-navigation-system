"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Spinner } from "@/components/ui/Spinner";
import { HeartPulse } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // Full-page branded loading state while resolving auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7FAFA] p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0F6E7A] text-white flex items-center justify-center shadow-clinical-lg animate-pulse mb-4">
          <HeartPulse className="w-8 h-8 stroke-[2.5]" />
        </div>
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-sm font-semibold text-[#1E2A2E]">
          Loading HealthCare Navigator...
        </p>
        <span className="text-xs text-[#5C6B6E] mt-1">Verifying clinical credentials</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7FAFA] flex flex-col md:flex-row text-[#1E2A2E]">
      {/* Desktop Sidebar (md+) */}
      <Sidebar />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Sticky Top Navbar */}
        <Navbar onOpenMobileNav={() => setMobileNavOpen(true)} />

        {/* Mobile Navigation Drawer & Bottom Bar */}
        <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        {/* Independent Scrollable Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
