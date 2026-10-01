"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, User, Ruler, Weight, MapPin, Phone, ShieldAlert, Save, X, Briefcase, IndianRupee, Users, Accessibility, Baby } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PatientProfile } from "@/types/profile";
import { profileApi } from "@/lib/mockProfileData";

const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
const pincodeRegex = /^\d{6}$/;

const profileSchema = z.object({
  patient_name: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"] as const).optional(),
  blood_group: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"] as const).optional(),
  height_cm: z
    .number()
    .min(30, "Height must be at least 30 cm")
    .max(250, "Height cannot exceed 250 cm")
    .optional(),
  weight_kg: z
    .number()
    .min(1, "Weight must be at least 1 kg")
    .max(300, "Weight cannot exceed 300 kg")
    .optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z
    .string()
    .optional()
    .refine((val) => !val || pincodeRegex.test(val), "Pincode must be exactly 6 digits"),
  annual_income: z
    .number()
    .min(0, "Income cannot be negative")
    .optional(),
  employment_status: z.enum(["Government Employee", "Private Sector Employee", "Self-Employed", "Unemployed/Homemaker", "Retired/Pensioner", "Student"] as const).optional(),
  family_size: z
    .number()
    .min(1, "Family size must be at least 1")
    .max(20, "Family size cannot exceed 20")
    .optional(),
  ration_card_type: z.enum(["BPL", "APL", "None"] as const).optional(),
  disability_status: z.enum(["Yes", "No"] as const).optional(),
  pregnancy_status: z.enum(["Yes", "No"] as const).optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z
    .string()
    .optional()
    .refine((val) => !val || phoneRegex.test(val.replace(/\s+/g, "")), "Invalid phone format"),
});

export type PersonalDetailsFormData = z.infer<typeof profileSchema>;

export const PersonalDetailsForm: React.FC<{
  initialData: PatientProfile;
  onSuccess?: () => void;
}> = ({ initialData, onSuccess }) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      patient_name: initialData.patient_name || "",
      date_of_birth: initialData.date_of_birth || "",
      gender: initialData.gender || "Male",
      blood_group: initialData.blood_group || "Unknown",
      height_cm: initialData.height_cm || undefined,
      weight_kg: initialData.weight_kg || undefined,
      address: initialData.address || "",
      city: initialData.city || "",
      state: initialData.state || "",
      pincode: initialData.pincode || "",
      annual_income: initialData.annual_income || undefined,
      employment_status: initialData.employment_status || "Private Sector Employee",
      family_size: initialData.family_size || undefined,
      ration_card_type: initialData.ration_card_type || "None",
      disability_status: initialData.disability_status || "No",
      pregnancy_status: initialData.pregnancy_status || "No",
      emergency_contact_name: initialData.emergency_contact_name || "",
      emergency_contact_phone: initialData.emergency_contact_phone || "",
    },
  });

  const gender = watch("gender");

  const onSubmit = async (data: PersonalDetailsFormData) => {
    try {
      await profileApi.updateProfile(data);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/profile?toast=updated");
      }
    } catch (err) {
      alert("Failed to update profile. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {/* 1. Basic Health & Physical Parameters */}
      <div className="flex flex-col gap-4 border-b border-[#F0FDFA] pb-6">
        <h3 className="font-heading font-bold text-base text-[#0F172A]">
          Basic Personal Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Patient Full Name"
            type="text"
            placeholder="e.g. Dr. Sarah Jenkins"
            leftIcon={<User className="w-4 h-4" />}
            error={errors.patient_name?.message}
            {...register("patient_name")}
          />

          <Input
            label="Date of Birth"
            type="date"
            leftIcon={<Calendar className="w-4 h-4" />}
            error={errors.date_of_birth?.message}
            {...register("date_of_birth")}
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-[#0F172A]">Gender</label>
            <select
              className="w-full font-body text-sm text-[#0F172A] bg-white border border-[#F0FDFA] rounded-xl px-3.5 py-2.5 focus-ring"
              {...register("gender")}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-[#0F172A]">Blood Group</label>
            <select
              className="w-full font-body text-sm text-[#0F172A] bg-white border border-[#F0FDFA] rounded-xl px-3.5 py-2.5 focus-ring"
              {...register("blood_group")}
            >
              <option value="Unknown">Unknown</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <Input
            label="Height (cm)"
            type="number"
            placeholder="e.g. 170"
            leftIcon={<Ruler className="w-4 h-4" />}
            error={errors.height_cm?.message}
            {...register("height_cm", { valueAsNumber: true })}
          />

          <Input
            label="Weight (kg)"
            type="number"
            placeholder="e.g. 68"
            leftIcon={<Weight className="w-4 h-4" />}
            error={errors.weight_kg?.message}
            {...register("weight_kg", { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* 2. Address Details */}
      <div className="flex flex-col gap-4 border-b border-[#F0FDFA] pb-6">
        <h3 className="font-heading font-bold text-base text-[#0F172A]">
          Residential Address
        </h3>

        <Input
          label="Street Address"
          type="text"
          placeholder="Building, Flat, Street address"
          leftIcon={<MapPin className="w-4 h-4" />}
          error={errors.address?.message}
          {...register("address")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="City"
            type="text"
            placeholder="e.g. Kolkata"
            error={errors.city?.message}
            {...register("city")}
          />

          <Input
            label="State"
            type="text"
            placeholder="e.g. West Bengal"
            error={errors.state?.message}
            {...register("state")}
          />

          <Input
            label="Pincode"
            type="text"
            placeholder="6 digits"
            error={errors.pincode?.message}
            {...register("pincode")}
          />
        </div>
      </div>

      {/* 3. Socio-Economic Information */}
      <div className="flex flex-col gap-4 border-b border-[#F0FDFA] pb-6">
        <h3 className="font-heading font-bold text-base text-[#0F172A]">
          Socio-Economic Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Annual Household Income (₹)"
            type="number"
            placeholder="e.g. 500000"
            leftIcon={<IndianRupee className="w-4 h-4" />}
            error={errors.annual_income?.message}
            {...register("annual_income", { valueAsNumber: true })}
          />

          <Input
            label="Family Size"
            type="number"
            placeholder="Number of family members"
            leftIcon={<Users className="w-4 h-4" />}
            error={errors.family_size?.message}
            {...register("family_size", { valueAsNumber: true })}
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-[#0F172A]">Employment Status</label>
            <select
              className="w-full font-body text-sm text-[#0F172A] bg-white border border-[#F0FDFA] rounded-xl px-3.5 py-2.5 focus-ring"
              {...register("employment_status")}
            >
              <option value="Government Employee">Government Employee</option>
              <option value="Private Sector Employee">Private Sector Employee</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Unemployed/Homemaker">Unemployed/Homemaker</option>
              <option value="Retired/Pensioner">Retired/Pensioner</option>
              <option value="Student">Student</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-[#0F172A]">Ration Card Type</label>
            <select
              className="w-full font-body text-sm text-[#0F172A] bg-white border border-[#F0FDFA] rounded-xl px-3.5 py-2.5 focus-ring"
              {...register("ration_card_type")}
            >
              <option value="None">None</option>
              <option value="BPL">BPL (Below Poverty Line)</option>
              <option value="APL">APL (Above Poverty Line)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-[#0F172A]">Disability Status</label>
            <select
              className="w-full font-body text-sm text-[#0F172A] bg-white border border-[#F0FDFA] rounded-xl px-3.5 py-2.5 focus-ring"
              {...register("disability_status")}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
            <p className="text-xs text-[#64748B]">Required for Niramaya scheme eligibility</p>
          </div>

          {gender === "Female" && (
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-[#0F172A]">Pregnancy Status</label>
              <select
                className="w-full font-body text-sm text-[#0F172A] bg-white border border-[#F0FDFA] rounded-xl px-3.5 py-2.5 focus-ring"
                {...register("pregnancy_status")}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              <p className="text-xs text-[#64748B]">Required for maternity scheme eligibility</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Emergency Contact Sub-section */}
      <div id="emergency-contact" className="flex flex-col gap-4 bg-[#F0FDFA]/40 p-4 sm:p-5 rounded-2xl border border-[#0D9488]/20">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#0D9488]" />
          <h3 className="font-heading font-bold text-base text-[#0F172A]">
            Emergency Contact Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contact Full Name & Relationship"
            type="text"
            placeholder="e.g. John Doe (Spouse)"
            leftIcon={<User className="w-4 h-4" />}
            error={errors.emergency_contact_name?.message}
            {...register("emergency_contact_name")}
          />

          <Input
            label="Emergency Contact Phone"
            type="tel"
            placeholder="+91 98300 00000"
            leftIcon={<Phone className="w-4 h-4" />}
            error={errors.emergency_contact_phone?.message}
            {...register("emergency_contact_phone")}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-2">
        <Link href="/profile">
          <Button variant="ghost" size="md">
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>
        </Link>

        <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
          <Save className="w-4 h-4 mr-1.5" />
          Save Personal Details
        </Button>
      </div>
    </form>
  );
};
