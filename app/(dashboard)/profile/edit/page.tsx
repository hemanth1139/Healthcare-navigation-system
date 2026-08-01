"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PersonalDetailsForm } from "@/components/profile/PersonalDetailsForm";
import { PatientProfile } from "@/types/profile";
import { profileApi } from "@/lib/mockProfileData";

export default function EditProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileApi.getRecord();
        setProfile(data.profile);
      } catch (err) {
        console.error("Failed to load profile for editing", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header & Back link */}
      <div className="flex flex-col gap-2">
        <Link
          href="/profile"
          className="inline-flex items-center text-xs font-semibold text-[#0F6E7A] hover:underline focus-ring rounded p-1 -ml-1 gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Profile Overview
        </Link>

        <h1 className="font-heading text-2xl font-bold text-[#1E2A2E]">
          Edit Personal & Medical Details
        </h1>
        <p className="text-xs sm:text-sm text-[#5C6B6E]">
          Update physical parameters, residential address, and primary emergency contact.
        </p>
      </div>

      {loading || !profile ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3 min-h-[300px]">
          <Spinner size="lg" color="primary" />
          <span className="text-xs text-[#5C6B6E]">Loading profile editor...</span>
        </div>
      ) : (
        <Card className="p-6 sm:p-8">
          <PersonalDetailsForm initialData={profile} />
        </Card>
      )}
    </div>
  );
}
