'use client';

import React, { useState } from 'react';
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
  Droplet
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { profileApi } from '@/lib/mockProfileData';

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Tab 1 Data
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

  // Tab 2 Data
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [conditions, setConditions] = useState<ChronicCondition[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    profileApi.getRecord().then((rec) => {
      if (!isMounted || !rec) return;
      if (rec.profile) {
        setPersonalDetails((prev) => ({
          ...prev,
          fullName: rec.profile.patient_name || user?.fullName || '',
          dob: rec.profile.date_of_birth || '',
          gender: rec.profile.gender || 'Male',
          bloodGroup: rec.profile.blood_group || 'O+',
          height: rec.profile.height_cm ? String(rec.profile.height_cm) : '',
          weight: rec.profile.weight_kg ? String(rec.profile.weight_kg) : '',
          address: rec.profile.address || '',
          city: rec.profile.city || '',
          state: rec.profile.state || '',
          pincode: rec.profile.pincode || '',
          emergencyName: rec.profile.emergency_contact_name || '',
          emergencyPhone: rec.profile.emergency_contact_phone || '',
        }));
      }
      if (Array.isArray(rec.allergies)) {
        setAllergies(
          rec.allergies.map((a) => ({
            id: a.allergy_id,
            name: a.allergy_name,
            severity: a.severity,
            notes: a.notes || '',
          }))
        );
      }
      if (Array.isArray(rec.chronicConditions)) {
        setConditions(
          rec.chronicConditions.map((c) => ({
            id: c.condition_id,
            condition: c.condition_name,
            diagnosedYear: c.diagnosed_year ? String(c.diagnosed_year) : '',
            notes: c.notes || '',
          }))
        );
      }
      if (Array.isArray(rec.medications)) {
        setMedications(
          rec.medications.map((m) => ({
            id: m.medication_id,
            name: m.medicine_name,
            dosage: m.dosage,
            frequency: m.frequency,
            prescribedBy: m.prescribed_by || '',
          }))
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Form states for adding items
  const [newAllergy, setNewAllergy] = useState<Omit<Allergy, 'id'>>({ name: '', severity: 'Mild', notes: '' });
  const [newCondition, setNewCondition] = useState<Omit<ChronicCondition, 'id'>>({ condition: '', diagnosedYear: '', notes: '' });
  const [newMed, setNewMed] = useState<Omit<Medication, 'id'>>({ name: '', dosage: '', frequency: '', prescribedBy: '' });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handlePersonalSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingPersonal(false);
    showToast('Personal details updated successfully!');
  };

  const addAllergy = () => {
    if (!newAllergy.name) return;
    setAllergies([...allergies, { ...newAllergy, id: `a-${Date.now()}` }]);
    setNewAllergy({ name: '', severity: 'Mild', notes: '' });
    showToast('Allergy added!');
  };

  const addCondition = () => {
    if (!newCondition.condition) return;
    setConditions([...conditions, { ...newCondition, id: `c-${Date.now()}` }]);
    setNewCondition({ condition: '', diagnosedYear: '', notes: '' });
    showToast('Condition recorded!');
  };

  const addMedication = () => {
    if (!newMed.name) return;
    setMedications([...medications, { ...newMed, id: `m-${Date.now()}` }]);
    setNewMed({ name: '', dosage: '', frequency: '', prescribedBy: '' });
    showToast('Medication added!');
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-md">
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
                Blood Group: <span className="font-bold text-rose-600">{personalDetails.bloodGroup || 'Not specified'}</span>
                {personalDetails.dob && ` • DOB: ${personalDetails.dob}`}
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
            { id: 'medical', label: 'Medical History', icon: HeartPulse },
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
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
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

      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <Check className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      {/* TAB 1: PERSONAL DETAILS */}
      {activeTab === 'personal' && (
        <form onSubmit={handlePersonalSave} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Demographic & Contact Information</h2>
            <button
              type="button"
              onClick={() => setIsEditingPersonal(!isEditingPersonal)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditingPersonal ? 'Cancel Editing' : 'Edit Information'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                type="text"
                disabled={!isEditingPersonal}
                value={personalDetails.fullName}
                onChange={(e) => setPersonalDetails({ ...personalDetails, fullName: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-75 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <input
                type="email"
                disabled
                value={personalDetails.email}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-500 text-xs sm:text-sm font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
              <input
                type="text"
                disabled={!isEditingPersonal}
                value={personalDetails.phone}
                onChange={(e) => setPersonalDetails({ ...personalDetails, phone: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-75 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date of Birth</label>
              <input
                type="date"
                disabled={!isEditingPersonal}
                value={personalDetails.dob}
                onChange={(e) => setPersonalDetails({ ...personalDetails, dob: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-75 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gender</label>
              <select
                disabled={!isEditingPersonal}
                value={personalDetails.gender}
                onChange={(e) => setPersonalDetails({ ...personalDetails, gender: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-75 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Blood Group</label>
              <select
                disabled={!isEditingPersonal}
                value={personalDetails.bloodGroup}
                onChange={(e) => setPersonalDetails({ ...personalDetails, bloodGroup: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-75 focus:ring-2 focus:ring-emerald-500"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Height (cm)</label>
              <input
                type="number"
                disabled={!isEditingPersonal}
                value={personalDetails.height}
                onChange={(e) => setPersonalDetails({ ...personalDetails, height: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-75 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Weight (kg)</label>
              <input
                type="number"
                disabled={!isEditingPersonal}
                value={personalDetails.weight}
                onChange={(e) => setPersonalDetails({ ...personalDetails, weight: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-75 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pincode</label>
              <input
                type="text"
                disabled={!isEditingPersonal}
                value={personalDetails.pincode}
                onChange={(e) => setPersonalDetails({ ...personalDetails, pincode: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-75 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Residential Address</label>
              <input
                type="text"
                disabled={!isEditingPersonal}
                value={personalDetails.address}
                onChange={(e) => setPersonalDetails({ ...personalDetails, address: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-75 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">City / State</label>
              <input
                type="text"
                disabled={!isEditingPersonal}
                value={`${personalDetails.city}, ${personalDetails.state}`}
                onChange={(e) => {
                  const parts = e.target.value.split(',');
                  setPersonalDetails({ ...personalDetails, city: parts[0] || '', state: parts[1] || '' });
                }}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-75 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Primary Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contact Name & Relation</label>
                <input
                  type="text"
                  disabled={!isEditingPersonal}
                  value={personalDetails.emergencyName}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, emergencyName: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-75 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Emergency Phone Number</label>
                <input
                  type="text"
                  disabled={!isEditingPersonal}
                  value={personalDetails.emergencyPhone}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, emergencyPhone: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-75 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {isEditingPersonal && (
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Demographic Profile
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: MEDICAL HISTORY */}
      {activeTab === 'medical' && (
        <div className="space-y-6">
          {/* SECTION 1: ALLERGIES */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                Known Drug & Food Allergies
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allergies.map((all) => (
                <div key={all.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{all.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        all.severity === 'Severe' 
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900' 
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                      }`}>
                        {all.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{all.notes}</p>
                  </div>
                  <button
                    onClick={() => {
                      setAllergies(allergies.filter((a) => a.id !== all.id));
                      showToast('Allergy removed');
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Allergy inline form */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Allergy name (e.g. Sulfa drugs)"
                value={newAllergy.name}
                onChange={(e) => setNewAllergy({ ...newAllergy, name: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
              <select
                value={newAllergy.severity}
                onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value as any })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
              <input
                type="text"
                placeholder="Notes / reactions"
                value={newAllergy.notes}
                onChange={(e) => setNewAllergy({ ...newAllergy, notes: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={addAllergy}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Allergy
              </button>
            </div>
          </div>

          {/* SECTION 2: CHRONIC CONDITIONS */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Chronic Pre-existing Conditions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conditions.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{c.condition}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Diagnosed {c.diagnosedYear}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{c.notes}</p>
                  </div>
                  <button
                    onClick={() => {
                      setConditions(conditions.filter((cond) => cond.id !== c.id));
                      showToast('Condition removed');
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Condition inline form */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Condition name (e.g. Asthma)"
                value={newCondition.condition}
                onChange={(e) => setNewCondition({ ...newCondition, condition: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                placeholder="Year (e.g. 2022)"
                value={newCondition.diagnosedYear}
                onChange={(e) => setNewCondition({ ...newCondition, diagnosedYear: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                placeholder="Notes / Severity"
                value={newCondition.notes}
                onChange={(e) => setNewCondition({ ...newCondition, notes: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={addCondition}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Condition
              </button>
            </div>
          </div>

          {/* SECTION 3: MEDICATIONS */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Active Prescribed Medications
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medications.map((m) => (
                <div key={m.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{m.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        {m.dosage}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Frequency: {m.frequency}</p>
                    <p className="text-[11px] text-slate-400">Rx: {m.prescribedBy}</p>
                  </div>
                  <button
                    onClick={() => {
                      setMedications(medications.filter((med) => med.id !== m.id));
                      showToast('Medication removed');
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Medication inline form */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              <input
                type="text"
                placeholder="Medicine name"
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                placeholder="Dosage (500mg)"
                value={newMed.dosage}
                onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                placeholder="Frequency"
                value={newMed.frequency}
                onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                placeholder="Prescribing Doctor"
                value={newMed.prescribedBy}
                onChange={(e) => setNewMed({ ...newMed, prescribedBy: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={addMedication}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Rx
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMERGENCY INFO & MEDICAL ID */}
      {activeTab === 'emergency' && (
        <div className="space-y-6">
          {/* Prominent Emergency Contact Card */}
          <div className="rounded-2xl border-2 border-rose-500/50 bg-rose-500/5 dark:bg-rose-950/20 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center animate-pulse">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Primary Emergency Contact</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Designated first responder for urgent medical notifications</p>
                </div>
              </div>

              <a
                href={`tel:${personalDetails.emergencyPhone}`}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Emergency Contact
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Contact Name</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100">{personalDetails.emergencyName}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Phone Number</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">{personalDetails.emergencyPhone}</p>
              </div>
            </div>
          </div>

          {/* Critical Warnings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Blood Group */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center border border-rose-200/50">
                <Droplet className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verified Blood Group</p>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{personalDetails.bloodGroup} Positive</p>
              </div>
            </div>

            {/* Severe Drug Allergies Highlighted */}
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/30 p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Severe Drug Allergy Warning</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {allergies.filter((a) => a.severity === 'Severe').map((a) => a.name).join(', ') || 'No severe allergies'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Do NOT administer without specialist clearance</p>
              </div>
            </div>
          </div>

          {/* Printable Emergency Medical ID Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Emergency Medical ID Card Preview</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Digital wallet card for emergency medical responders</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Card
                </button>
                <button
                  onClick={() => showToast('Medical ID Card downloaded as PDF')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            </div>

            {/* Digital ID Card Canvas */}
            <div className="max-w-md mx-auto rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white p-6 shadow-2xl border border-slate-700 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl" />

              {/* ID Header */}
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">
                    HN
                  </div>
                  <span className="font-bold text-sm tracking-wide">HealthNav Emergency ID</span>
                </div>
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded">
                  CRITICAL CARE
                </span>
              </div>

              {/* Patient Core Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black tracking-tight">{personalDetails.fullName || user?.fullName || 'Patient'}</h4>
                  {personalDetails.dob && <p className="text-xs text-slate-400">DOB: {personalDetails.dob}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Blood Group</p>
                  <p className="text-2xl font-black text-rose-500">{personalDetails.bloodGroup || 'O+'}</p>
                </div>
              </div>

              {/* Medical Specs */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <div>
                  <p className="text-[10px] text-slate-400">Severe Allergies</p>
                  <p className="font-bold text-rose-400">
                    {allergies.filter((a) => a.severity === 'Severe').map((a) => a.name).join(', ') || 'None Reported'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Chronic Conditions</p>
                  <p className="font-semibold text-slate-200">
                    {conditions.map((c) => c.condition).join(', ') || 'None Reported'}
                  </p>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">In Case of Emergency (ICE):</p>
                  <p className="font-bold text-slate-100">{personalDetails.emergencyName}</p>
                </div>
                <p className="font-mono font-bold text-emerald-400">{personalDetails.emergencyPhone}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
