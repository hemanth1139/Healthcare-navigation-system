"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FullPatientRecord } from "@/types/profile";
import { profileApi } from "@/lib/mockProfileData";
import { ProfileCompletenessBar } from "@/components/profile/ProfileCompletenessBar";
import { EmergencyContactCard } from "@/components/profile/EmergencyContactCard";
import { AllergyList } from "@/components/profile/AllergyList";
import { ChronicConditionList } from "@/components/profile/ChronicConditionList";
import { MedicationList } from "@/components/profile/MedicationList";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import {
  User,
  Edit,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Pill,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Ruler,
  Weight,
} from "lucide-react";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const toastParam = searchParams.get("toast");

  const [record, setRecord] = useState<FullPatientRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<boolean>(toastParam === "updated");

  // Tab state for desktop
  const [activeTab, setActiveTab] = useState<"details" | "allergies" | "conditions" | "medications">(
    "details"
  );

  // Accordion state for mobile (multiple or single open)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    details: true,
    allergies: true,
    conditions: false,
    medications: false,
  });

  const loadRecord = async () => {
    try {
      const data = await profileApi.getRecord();
      setRecord(data);
    } catch (err) {
      console.error("Failed to load profile record", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
  }, []);

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading || !record) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 min-h-[400px]">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-[#5C6B6E]">Loading patient clinical profile...</span>
      </div>
    );
  }

  const { profile, allergies, chronicConditions, medications } = record;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Toast Banner */}
      {showToast && (
        <Toast
          type="success"
          title="Profile Saved"
          message="Your personal health details have been updated."
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6F4F3] pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E2A2E]">
            Patient Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B6E]">
            Comprehensive health record, allergies, chronic conditions, and emergency contacts
          </p>
        </div>

        <Link href="/profile/edit">
          <Button variant="primary" size="md">
            <Edit className="w-4 h-4 mr-2" />
            Edit Personal Details
          </Button>
        </Link>
      </div>

      {/* Profile Completeness Bar (<100%) */}
      <ProfileCompletenessBar record={record} />

      {/* Emergency Contact Card (Pinned near top) */}
      <EmergencyContactCard
        name={profile.emergency_contact_name}
        phone={profile.emergency_contact_phone}
      />

      {/* Desktop Tabs Header (md+) */}
      <div className="hidden md:flex items-center gap-2 border-b border-[#E6F4F3]">
        <button
          onClick={() => setActiveTab("details")}
          type="button"
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "details"
              ? "border-[#0F6E7A] text-[#0F6E7A] bg-[#E6F4F3]/50 rounded-t-xl"
              : "border-transparent text-[#5C6B6E] hover:text-[#1E2A2E]"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Details</span>
        </button>

        <button
          onClick={() => setActiveTab("allergies")}
          type="button"
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "allergies"
              ? "border-[#0F6E7A] text-[#0F6E7A] bg-[#E6F4F3]/50 rounded-t-xl"
              : "border-transparent text-[#5C6B6E] hover:text-[#1E2A2E]"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Allergies ({allergies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("conditions")}
          type="button"
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "conditions"
              ? "border-[#0F6E7A] text-[#0F6E7A] bg-[#E6F4F3]/50 rounded-t-xl"
              : "border-transparent text-[#5C6B6E] hover:text-[#1E2A2E]"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Chronic Conditions ({chronicConditions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("medications")}
          type="button"
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "medications"
              ? "border-[#0F6E7A] text-[#0F6E7A] bg-[#E6F4F3]/50 rounded-t-xl"
              : "border-transparent text-[#5C6B6E] hover:text-[#1E2A2E]"
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Medications ({medications.length})</span>
        </button>
      </div>

      {/* Desktop Tab Content (md+) */}
      <div className="hidden md:block">
        {activeTab === "details" && (
          <Card className="p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#E6F4F3] pb-4">
              <h3 className="font-heading font-bold text-lg text-[#1E2A2E]">
                Personal & Physical Parameters
              </h3>
              <Link href="/profile/edit">
                <Button variant="secondary" size="sm">
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  Edit Parameters
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E6F4F3]">
                <span className="text-xs text-[#5C6B6E] flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0F6E7A]" /> Date of Birth
                </span>
                <span className="text-sm font-semibold text-[#1E2A2E]">
                  {profile.date_of_birth || "Not specified"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E6F4F3]">
                <span className="text-xs text-[#5C6B6E] flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-[#0F6E7A]" /> Gender
                </span>
                <span className="text-sm font-semibold text-[#1E2A2E]">
                  {profile.gender || "Not specified"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E6F4F3]">
                <span className="text-xs text-[#5C6B6E] flex items-center gap-1 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F6E7A]" /> Blood Group
                </span>
                <span className="text-sm font-mono font-bold text-[#0F6E7A] bg-[#E6F4F3] px-2 py-0.5 rounded-md inline-block">
                  {profile.blood_group || "Unknown"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E6F4F3]">
                <span className="text-xs text-[#5C6B6E] flex items-center gap-1 mb-1">
                  <Ruler className="w-3.5 h-3.5 text-[#0F6E7A]" /> Height & Weight
                </span>
                <span className="text-sm font-semibold text-[#1E2A2E]">
                  {profile.height_cm ? `${profile.height_cm} cm` : "--"} /{" "}
                  {profile.weight_kg ? `${profile.weight_kg} kg` : "--"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E6F4F3] flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#0F6E7A] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[#5C6B6E]">Residential Address</span>
                <span className="text-sm font-medium text-[#1E2A2E]">
                  {profile.address
                    ? `${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`
                    : "No address recorded."}
                </span>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "allergies" && (
          <Card className="p-6">
            <AllergyList allergies={allergies} onRefresh={loadRecord} />
          </Card>
        )}

        {activeTab === "conditions" && (
          <Card className="p-6">
            <ChronicConditionList conditions={chronicConditions} onRefresh={loadRecord} />
          </Card>
        )}

        {activeTab === "medications" && (
          <Card className="p-6">
            <MedicationList medications={medications} onRefresh={loadRecord} />
          </Card>
        )}
      </div>

      {/* Mobile Stacked Accordions (sm and below) */}
      <div className="md:hidden flex flex-col gap-4">
        {/* Accordion 1: Personal Details */}
        <Card className="p-4">
          <button
            onClick={() => toggleAccordion("details")}
            type="button"
            className="w-full flex items-center justify-between font-heading font-bold text-base text-[#1E2A2E]"
          >
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#0F6E7A]" />
              <span>Personal Details</span>
            </div>
            {openAccordions.details ? <ChevronUp className="w-5 h-5 text-[#5C6B6E]" /> : <ChevronDown className="w-5 h-5 text-[#5C6B6E]" />}
          </button>

          {openAccordions.details && (
            <div className="mt-4 pt-4 border-t border-[#E6F4F3] flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#5C6B6E]">DOB:</span>{" "}
                  <span className="font-semibold">{profile.date_of_birth || "--"}</span>
                </div>
                <div>
                  <span className="text-[#5C6B6E]">Blood:</span>{" "}
                  <span className="font-bold text-[#0F6E7A] font-mono">{profile.blood_group || "--"}</span>
                </div>
                <div>
                  <span className="text-[#5C6B6E]">Height:</span>{" "}
                  <span className="font-semibold">{profile.height_cm ? `${profile.height_cm}cm` : "--"}</span>
                </div>
                <div>
                  <span className="text-[#5C6B6E]">Weight:</span>{" "}
                  <span className="font-semibold">{profile.weight_kg ? `${profile.weight_kg}kg` : "--"}</span>
                </div>
              </div>

              <div className="text-xs pt-2 border-t border-[#E6F4F3]">
                <span className="text-[#5C6B6E] block">Address:</span>
                <span className="font-medium text-[#1E2A2E]">
                  {profile.address ? `${profile.address}, ${profile.city}` : "Not specified"}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Accordion 2: Allergies */}
        <Card className="p-4">
          <button
            onClick={() => toggleAccordion("allergies")}
            type="button"
            className="w-full flex items-center justify-between font-heading font-bold text-base text-[#1E2A2E]"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#0F6E7A]" />
              <span>Allergies ({allergies.length})</span>
            </div>
            {openAccordions.allergies ? <ChevronUp className="w-5 h-5 text-[#5C6B6E]" /> : <ChevronDown className="w-5 h-5 text-[#5C6B6E]" />}
          </button>

          {openAccordions.allergies && (
            <div className="mt-4 pt-4 border-t border-[#E6F4F3]">
              <AllergyList allergies={allergies} onRefresh={loadRecord} />
            </div>
          )}
        </Card>

        {/* Accordion 3: Chronic Conditions */}
        <Card className="p-4">
          <button
            onClick={() => toggleAccordion("conditions")}
            type="button"
            className="w-full flex items-center justify-between font-heading font-bold text-base text-[#1E2A2E]"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#0F6E7A]" />
              <span>Chronic Conditions ({chronicConditions.length})</span>
            </div>
            {openAccordions.conditions ? <ChevronUp className="w-5 h-5 text-[#5C6B6E]" /> : <ChevronDown className="w-5 h-5 text-[#5C6B6E]" />}
          </button>

          {openAccordions.conditions && (
            <div className="mt-4 pt-4 border-t border-[#E6F4F3]">
              <ChronicConditionList conditions={chronicConditions} onRefresh={loadRecord} />
            </div>
          )}
        </Card>

        {/* Accordion 4: Medications */}
        <Card className="p-4">
          <button
            onClick={() => toggleAccordion("medications")}
            type="button"
            className="w-full flex items-center justify-between font-heading font-bold text-base text-[#1E2A2E]"
          >
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-[#0F6E7A]" />
              <span>Medications ({medications.length})</span>
            </div>
            {openAccordions.medications ? <ChevronUp className="w-5 h-5 text-[#5C6B6E]" /> : <ChevronDown className="w-5 h-5 text-[#5C6B6E]" />}
          </button>

          {openAccordions.medications && (
            <div className="mt-4 pt-4 border-t border-[#E6F4F3]">
              <MedicationList medications={medications} onRefresh={loadRecord} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
