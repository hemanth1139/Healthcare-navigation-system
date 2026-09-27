'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Bell, 
  ShieldAlert, 
  Globe, 
  Lock, 
  Trash2, 
  Info, 
  Check,
  Type,
  AlertTriangle,
  X,
  User,
  ShieldCheck,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  // Appearance State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [fontSize, setFontSize] = useState<'small' | 'default' | 'large'>('default');

  // Notifications State
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  // Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Password Form State
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  // Account deletion state
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    // Check initial theme from DOM
    if (typeof window !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    }
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (newPass.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    setChangingPass(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: currPass,
        newPassword: newPass,
      });

      setShowPasswordModal(false);
      setCurrPass('');
      setNewPass('');
      setConfirmPass('');
      triggerToast('Password updated successfully!');
    } catch (err: any) {
      console.error('[Settings] Failed to change password:', err);
      setPassError(err?.response?.data?.detail || 'Failed to update password. Please check your current password.');
    } finally {
      setChangingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      await api.delete('/auth/account');
      setShowDeleteModal(false);
      triggerToast('Account permanently deleted.');
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, 1000);
    } catch (err: any) {
      console.error('[Settings] Failed to delete account:', err);
      setDeleteError(err?.response?.data?.detail || 'Failed to delete account.');
      setDeletingAccount(false);
    }
  };

  const toggleDarkModeTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      localStorage.removeItem('theme');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    triggerToast(`Theme switched to ${newTheme}`);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2.5">
          <User className="w-7 h-7 text-[#0D9488]" />
          <span>Account & System Settings</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage your patient account security, credentials, interface preferences, and language adaptations.
        </p>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0D9488] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* SECTION 0: ACCOUNT SUMMARY */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Authenticated Account Profile</h2>
            <p className="text-xs text-slate-500">Verified patient identity & session credentials</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Patient Name</span>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{user?.fullName || 'Sarah Johnson'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Email Address</span>
            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{user?.email || 'sarah@example.com'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Account Security</span>
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold mt-0.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Active & Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: APPEARANCE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Appearance & Theme</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Customize how HealthNav AI displays on your current device</p>
          </div>
        </div>

        {/* Theme Selectors */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Color Theme</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor }
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => toggleDarkModeTheme(t.id as any)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-semibold transition-all gap-2 cursor-pointer ${
                    isSelected
                      ? 'border-[#0D9488] bg-teal-50/50 dark:bg-teal-950/30 text-[#0D9488] dark:text-[#14B8A6] ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Size Adjustment */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-slate-400" />
              Font Size Accessibility
            </label>
            <span className="text-xs font-bold text-[#0D9488] capitalize">{fontSize}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'small', label: 'Compact (14px)' },
              { id: 'default', label: 'Standard (16px)' },
              { id: 'large', label: 'Accessible (18px)' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFontSize(f.id as any);
                  triggerToast(`Font scale adjusted to ${f.id}`);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  fontSize === f.id
                    ? 'border-[#0D9488] bg-teal-50 dark:bg-teal-950/40 text-[#0D9488] dark:text-[#14B8A6]'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: NOTIFICATIONS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Notification Alerts</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage communication channels for triage follow-ups and scheme updates</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Email Consultation Summaries</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Receive copies of AI triage assessments and scheme verification checklists</p>
            </div>
            <button
              onClick={() => {
                setEmailNotifs(!emailNotifs);
                triggerToast(`Email alerts ${!emailNotifs ? 'enabled' : 'disabled'}`);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                emailNotifs ? 'bg-[#0D9488]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  emailNotifs ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Doctor Referral Reminders</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Follow-up notifications for suggested specialist consults</p>
            </div>
            <button
              onClick={() => {
                setPushNotifs(!pushNotifs);
                triggerToast(`Reminders ${!pushNotifs ? 'enabled' : 'disabled'}`);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                pushNotifs ? 'bg-[#0D9488]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  pushNotifs ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Emergency Alerts (Locked) */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 opacity-90">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Emergency Red-Flag Alerts</p>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200/50">
                  Always Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Critical medical warnings (e.g. cardiac symptoms) cannot be muted</p>
            </div>
            <button
              disabled
              className="w-12 h-6 rounded-full bg-[#0D9488] opacity-60 cursor-not-allowed relative p-0.5"
            >
              <div className="w-5 h-5 rounded-full bg-white translate-x-6" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: LANGUAGE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Regional Language Adaptation</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select language for AI symptom conversations and scheme descriptions</p>
          </div>
        </div>

        <div className="max-w-xs space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Language</label>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value as any);
              triggerToast('Language updated successfully.');
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-[#0D9488]"
          >
            <option value="en">English (India)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
          </select>
        </div>
      </div>

      {/* SECTION 4: SECURITY & ACCOUNT ACTIONS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Security Credentials & Account Management</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Change account password or permanently delete patient account</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Account Password</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Update your password to safeguard protected health information (PHI)</p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Change Password
          </button>
        </div>

        {/* Delete Account */}
        <div className="pt-4 border-t border-rose-100 dark:border-rose-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Permanently Delete Account</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Erases all consultation histories, symptom triages, and uploaded diagnostic files</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handlePasswordSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0D9488]" />
                <span>Change Password</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassError(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600">
                {passError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Password</label>
                <input
                  type="password"
                  required
                  value={currPass}
                  onChange={(e) => setCurrPass(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={changingPass}
                className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                {changingPass ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This action is irreversible. All your clinical histories, diagnostic files, and assessment records will be wiped from the system.
              </p>
            </div>

            {deleteError && (
              <p className="text-xs text-rose-600 font-semibold">{deleteError}</p>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              >
                Keep Account
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                {deletingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
