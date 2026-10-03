'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  HeartPulse,
  ShieldAlert,
  Edit3,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Download,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Pill,
  Droplet,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  FileText,
  CreditCard,
  Building2,
  Briefcase,
  Users,
  X,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Allergy {
  id: string;
  name: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  notes: string;
}

interface ChronicCondition {
  id: string;
  condition: string;
  diagnosedYear: string;
  notes: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'emergency'>('personal');
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab 1 Personal Data
  const [personalDetails, setPersonalDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    height: '',
    weight: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergencyName: '',
    emergencyPhone: '',
    annualIncome: '',
    employmentStatus: '',
    familySize: '',
    rationCardType: '',
    disabilityStatus: '',
    pregnancyStatus: '',
  });

  // Tab 2 Medical Data
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [conditions, setConditions] = useState<ChronicCondition[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  // Item Add Forms
  const [newAllergy, setNewAllergy] = useState<Omit<Allergy, 'id'>>({ name: '', severity: 'Mild', notes: '' });
  const [newCondition, setNewCondition] = useState<Omit<ChronicCondition, 'id'>>({ condition: '', diagnosedYear: '', notes: '' });
  const [newMed, setNewMed] = useState<Omit<Medication, 'id'>>({ name: '', dosage: '', frequency: '', prescribedBy: '' });

  const [addingAllergy, setAddingAllergy] = useState(false);
  const [addingCondition, setAddingCondition] = useState(false);
  const [addingMed, setAddingMed] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [profRes, algRes, condRes, medRes] = await Promise.allSettled([
        api.get('/profile'),
        api.get('/profile/allergies'),
        api.get('/profile/conditions'),
        api.get('/profile/medications'),
      ]);

      if (profRes.status === 'fulfilled') {
        const p = profRes.value.data || {};
        setPersonalDetails({
          fullName: user?.fullName || p.emergencyContactName || '',
          email: user?.email || '',
          phone: user?.phone || '',
          dob: p.dateOfBirth || p.date_of_birth || '',
          gender: p.gender || '',
          bloodGroup: p.bloodGroup || p.blood_group || '',
          height: p.heightCm || p.height_cm ? String(p.heightCm || p.height_cm) : '',
          weight: p.weightKg || p.weight_kg ? String(p.weightKg || p.weight_kg) : '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          pincode: p.pincode || '',
          emergencyName: p.emergencyContactName || p.emergency_contact_name || '',
          emergencyPhone: p.emergencyContactPhone || p.emergency_contact_phone || '',
          annualIncome: p.annualIncome || p.annual_income ? String(p.annualIncome || p.annual_income) : '',
          employmentStatus: p.employmentStatus || p.employment_status || '',
          familySize: p.familySize || p.family_size ? String(p.familySize || p.family_size) : '',
          rationCardType: p.rationCardType || p.ration_card_type || '',
          disabilityStatus: p.disabilityStatus || p.disability_status || '',
          pregnancyStatus: p.pregnancyStatus || p.pregnancy_status || '',
        });
      }

      if (algRes.status === 'fulfilled') {
        const algs = Array.isArray(algRes.value.data) ? algRes.value.data : [];
        setAllergies(
          algs.map((a: any) => ({
            id: a.allergyId || a.allergy_id,
            name: a.allergyName || a.allergy_name,
            severity: a.severity || 'Mild',
            notes: a.notes || '',
          }))
        );
      }

      if (condRes.status === 'fulfilled') {
        const conds = Array.isArray(condRes.value.data) ? condRes.value.data : [];
        setConditions(
          conds.map((c: any) => ({
            id: c.conditionId || c.condition_id,
            condition: c.conditionName || c.condition_name,
            diagnosedYear: c.diagnosedYear || c.diagnosed_year ? String(c.diagnosedYear || c.diagnosed_year) : '',
            notes: c.notes || '',
          }))
        );
      }

      if (medRes.status === 'fulfilled') {
        const meds = Array.isArray(medRes.value.data) ? medRes.value.data : [];
        setMedications(
          meds.map((m: any) => ({
            id: m.medicationId || m.medication_id,
            name: m.medicineName || m.medicine_name,
            dosage: m.dosage || '',
            frequency: m.frequency || '',
            prescribedBy: m.prescribedBy || m.prescribed_by || '',
          }))
        );
      }
    } catch (err) {
      console.error('[Profile] Failed to fetch profile details:', err);
      setErrorMsg('Unable to retrieve complete profile information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  // SAVE PERSONAL PROFILE
  const handlePersonalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    try {
      const payload = {
        dateOfBirth: personalDetails.dob || null,
        gender: personalDetails.gender,
        bloodGroup: personalDetails.bloodGroup,
        heightCm: personalDetails.height ? parseFloat(personalDetails.height) : null,
        weightKg: personalDetails.weight ? parseFloat(personalDetails.weight) : null,
        address: personalDetails.address,
        city: personalDetails.city,
        state: personalDetails.state,
        pincode: personalDetails.pincode,
        emergencyContactName: personalDetails.emergencyName,
        emergencyContactPhone: personalDetails.emergencyPhone,
        annualIncome: personalDetails.annualIncome ? parseFloat(personalDetails.annualIncome) : null,
        employmentStatus: personalDetails.employmentStatus || null,
        familySize: personalDetails.familySize ? parseInt(personalDetails.familySize) : null,
        rationCardType: personalDetails.rationCardType || null,
        disabilityStatus: personalDetails.disabilityStatus || null,
        pregnancyStatus: personalDetails.pregnancyStatus || null,
      };

      await api.put('/profile', payload);
      setIsEditingPersonal(false);
      showToast('Patient personal details updated successfully!');
    } catch (err: any) {
      console.error('[Profile] Failed to save personal details:', err);
      showToast(err?.response?.data?.detail || 'Failed to update personal details.');
    } finally {
      setSavingPersonal(false);
    }
  };

  // ALLERGIES CRUD
  const handleAddAllergy = async () => {
    if (!newAllergy.name.trim()) return;
    setAddingAllergy(true);
    try {
      const res = await api.post('/profile/allergies', {
        allergyName: newAllergy.name.trim(),
        severity: newAllergy.severity,
        notes: newAllergy.notes || null,
      });
      const created = res.data;
      setAllergies((prev) => [
        ...prev,
        {
          id: created.allergyId || created.allergy_id,
          name: created.allergyName || created.allergy_name,
          severity: created.severity || 'Mild',
          notes: created.notes || '',
        },
      ]);
      setNewAllergy({ name: '', severity: 'Mild', notes: '' });
      showToast('Allergy recorded successfully.');
    } catch (err) {
      console.error('[Profile] Failed to add allergy:', err);
      showToast('Failed to record allergy.');
    } finally {
      setAddingAllergy(false);
    }
  };

  const handleDeleteAllergy = async (id: string) => {
    try {
      await api.delete(`/profile/allergies/${id}`);
      setAllergies((prev) => prev.filter((a) => a.id !== id));
      showToast('Allergy removed.');
    } catch (err) {
      console.error('[Profile] Failed to delete allergy:', err);
      showToast('Failed to remove allergy.');
    }
  };

  // CONDITIONS CRUD
  const handleAddCondition = async () => {
    if (!newCondition.condition.trim()) return;
    setAddingCondition(true);
    try {
      const res = await api.post('/profile/conditions', {
        conditionName: newCondition.condition.trim(),
        diagnosedYear: newCondition.diagnosedYear ? parseInt(newCondition.diagnosedYear, 10) : null,
        notes: newCondition.notes || null,
      });
      const created = res.data;
      setConditions((prev) => [
        ...prev,
        {
          id: created.conditionId || created.condition_id,
          condition: created.conditionName || created.condition_name,
          diagnosedYear: created.diagnosedYear ? String(created.diagnosedYear) : '',
          notes: created.notes || '',
        },
      ]);
      setNewCondition({ condition: '', diagnosedYear: '', notes: '' });
      showToast('Chronic condition recorded.');
    } catch (err) {
      console.error('[Profile] Failed to add condition:', err);
      showToast('Failed to record condition.');
    } finally {
      setAddingCondition(false);
    }
  };

  const handleDeleteCondition = async (id: string) => {
    try {
      await api.delete(`/profile/conditions/${id}`);
      setConditions((prev) => prev.filter((c) => c.id !== id));
      showToast('Chronic condition removed.');
    } catch (err) {
      console.error('[Profile] Failed to delete condition:', err);
      showToast('Failed to remove condition.');
    }
  };

  // MEDICATIONS CRUD
  const handleAddMedication = async () => {
    if (!newMed.name.trim()) return;
    setAddingMed(true);
    try {
      const res = await api.post('/profile/medications', {
        medicineName: newMed.name.trim(),
        dosage: newMed.dosage || null,
        frequency: newMed.frequency || null,
        prescribedBy: newMed.prescribedBy || null,
      });
      const created = res.data;
      setMedications((prev) => [
        ...prev,
        {
          id: created.medicationId || created.medication_id,
          name: created.medicineName || created.medicine_name,
          dosage: created.dosage || '',
          frequency: created.frequency || '',
          prescribedBy: created.prescribedBy || '',
        },
      ]);
      setNewMed({ name: '', dosage: '', frequency: '', prescribedBy: '' });
      showToast('Medication added.');
    } catch (err) {
      console.error('[Profile] Failed to add medication:', err);
      showToast('Failed to add medication.');
    } finally {
      setAddingMed(false);
    }
  };

  const handleDeleteMedication = async (id: string) => {
    try {
      await api.delete(`/profile/medications/${id}`);
      setMedications((prev) => prev.filter((m) => m.id !== id));
      showToast('Medication removed.');
    } catch (err) {
      console.error('[Profile] Failed to delete medication:', err);
      showToast('Failed to remove medication.');
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30 pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0D9488] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      {/* Modern Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D9488] to-[#14B8A6] text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                {(personalDetails.fullName || user?.fullName || 'PT')
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {personalDetails.fullName || user?.fullName || 'Patient Profile'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-bold">
                    {personalDetails.bloodGroup || 'Not specified'}
                  </span>
                  {personalDetails.dob && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {calculateAge(personalDetails.dob)} years old
                    </span>
                  )}
                  {personalDetails.city && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {personalDetails.city}, {personalDetails.state || ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('emergency')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-500/30 flex items-center gap-2 transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              Emergency ID
            </button>
          </div>

          {/* Modern Tab Navigation */}
          <div className="flex gap-2 mt-6 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
            {[
              { id: 'personal', label: 'Personal Info', icon: User },
              { id: 'medical', label: 'Medical History', icon: HeartPulse },
              { id: 'emergency', label: 'Emergency Contact', icon: ShieldAlert }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-[#0D9488] dark:text-[#14B8A6] shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#0D9488]" />
          <span className="text-sm text-slate-500">Loading profile...</span>
        </div>
      ) : errorMsg ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">Unable to Load Profile</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">{errorMsg}</p>
            <button
              onClick={fetchProfileData}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              {/* Personal Information Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Basic demographic details</p>
                      </div>
                    </div>
                    {!isEditingPersonal && (
                      <button
                        onClick={() => setIsEditingPersonal(true)}
                        className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {isEditingPersonal ? (
                    <form onSubmit={handlePersonalSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                          <input
                            type="text"
                            disabled
                            value={personalDetails.fullName}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                          <input
                            type="email"
                            disabled
                            value={personalDetails.email}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                          <input
                            type="tel"
                            disabled
                            value={personalDetails.phone}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date of Birth</label>
                          <input
                            type="date"
                            value={personalDetails.dob}
                            onChange={(e) => setPersonalDetails({ ...personalDetails, dob: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                          <select
                            value={personalDetails.gender}
                            onChange={(e) => setPersonalDetails({ ...personalDetails, gender: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Blood Group</label>
                          <select
                            value={personalDetails.bloodGroup}
                            onChange={(e) => setPersonalDetails({ ...personalDetails, bloodGroup: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-bold text-rose-600 focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Height (cm)</label>
                          <input
                            type="number"
                            value={personalDetails.height}
                            onChange={(e) => setPersonalDetails({ ...personalDetails, height: e.target.value })}
                            placeholder="e.g. 175"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Weight (kg)</label>
                          <input
                            type="number"
                            value={personalDetails.weight}
                            onChange={(e) => setPersonalDetails({ ...personalDetails, weight: e.target.value })}
                            placeholder="e.g. 70"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingPersonal(false);
                            fetchProfileData();
                          }}
                          className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingPersonal}
                          className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold shadow-md shadow-teal-500/30 flex items-center gap-2 disabled:opacity-50"
                        >
                          {savingPersonal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Full Name</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.fullName || 'Not set'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Email</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.email || 'Not set'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Phone</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.phone || 'Not set'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Age</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{calculateAge(personalDetails.dob) || 'Not set'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Gender</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.gender}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Blood Group</span>
                        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-1">{personalDetails.bloodGroup || 'Not set'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Height</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.height ? `${personalDetails.height} cm` : 'Not set'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Weight</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.weight ? `${personalDetails.weight} kg` : 'Not set'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-950/30 px-6 py-4 border-b border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Location Details</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Address and contact information</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {isEditingPersonal ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address</label>
                        <input
                          type="text"
                          value={personalDetails.address}
                          onChange={(e) => setPersonalDetails({ ...personalDetails, address: e.target.value })}
                          placeholder="Street address"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">City</label>
                        <input
                          type="text"
                          value={personalDetails.city}
                          onChange={(e) => setPersonalDetails({ ...personalDetails, city: e.target.value })}
                          placeholder="e.g. Chennai"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">State</label>
                        <input
                          type="text"
                          value={personalDetails.state}
                          onChange={(e) => setPersonalDetails({ ...personalDetails, state: e.target.value })}
                          placeholder="e.g. Tamil Nadu"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#D9488] focus:border-[#0D9488]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PIN Code</label>
                        <input
                          type="text"
                          value={personalDetails.pincode}
                          onChange={(e) => setPersonalDetails({ ...personalDetails, pincode: e.target.value })}
                          placeholder="e.g. 600006"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#D9488] focus:border-[#0D9488]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-4">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">Address</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.address || 'Not set'}</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-4">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">City</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.city || 'Not set'}</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-4">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">State</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.state || 'Not set'}</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-4">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">PIN Code</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.pincode || 'Not set'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Government Scheme Eligibility Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-950/30 px-6 py-4 border-b border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Government Scheme Eligibility</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Information for scheme eligibility checks</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {isEditingPersonal ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Annual Income (₹)</label>
                        <input
                          type="number"
                          value={personalDetails.annualIncome}
                          onChange={(e) => setPersonalDetails({ ...personalDetails, annualIncome: e.target.value })}
                          placeholder="e.g. 500000"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Employment Status</label>
                        <input
                          type="text"
                          value={personalDetails.employmentStatus}
                          onChange={(e) => setPersonalDetails({ ...personalDetails, employmentStatus: e.target.value })}
                          placeholder="e.g. Software Engineer"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Family Size</label>
                        <input
                          type="number"
                          value={personalDetails.familySize}
                          onChange={(e) => setPersonalDetails({ ...personalDetails, familySize: e.target.value })}
                          placeholder="e.g. 4"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ration Card Type</label>
                        <select
                          value={personalDetails.rationCardType}
                          onChange={(e) => setPersonalDetails({ ...personalDetails, rationCardType: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                        >
                          <option value="">Select</option>
                          <option value="BPL">Below Poverty Line (BPL)</option>
                          <option value="APL">Above Poverty Line (APL)</option>
                          <option value="Antyodaya">Antyodaya Anna Yojana</option>
                          <option value="None">None</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Disability Status</label>
                        <select
                          value={personalDetails.disabilityStatus}
                          onChange={(e) => setPersonalDetails({ ...personalDetails, disabilityStatus: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                        >
                          <option value="">Select</option>
                          <option value="No">No Disability</option>
                          <option value="Yes">Yes, I have a disability</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pregnancy Status</label>
                        <select
                          value={personalDetails.pregnancyStatus}
                          onChange={(e) => setPersonalDetails({ ...personalDetails, pregnancyStatus: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                        >
                          <option value="">Select</option>
                          <option value="Not Applicable">Not Applicable</option>
                          <option value="First Trimester">First Trimester</option>
                          <option value="Second Trimester">Second Trimester</option>
                          <option value="Third Trimester">Third Trimester</option>
                          <option value="Postpartum">Postpartum</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-2xl p-4">
                        <span className="text-xs text-purple-600 dark:text-purple-400">Annual Income</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.annualIncome ? `₹${personalDetails.annualIncome}` : 'Not set'}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-2xl p-4">
                        <span className="text-xs text-purple-600 dark:text-purple-400">Employment Status</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.employmentStatus || 'Not set'}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-2xl p-4">
                        <span className="text-xs text-purple-600 dark:text-purple-400">Family Size</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.familySize ? `${personalDetails.familySize} members` : 'Not set'}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-2xl p-4">
                        <span className="text-xs text-purple-600 dark:text-purple-400">Ration Card Type</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.rationCardType || 'Not set'}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-2xl p-4">
                        <span className="text-xs text-purple-600 dark:text-purple-400">Disability</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.disabilityStatus || 'Not set'}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-2xl p-4">
                        <span className="text-xs text-purple-600 dark:text-purple-400">Pregnancy Status</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.pregnancyStatus || 'Not set'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-950/30 px-6 py-4 border-b border-rose-200 dark:border-rose-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Emergency Contact</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Primary emergency contact person</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {isEditingPersonal ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contact Person Name</label>
                        <input
                          type="text"
                          value={personalDetails.emergencyName}
                          onChange={(e) => setPersonalDetails({ ...personalDetails, emergencyName: e.target.value })}
                          placeholder="e.g. Spouse / Parent"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Emergency Phone</label>
                        <input
                          type="tel"
                          value={personalDetails.emergencyPhone}
                          onChange={(e) => setPersonalDetails({ ...personalDetails, emergencyPhone: e.target.value })}
                          placeholder="e.g. 9876543210"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-rose-50 dark:bg-rose-900/30 rounded-2xl p-4">
                        <span className="text-xs text-rose-600 dark:text-rose-400">Contact Name</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.emergencyName || 'Not set'}</p>
                      </div>
                      <div className="bg-rose-50 dark:bg-rose-900/30 rounded-2xl p-4">
                        <span className="text-xs text-rose-600 dark:text-rose-400">Emergency Phone</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{personalDetails.emergencyPhone || 'Not set'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEDICAL HISTORY */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              {/* Allergies Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-950/30 px-6 py-4 border-b border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Allergies & Sensitivities</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{allergies.length} recorded</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNewAllergy({ name: '', severity: 'Mild', notes: '' })}
                      className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {allergies.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                      No allergies recorded
                    </div>
                  ) : (
                    allergies.map((allergy) => (
                      <div key={allergy.id} className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            allergy.severity === 'Severe' ? 'bg-rose-500' :
                            allergy.severity === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{allergy.name}</p>
                            {allergy.notes && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">{allergy.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            allergy.severity === 'Severe' ? 'bg-rose-100 text-rose-700' :
                            allergy.severity === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {allergy.severity}
                          </span>
                          <button
                            onClick={() => handleDeleteAllergy(allergy.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add Allergy Form */}
                  {newAllergy.name && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                      <input
                        type="text"
                        placeholder="Allergy name"
                        value={newAllergy.name}
                        onChange={(e) => setNewAllergy({ ...newAllergy, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                      />
                      <div className="flex gap-2">
                        <select
                          value={newAllergy.severity}
                          onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value as any })}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                        >
                          <option value="Mild">Mild</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Severe">Severe</option>
                        </select>
                        <button
                          onClick={handleAddAllergy}
                          disabled={addingAllergy}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                        >
                          {addingAllergy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Add
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={newAllergy.notes}
                        onChange={(e) => setNewAllergy({ ...newAllergy, notes: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Chronic Conditions Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/30 px-6 py-4 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chronic Conditions</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{conditions.length} recorded</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNewCondition({ condition: '', diagnosedYear: '', notes: '' })}
                      className="p-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {conditions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                      No chronic conditions recorded
                    </div>
                  ) : (
                    conditions.map((condition) => (
                      <div key={condition.id} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{condition.condition}</p>
                            {condition.diagnosedYear && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">Diagnosed: {condition.diagnosedYear}</p>
                            )}
                            {condition.notes && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">{condition.notes}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCondition(condition.id)}
                          className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}

                  {/* Add Condition Form */}
                  {newCondition.condition && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                      <input
                        type="text"
                        placeholder="Condition name"
                        value={newCondition.condition}
                        onChange={(e) => setNewCondition({ ...newCondition, condition: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Year diagnosed"
                          value={newCondition.diagnosedYear}
                          onChange={(e) => setNewCondition({ ...newCondition, diagnosedYear: e.target.value })}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                        />
                        <button
                          onClick={handleAddCondition}
                          disabled={addingCondition}
                          className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                        >
                          {addingCondition ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Add
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={newCondition.notes}
                        onChange={(e) => setNewCondition({ ...newCondition, notes: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Medications Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-950/30 px-6 py-4 border-b border-teal-200 dark:border-teal-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Current Medications</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{medications.length} recorded</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNewMed({ name: '', dosage: '', frequency: '', prescribedBy: '' })}
                      className="p-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {medications.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                      No medications recorded
                    </div>
                  ) : (
                    medications.map((med) => (
                      <div key={med.id} className="flex items-center justify-between bg-teal-50 dark:bg-teal-900/30 rounded-xl p-4 border border-teal-200 dark:border-teal-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-200 dark:bg-teal-800 flex items-center justify-center">
                            <Pill className="w-4 h-4 text-teal-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{med.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {med.dosage && `${med.dosage} • `}
                              {med.frequency && `${med.frequency}`}
                            </p>
                            {med.prescribedBy && (
                              <p className="text-xs text-slate-400 dark:text-slate-500">By: {med.prescribedBy}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMedication(med.id)}
                          className="p-1.5 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 text-teal-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}

                  {/* Add Medication Form */}
                  {newMed.name && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                      <input
                        type="text"
                        placeholder="Medicine name"
                        value={newMed.name}
                        onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#D9488] focus:border-[#D9488]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 500mg)"
                          value={newMed.dosage}
                          onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#D9488] focus:border-[0D9488]"
                        />
                        <input
                          type="text"
                          placeholder="Frequency (e.g. twice daily)"
                          value={newMed.frequency}
                          onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#D9488] focus:border-[0D9488]"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Prescribed by (optional)"
                        value={newMed.prescribedBy}
                        onChange={(e) => setNewMed({ ...newMed, prescribedBy: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#D9488] focus:border-[0D9488]"
                      />
                      <button
                        onClick={handleAddMedication}
                        disabled={addingMed}
                        className="w-full px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {addingMed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add Medication
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMERGENCY CONTACT */}
          {activeTab === 'emergency' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-8 text-center">
                  <ShieldAlert className="w-12 h-12 text-white mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-white">Emergency ID Card</h2>
                  <p className="text-sm text-rose-100">Keep this accessible in case of emergency</p>
                </div>

                <div className="p-8 space-y-6">
                  {/* Patient Info */}
                  <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-6 border border-rose-200 dark:border-rose-800">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-rose-600">
                        {(personalDetails.fullName || user?.fullName || 'PT')
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{personalDetails.fullName || user?.fullName || 'Patient'}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{personalDetails.email || user?.email || ''}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Blood Group</span>
                        <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{personalDetails.bloodGroup || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Age</span>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{calculateAge(personalDetails.dob) || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Gender</span>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{personalDetails.gender || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Phone</span>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{personalDetails.phone || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-rose-600" />
                      Emergency Contact
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Contact Person</span>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{personalDetails.emergencyName || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Emergency Phone</span>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{personalDetails.emergencyPhone || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Alerts */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      Medical Alerts
                    </h3>
                    <div className="space-y-2">
                      {allergies.length > 0 && (
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Allergies:</span>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{allergies.map(a => a.name).join(', ')}</p>
                        </div>
                      )}
                      {conditions.length > 0 && (
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Conditions:</span>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{conditions.map(c => c.condition).join(', ')}</p>
                        </div>
                      )}
                      {medications.length > 0 && (
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Medications:</span>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{medications.map(m => m.name).join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Emergency Numbers */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-emerald-600" />
                      Emergency Numbers
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Ambulance</span>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">108</p>
                      </div>
                      <div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Police</span>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">100</p>
                      </div>
                      <div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Women's Helpline</span>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">181</p>
                      </div>
                      <div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Health Ministry</span>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">1077</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
