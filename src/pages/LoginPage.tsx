import React, { useState } from 'react';
import {
  FlaskConical,
  ShieldCheck,
  Lock,
  Mail,
  Building2,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Stethoscope,
  Microscope,
  Award,
  Sliders,
  AlertCircle,
  FileCheck2,
  User,
  HeartPulse,
  IdCard,
  KeyRound,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useAuth, DEMO_USERS, DEMO_PATIENTS } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { UserRole } from '../types';

const FACILITIES = [
  'MetroHealth Central Pathology (San Francisco, CA)',
  'MetroHealth North Diagnostic Wing (Boston, MA)',
  'MetroHealth Regional Reference Center (Chicago, IL)',
  'MetroHealth Memorial Clinical Lab (Austin, TX)',
];

export const LoginPage: React.FC = () => {
  const { login, loginAsRole, loginAsPatient } = useAuth();
  const { t } = useLanguage();

  const [portalMode, setPortalMode] = useState<'doctor' | 'patient'>('doctor');

  // Doctor / Staff Login States
  const [email, setEmail] = useState('michael.chang@metrohealth.org');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [facility, setFacility] = useState(FACILITIES[0]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('doctor');

  // Patient Login States
  const [patientIdInput, setPatientIdInput] = useState('P001');
  const [patientDob, setPatientDob] = useState('1980-05-14');
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your institutional doctor / staff email.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(email, password, selectedRole, facility);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify doctor credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientIdInput) {
      setErrorMessage('Please enter your Patient ID or registered email.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(patientIdInput, patientDob, 'patient', facility);
    } catch (err: any) {
      setErrorMessage(err.message || 'Patient verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRoleLogin = (role: UserRole) => {
    setIsLoading(true);
    const demoUser = DEMO_USERS[role];
    if (demoUser) {
      setEmail(demoUser.email);
      setSelectedRole(role);
    }
    setTimeout(() => {
      loginAsRole(role, facility);
      setIsLoading(false);
    }, 250);
  };

  const handleQuickPatientLogin = (patId: string) => {
    setIsLoading(true);
    setPatientIdInput(patId);
    setTimeout(() => {
      loginAsPatient(patId);
      setIsLoading(false);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 selection:bg-teal-600 selection:text-white">
      {/* Top Bar Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white tracking-tight">LabReport AI</span>
              <span className="text-[11px] bg-teal-500/20 text-teal-300 font-extrabold px-1.5 py-0.5 rounded border border-teal-400/30">
                CLINICAL LIS & PATIENT PORTAL
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Pathology Laboratory & Medical Nutrition Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>HIPAA Compliant</span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>CAP / CLIA Accredited</span>
            </div>
          </div>
          <LanguageSelector variant="subtle" />
        </div>
      </header>

      {/* Main Login Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Pitch & Capability Highlights */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Integrated Doctor & Patient Care Ecosystem</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {portalMode === 'doctor' ? (
              <>
                Physician & Lab Staff <br />
                <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  Pathology Diagnostic Portal
                </span>
              </>
            ) : (
              <>
                Personalized Patient <br />
                <span className="bg-gradient-to-r from-teal-300 via-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  Health & Wellness Portal
                </span>
              </>
            )}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
            {portalMode === 'doctor'
              ? 'Review automated multi-instrument analyser runs, verify diagnostic thresholds, sign off on clinical reports, and synthesize customized diet & movement protocols.'
              : 'Access your official diagnostic pathology reports, 7-day medical meal schedules, and biomarker-calibrated exercise protocols prescribed by your attending physician.'}
          </p>

          {/* Quick Role / Patient Switcher */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {portalMode === 'doctor' ? '1-Click Doctor & Staff Logins' : '1-Click Verified Patient Logins'}
                </span>
              </span>
              <span className="text-[10px] text-teal-400 font-extrabold uppercase">Instant Access</span>
            </div>

            {portalMode === 'doctor' ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('doctor')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-teal-950/80 border border-slate-700 hover:border-teal-500 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                      <Stethoscope className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-teal-300">
                      Attending Doctor
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">Dr. Michael Chang, MD</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('pathologist')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-blue-950/80 border border-slate-700 hover:border-blue-500 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
                      <Microscope className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-blue-300">
                      Chief Pathologist
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">Dr. Sarah Jenkins, MD</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('technologist')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-teal-950/80 border border-slate-700 hover:border-teal-500 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                      <FlaskConical className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                      Lab Technologist
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">Marcus Vance, CLS</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('compliance')}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-950/80 border border-slate-700 hover:border-amber-500 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                      Quality Lead
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">Dr. Priya Nair, PhD</div>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {DEMO_PATIENTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleQuickPatientLogin(p.id)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-teal-950/80 border border-slate-700 hover:border-teal-500 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-teal-300">
                        {p.name}
                      </div>
                      <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono font-bold px-1.5 py-0.5 rounded">
                        {p.id}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      {p.age}y {p.sex} • {p.primaryCondition}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Login Card with Portal Mode Tabs */}
        <div className="lg:col-span-6 max-w-md w-full mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Portal Switcher Tabs */}
            <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setPortalMode('doctor');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  portalMode === 'doctor'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Doctor / Staff</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPortalMode('patient');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  portalMode === 'patient'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Patient Portal</span>
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {portalMode === 'doctor' ? 'Medical Staff Sign-In' : 'Patient Health Sign-In'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {portalMode === 'doctor'
                  ? 'Access clinical LIS telemetry & diagnostic reports'
                  : 'Enter your Patient ID or registered email'}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Doctor Form */}
            {portalMode === 'doctor' ? (
              <form onSubmit={handleDoctorSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Hospital / Lab Facility</span>
                  </label>
                  <select
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    {FACILITIES.map((fac) => (
                      <option key={fac} value={fac} className="bg-slate-900 text-slate-200">
                        {fac}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Doctor / Staff Email</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@metrohealth.org"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-400" />
                      <span>Password</span>
                    </label>
                    <span className="text-[10px] text-blue-400 hover:underline cursor-pointer">
                      Forgot key?
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Clinical Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('doctor');
                        setEmail(DEMO_USERS.doctor.email);
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                        selectedRole === 'doctor'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Doctor / Physician
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('pathologist');
                        setEmail(DEMO_USERS.pathologist.email);
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                        selectedRole === 'pathologist'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Chief Pathologist
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In as Medical Staff</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Patient Form */
              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-teal-400" />
                    <span>Patient ID (MRN) or Email</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={patientIdInput}
                    onChange={(e) => setPatientIdInput(e.target.value)}
                    placeholder="e.g. P001 or ravi.kumar@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Try demo IDs: <span className="text-teal-400 font-bold">P001, P002, P003, P004, P007, P009</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                    <span>Date of Birth / Verification PIN</span>
                  </label>
                  <input
                    type="date"
                    value={patientDob}
                    onChange={(e) => setPatientDob(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>

                <div className="p-3 bg-teal-950/40 border border-teal-800/40 rounded-xl text-xs text-teal-200/90 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    Your health information is confidential and protected by 256-bit HIPAA encryption.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 bg-teal-600 hover:bg-teal-500 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter Patient Health Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
              Hospital Active Directory • 2FA Enforced • SSL 256-bit
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-6 py-4 text-center text-[11px] text-slate-500">
        MetroHealth Pathology LIS & Patient Portal • Version 2.4.0 • Authorized clinical and patient access
      </footer>
    </div>
  );
};
