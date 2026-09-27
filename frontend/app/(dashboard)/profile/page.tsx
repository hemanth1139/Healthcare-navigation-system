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
  Check, 
  Download, 
  Printer, 
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
    gender: 'Male',
    bloodGroup: 'O+',
    height: '',
    weight: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergencyName: '',
    emergencyPhone: ''
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
          gender: p.gender || 'Male',
          bloodGroup: p.bloodGroup || p.blood_group || 'O+',
          height: p.heightCm || p.height_cm ? String(p.heightCm || p.height_cm) : '',
          weight: p.weightKg || p.weight_kg ? String(p.weightKg || p.weight_kg) : '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          pincode: p.pincode || '',
          emergencyName: p.emergencyContactName || p.emergency_contact_name || '',
          emergencyPhone: p.emergencyContactPhone || p.emergency_contact_phone || '',
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

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0D9488] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0D9488] to-[#14B8A6] text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-md">
              {(personalDetails.fullName || user?.fullName || 'PT')
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                {personalDetails.fullName || user?.fullName || 'Patient Profile'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Blood Group: <span className="font-bold text-rose-600 dark:text-rose-400">{personalDetails.bloodGroup || 'Not specified'}</span>
                {personalDetails.dob && ` • DOB: ${personalDetails.dob}`}
                {personalDetails.city && ` • ${personalDetails.city}, ${personalDetails.state || ''}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('emergency')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              Emergency ID Card
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mt-8 pt-2 overflow-x-auto">
          {[
            { id: 'personal', label: 'Personal Details', icon: User },
            { id: 'medical', label: `Medical History (${allergies.length + conditions.length + medications.length})`, icon: HeartPulse },
            { id: 'emergency', label: 'Emergency Info & ID', icon: ShieldAlert }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-[#0D9488] text-[#0D9488] dark:text-[#14B8A6]'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3 min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
          <span className="text-xs text-slate-500">Loading patient profile data...</span>
        </div>
      ) : errorMsg ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Unable to Load Profile</h3>
          <p className="text-xs text-slate-500">{errorMsg}</p>
          <button
            onClick={fetchProfileData}
            className="px-4 py-2 bg-[#0D9488] text-white text-xs font-semibold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: PERSONAL DETAILS                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'personal' && (
            <form onSubmit={handlePersonalSave} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Personal & Biological Demographics</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Used strictly to evaluate clinical symptoms and calculate scheme eligibility</p>
                </div>
                {!isEditingPersonal ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingPersonal(true)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Details
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPersonal(false);
                        fetchProfileData();
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingPersonal}
                      className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      {savingPersonal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={personalDetails.fullName}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={personalDetails.email}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    disabled
                    value={personalDetails.phone}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                  <input
                    type="date"
                    disabled={!isEditingPersonal}
                    value={personalDetails.dob}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, dob: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Gender</label>
                  <select
                    disabled={!isEditingPersonal}
                    value={personalDetails.gender}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, gender: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0D9488]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Blood Group</label>
                  <select
                    disabled={!isEditingPersonal}
                    value={personalDetails.bloodGroup}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, bloodGroup: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold text-rose-600 focus:ring-2 focus:ring-[#0D9488]"
                  >
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
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Height (cm)</label>
                  <input
                    type="number"
                    disabled={!isEditingPersonal}
                    value={personalDetails.height}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, height: e.target.value })}
                    placeholder="e.g. 175"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Weight (kg)</label>
                  <input
                    type="number"
                    disabled={!isEditingPersonal}
                    value={personalDetails.weight}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, weight: e.target.value })}
                    placeholder="e.g. 70"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">City</label>
                  <input
                    type="text"
                    disabled={!isEditingPersonal}
                    value={personalDetails.city}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, city: e.target.value })}
                    placeholder="e.g. Chennai"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">State</label>
                  <input
                    type="text"
                    disabled={!isEditingPersonal}
                    value={personalDetails.state}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, state: e.target.value })}
                    placeholder="e.g. Tamil Nadu"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Postal Code (PIN)</label>
                  <input
                    type="text"
                    disabled={!isEditingPersonal}
                    value={personalDetails.pincode}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, pincode: e.target.value })}
                    placeholder="e.g. 600006"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              {/* Emergency Contact Block */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Primary Emergency Contact
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Contact Person Name</label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={personalDetails.emergencyName}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, emergencyName: e.target.value })}
                      placeholder="e.g. Dr. Robert / Spouse"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0D9488]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Emergency Phone</label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={personalDetails.emergencyPhone}
                      onChange={(e) => setPersonalDetails({ ...personalDetails, emergencyPhone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0D9488]"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MEDICAL HISTORY (ALLERGIES, CONDITIONS, MEDICATIONS)               */}
          {/* ========================================================================= */}
          {activeTab === 'medical' && (
            <div className="space-y-8">
              {/* SECTION 1: ALLERGIES */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Allergies & Sensitivities</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Informs drug-drug contraindication warnings and nutritional precautions</p>
                    </div>
                  </div>
                </div>

                {/* Add Allergy Form */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Allergen (e.g. Penicillin, Peanuts)"
                      value={newAllergy.name}
                      onChange={(e) => setNewAllergy({ ...newAllergy, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={newAllergy.severity}
                      onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    >
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe (Anaphylaxis Risk)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Clinical reaction notes..."
                      value={newAllergy.notes}
                      onChange={(e) => setNewAllergy({ ...newAllergy, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      onClick={handleAddAllergy}
                      disabled={addingAllergy || !newAllergy.name.trim()}
                      className="w-full py-2 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 shadow-sm"
                    >
                      {addingAllergy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add
                    </button>
                  </div>
                </div>

                {/* Allergies List */}
                {allergies.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No known allergies registered.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {allergies.map((a) => (
                      <div key={a.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{a.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              {a.severity}
                            </span>
                          </div>
                          {a.notes && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{a.notes}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteAllergy(a.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="Remove allergy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: CHRONIC CONDITIONS */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Chronic & Existing Health Conditions</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Used by the clinical severity rule engine to score comorbidity risks</p>
                    </div>
                  </div>
                </div>

                {/* Add Condition Form */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Condition (e.g. Type 2 Diabetes, Hypertension)"
                      value={newCondition.condition}
                      onChange={(e) => setNewCondition({ ...newCondition, condition: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Year (e.g. 2021)"
                      value={newCondition.diagnosedYear}
                      onChange={(e) => setNewCondition({ ...newCondition, diagnosedYear: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Notes / Physician details..."
                      value={newCondition.notes}
                      onChange={(e) => setNewCondition({ ...newCondition, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      onClick={handleAddCondition}
                      disabled={addingCondition || !newCondition.condition.trim()}
                      className="w-full py-2 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 shadow-sm"
                    >
                      {addingCondition ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add
                    </button>
                  </div>
                </div>

                {/* Conditions List */}
                {conditions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No chronic conditions recorded.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {conditions.map((c) => (
                      <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{c.condition}</span>
                            {c.diagnosedYear && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                Diagnosed {c.diagnosedYear}
                              </span>
                            )}
                          </div>
                          {c.notes && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{c.notes}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteCondition(c.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="Remove condition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: MEDICATIONS */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Current Medication Regimen</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Active prescriptions and therapeutic dosages</p>
                    </div>
                  </div>
                </div>

                {/* Add Med Form */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Metformin)"
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      value={newMed.dosage}
                      onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Frequency (e.g. Twice daily)"
                      value={newMed.frequency}
                      onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      onClick={handleAddMedication}
                      disabled={addingMed || !newMed.name.trim()}
                      className="w-full py-2 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 shadow-sm"
                    >
                      {addingMed ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add
                    </button>
                  </div>
                </div>

                {/* Medications List */}
                {medications.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No active medications registered.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {medications.map((m) => (
                      <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{m.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                              {m.dosage}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Frequency: {m.frequency || 'As directed'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteMedication(m.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="Remove medication"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: EMERGENCY ID CARD                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'emergency' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="rounded-3xl border-2 border-rose-500 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-950/60 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-rose-600 dark:text-rose-400">
                        EMERGENCY MEDICAL ID
                      </h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">HealthNav AI Clinical Baseline</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Blood Type</span>
                    <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                      {personalDetails.bloodGroup || 'O+'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Name</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {personalDetails.fullName || user?.fullName || 'Sarah Johnson'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Date of Birth / Age</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {personalDetails.dob || '1990-05-15'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/60">
                    <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold block mb-1">
                      Emergency Contact
                    </span>
                    <div className="flex items-center justify-between font-semibold text-rose-900 dark:text-rose-200">
                      <span>{personalDetails.emergencyName || 'Dr. Robert (Primary Attendant)'}</span>
                      <span className="font-mono">{personalDetails.emergencyPhone || personalDetails.phone || '9876543210'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Critical Allergies</span>
                    {allergies.length === 0 ? (
                      <span className="text-slate-500 italic">No recorded allergies</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {allergies.map((a) => (
                          <span key={a.id} className="px-2.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                            {a.name} ({a.severity})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Diagnosed Chronic Conditions</span>
                    {conditions.length === 0 ? (
                      <span className="text-slate-500 italic">None recorded</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {conditions.map((c) => (
                          <span key={c.id} className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-[10px]">
                            {c.condition}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Authorized digital health record</span>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Emergency ID
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
