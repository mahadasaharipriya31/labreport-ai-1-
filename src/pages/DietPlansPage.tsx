import React, { useState, useEffect } from 'react';
import {
  Salad,
  Utensils,
  Apple,
  Activity,
  Flame,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Download,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Clock,
  ChevronRight,
  Calendar,
  User,
  Search,
  Filter,
  ShieldCheck,
  FileText,
  Edit3,
  Save,
  X,
  HeartPulse,
  Info,
  Dumbbell,
  Zap,
  Timer,
  Gauge,
  Footprints,
} from 'lucide-react';
import { PatientDietPlan, Patient, DailyMealPlan } from '../types';
import { api } from '../services/api';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useLanguage } from '../context/LanguageContext';

interface DietPlansPageProps {
  onSelectReport?: (reportId: string) => void;
  initialPatientId?: string | null;
}

export const DietPlansPage: React.FC<DietPlansPageProps> = ({
  onSelectReport,
  initialPatientId,
}) => {
  const { t } = useLanguage();
  const [dietPlans, setDietPlans] = useState<PatientDietPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PatientDietPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCondition, setFilterCondition] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'schedule' | 'exercise' | 'foods' | 'rationale' | 'notes'>('schedule');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Edit / Customize Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editCalories, setEditCalories] = useState<number>(1800);
  const [editDietPref, setEditDietPref] = useState<string>('Standard Balanced');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchDietPlans = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDietPlans();
      const plans = res.diet_plans || [];
      setDietPlans(plans);

      if (plans.length > 0) {
        if (initialPatientId) {
          const match = plans.find((p) => p.patient_id === initialPatientId);
          setSelectedPlan(match || plans[0]);
        } else if (!selectedPlan) {
          setSelectedPlan(plans[0]);
        } else {
          // Keep current selected if still present
          const current = plans.find((p) => p.id === selectedPlan.id);
          setSelectedPlan(current || plans[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch diet plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDietPlans();
  }, [initialPatientId]);

  const handleSelectPlan = (plan: PatientDietPlan) => {
    setSelectedPlan(plan);
    setSelectedDayIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditModal = () => {
    if (!selectedPlan) return;
    setEditCalories(selectedPlan.calories_target);
    setEditDietPref(selectedPlan.dietary_preference || 'Standard Balanced');
    setEditNotes(selectedPlan.nutritionist_notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveAdjustments = async () => {
    if (!selectedPlan) return;
    setIsSaving(true);
    try {
      const res = await api.updateDietPlan(selectedPlan.id, {
        calories_target: Number(editCalories),
        dietary_preference: editDietPref,
        nutritionist_notes: editNotes,
      });
      if (res.diet_plan) {
        setSelectedPlan(res.diet_plan);
      }
      setIsEditModalOpen(false);
      setStatusMessage('Diet plan prescription updated successfully!');
      setTimeout(() => setStatusMessage(null), 3500);
      await fetchDietPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to update diet plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedPlan) return;
    setIsRegenerating(true);
    try {
      const regenerated = await api.generateDietPlan({
        patient_id: selectedPlan.patient_id,
        patient_name: selectedPlan.patient_name,
        age: selectedPlan.age,
        sex: selectedPlan.sex,
        report_id: selectedPlan.report_id,
        dietary_preference: selectedPlan.dietary_preference,
      });
      setSelectedPlan(regenerated);
      setStatusMessage('Diet plan regenerated against latest pathology data!');
      setTimeout(() => setStatusMessage(null), 3500);
      await fetchDietPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate diet plan');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filteredPlans = dietPlans.filter((p) => {
    const matchesSearch =
      p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.plan_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterCondition === 'ALL') return matchesSearch;
    return matchesSearch && p.primary_condition.toLowerCase().includes(filterCondition.toLowerCase());
  });

  // Calculate Stat Badges
  const totalPlans = dietPlans.length;
  const glycemicCount = dietPlans.filter((p) =>
    p.primary_condition.toLowerCase().includes('glycemic') || p.plan_name.toLowerCase().includes('glycemic')
  ).length;
  const lipidCount = dietPlans.filter((p) =>
    p.primary_condition.toLowerCase().includes('cardio') || p.primary_condition.toLowerCase().includes('lipid') || p.plan_name.toLowerCase().includes('lipid')
  ).length;
  const renalCount = dietPlans.filter((p) =>
    p.primary_condition.toLowerCase().includes('renal') || p.plan_name.toLowerCase().includes('renal')
  ).length;
  const anemiaCount = dietPlans.filter((p) =>
    p.primary_condition.toLowerCase().includes('anemia') || p.plan_name.toLowerCase().includes('iron')
  ).length;

  const currentDayPlan: DailyMealPlan | undefined =
    selectedPlan?.weekly_meal_plan?.[selectedDayIndex] || selectedPlan?.weekly_meal_plan?.[0];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t('diet.title', 'Patient Clinical Diet Plans')}
            </h1>
            <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
              {t('diet.badge', 'Pathology Evidence-Based')}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('diet.subtitle', 'Personalized medical nutrition protocols synthesized directly from laboratory analyser findings')}
          </p>
        </div>

        {/* Global Action / Search */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('action.search', 'Search patient or protocol...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Top Clinical Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t('diet.total_plans', 'Total Diet Plans')}</span>
            <Salad className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalPlans}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active Prescriptions</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t('diet.glycemic_plans', 'Glycemic Plans')}</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{glycemicCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Low-GI & Diabetic</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t('diet.cardio_plans', 'Cardio / Lipids')}</span>
            <HeartPulse className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{lipidCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Cholesterol / Triglycerides</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t('diet.renal_plans', 'Renal Support')}</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{renalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Glomerular Safe</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t('diet.anemia_plans', 'Anemia Recovery')}</span>
            <Apple className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{anemiaCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Iron-Density Focus</div>
        </div>
      </div>

      {/* Main Grid: Left Plan Directory, Right Plan Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Patient Diet Plans Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-teal-600" />
                <span>Patient Plans ({filteredPlans.length})</span>
              </span>

              {/* Filter Pills */}
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Conditions</option>
                <option value="glycemic">Glycemic / Glucose</option>
                <option value="cardio">Cardio / Lipids</option>
                <option value="renal">Renal Impairment</option>
                <option value="anemia">Anemia Recovery</option>
                <option value="uric">Hyperuricemia</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Loading patient clinical diet plans...</span>
                </div>
              ) : filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const triggersCount = plan.clinical_triggers?.length || 0;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-400 shadow-xs ring-1 ring-teal-400/50'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {plan.patient_name}
                            </span>
                            <span className="text-[10px] font-mono text-teal-800 bg-teal-100/60 px-1.5 py-0.2 rounded font-semibold shrink-0">
                              {plan.patient_id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">
                            {plan.age}y · {plan.sex} · {plan.calories_target} kcal
                          </div>
                        </div>

                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                          {plan.status}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-teal-800 font-semibold truncate text-[11px]">
                          {plan.plan_name}
                        </span>
                        {triggersCount > 0 && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                            {triggersCount} Lab {triggersCount === 1 ? 'Trigger' : 'Triggers'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No diet plans match your search or filter criteria.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected Diet Plan Details (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedPlan ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              {/* Plan Header Banner */}
              <div className="p-6 bg-gradient-to-r from-teal-900 to-slate-900 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono uppercase bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-bold border border-teal-400/30">
                        {selectedPlan.patient_id}
                      </span>
                      <span className="text-xs text-slate-300">
                        {selectedPlan.age} Years · {selectedPlan.sex}
                      </span>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-400/30">
                        {selectedPlan.status}
                      </span>
                    </div>

                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      {selectedPlan.plan_name}
                    </h2>
                    <p className="text-xs text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
                      {selectedPlan.summary}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 print:hidden">
                    <button
                      onClick={handleOpenEditModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                      <span>{t('action.adjust', 'Adjust')}</span>
                    </button>

                    <button
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                      <span>{isRegenerating ? 'Recalculating...' : t('action.regenerate', 'Regenerate')}</span>
                    </button>

                    <a
                      href={api.getDietPlanPdfUrl(selectedPlan.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-700" />
                      <span>{t('action.download_pdf', 'PDF Chart')}</span>
                    </a>

                    <button
                      onClick={handlePrint}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title={t('action.print_report', 'Print Diet Plan')}
                    >
                      <Printer className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>
                </div>

                {/* Dietary Tags */}
                {selectedPlan.dietary_tags && selectedPlan.dietary_tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t border-teal-800/60">
                    <span className="text-[11px] text-teal-300/80 mr-1 font-semibold">Protocols:</span>
                    {selectedPlan.dietary_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-teal-950/80 text-teal-200 border border-teal-700/50 px-2 py-0.5 rounded font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Lab Triggers Banner */}
              {selectedPlan.clinical_triggers && selectedPlan.clinical_triggers.length > 0 && (
                <div className="p-4 bg-amber-50/70 border-b border-amber-200/70">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Pathology Lab Triggers Detected ({selectedPlan.clinical_triggers.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedPlan.clinical_triggers.map((t, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-amber-200/80 rounded-lg p-2.5 text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{t.biomarker}</span>
                          <span className="font-mono font-bold text-amber-700 text-[11px]">
                            {t.value} {t.unit} [{t.status}]
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {t.implication}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Target Metrics Bar */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-medium">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>Daily Calories</span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {selectedPlan.calories_target} <span className="text-xs font-normal text-slate-500">kcal</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Energy Target</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-medium">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                    <span>Carbs / Pro / Fat</span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">
                    {selectedPlan.macronutrients?.carbs_pct}% / {selectedPlan.macronutrients?.protein_pct}% / {selectedPlan.macronutrients?.fat_pct}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Macro Ratio</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-medium">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    <span>Fluid Hydration</span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {selectedPlan.water_target_liters} <span className="text-xs font-normal text-slate-500">Liters</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Filtered Daily Water</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sodium Ceiling</span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    &lt; {selectedPlan.sodium_limit_mg} <span className="text-xs font-normal text-slate-500">mg</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">DASH / BP Limit</div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-slate-200 px-6 pt-3 flex flex-wrap items-center gap-6 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'schedule'
                      ? 'border-teal-600 text-teal-700 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t('diet.schedule_tab', '7-Day Meal Schedule')}</span>
                </button>
                <button
                  onClick={() => setActiveTab('exercise')}
                  className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'exercise'
                      ? 'border-teal-600 text-teal-700 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('diet.exercise_tab', 'Exercise & Movement Protocol')}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full">
                    {selectedPlan.exercise_prescription?.weekly_target_minutes || 180}m
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('foods')}
                  className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'foods'
                      ? 'border-teal-600 text-teal-700 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5" />
                  <span>{t('diet.foods_tab', 'Foods to Include & Avoid')}</span>
                </button>
                <button
                  onClick={() => setActiveTab('rationale')}
                  className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'rationale'
                      ? 'border-teal-600 text-teal-700 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{t('diet.rationale_tab', 'Clinical Rationale & Lifestyle')}</span>
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'notes'
                      ? 'border-teal-600 text-teal-700 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t('diet.notes_tab', 'Nutritionist Notes & Verification')}</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* 1. Schedule Tab */}
                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    {/* Day selector pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedPlan.weekly_meal_plan?.map((dayPlan, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedDayIndex(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedDayIndex === idx
                              ? 'bg-teal-700 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {dayPlan.day}
                        </button>
                      ))}
                    </div>

                    {/* Active Day Detail Card */}
                    {currentDayPlan && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <div className="p-4 bg-teal-50/60 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-teal-700" />
                            <h3 className="font-extrabold text-sm text-slate-900">
                              {currentDayPlan.day} Meal Breakdown
                            </h3>
                          </div>
                          <span className="text-[11px] text-teal-800 font-semibold bg-white px-2.5 py-1 rounded-md border border-teal-200">
                            Day {currentDayPlan.day_number} of 7
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {/* Breakfast */}
                          <div className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Breakfast (07:30 - 08:30 AM)
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 pl-4 leading-relaxed">
                              {currentDayPlan.breakfast}
                            </p>
                          </div>

                          {/* Mid Morning */}
                          <div className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Mid-Morning Snack (10:30 - 11:00 AM)
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 pl-4 leading-relaxed">
                              {currentDayPlan.mid_morning}
                            </p>
                          </div>

                          {/* Lunch */}
                          <div className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-2 h-2 rounded-full bg-teal-500" />
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Lunch (01:00 - 02:00 PM)
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 pl-4 leading-relaxed">
                              {currentDayPlan.lunch}
                            </p>
                          </div>

                          {/* Afternoon Snack */}
                          <div className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Afternoon Refreshment (04:30 - 05:00 PM)
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 pl-4 leading-relaxed">
                              {currentDayPlan.afternoon_snack}
                            </p>
                          </div>

                          {/* Dinner */}
                          <div className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Dinner (07:00 - 08:00 PM)
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 pl-4 leading-relaxed">
                              {currentDayPlan.dinner}
                            </p>
                          </div>

                          {/* Bedtime */}
                          <div className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Bedtime Routine (09:30 - 10:00 PM)
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 pl-4 leading-relaxed">
                              {currentDayPlan.bedtime}
                            </p>
                          </div>
                        </div>

                        {/* Hydration Note */}
                        {currentDayPlan.hydration_note && (
                          <div className="p-3.5 bg-blue-50/70 border-t border-blue-200/60 text-xs text-blue-900 flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{currentDayPlan.hydration_note}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Exercise & Movement Protocol Tab */}
                {activeTab === 'exercise' && selectedPlan.exercise_prescription && (
                  <div className="space-y-6">
                    {/* Top Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-200/80 rounded-xl p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
                          <span>{t('diet.weekly_active_target', 'Weekly Target')}</span>
                          <Timer className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-black text-blue-950 mt-1">
                          {selectedPlan.exercise_prescription.weekly_target_minutes}
                          <span className="text-xs font-semibold text-blue-700 ml-1">min/week</span>
                        </div>
                        <div className="text-[11px] text-blue-600 mt-0.5">Distributed across 5-6 days</div>
                      </div>

                      <div className="bg-gradient-to-br from-teal-50 to-emerald-50/40 border border-teal-200/80 rounded-xl p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between text-teal-800 text-xs font-semibold">
                          <span>{t('diet.exercise_intensity', 'Prescribed Intensity')}</span>
                          <Gauge className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="text-sm font-extrabold text-teal-950 mt-2 line-clamp-1">
                          {selectedPlan.exercise_prescription.intensity_rating}
                        </div>
                        <div className="text-[11px] text-teal-700 mt-0.5">Calibrated to lab findings</div>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200/80 rounded-xl p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
                          <span>Prescribed Modalities</span>
                          <Dumbbell className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-2xl font-black text-amber-950 mt-1">
                          {selectedPlan.exercise_prescription.exercises?.length || 0}
                          <span className="text-xs font-semibold text-amber-700 ml-1">Modalities</span>
                        </div>
                        <div className="text-[11px] text-amber-700 mt-0.5">Cardio, strength & mobility</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50/40 border border-purple-200/80 rounded-xl p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between text-purple-800 text-xs font-semibold">
                          <span>Primary Target</span>
                          <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-sm font-extrabold text-purple-950 mt-2 line-clamp-1">
                          {selectedPlan.primary_condition}
                        </div>
                        <div className="text-[11px] text-purple-700 mt-0.5">Biomarker Modulation</div>
                      </div>
                    </div>

                    {/* Clinical Mechanism Summary */}
                    <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs border border-slate-800 flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                        <HeartPulse className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-1">
                          Clinical Exercise Physiology & Biomarker Rationale
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedPlan.exercise_prescription.summary}
                        </p>
                      </div>
                    </div>

                    {/* Prescribed Specific Exercises */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                        <Dumbbell className="w-4 h-4 text-blue-600" />
                        <span>{t('diet.prescribed_exercises', 'Prescribed Clinical Exercises & Physiological Mechanisms')}</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {selectedPlan.exercise_prescription.exercises?.map((ex, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                                  {idx + 1}
                                </div>
                                <h5 className="font-bold text-slate-900 text-sm">{ex.name}</h5>
                              </div>
                              <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200/80 font-bold px-2 py-0.5 rounded-full shrink-0">
                                {ex.type}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                              <span className="bg-slate-100 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {ex.frequency}
                              </span>
                              <span className="bg-slate-100 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                                <Timer className="w-3 h-3 text-slate-400" />
                                {ex.duration}
                              </span>
                              <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-semibold">
                                {ex.intensity} Intensity
                              </span>
                            </div>

                            {ex.target_metabolism && (
                              <div className="text-[11px] text-indigo-700 bg-indigo-50/60 border border-indigo-100 rounded-md px-2.5 py-1 font-semibold flex items-center gap-1.5">
                                <Zap className="w-3 h-3 text-indigo-500" />
                                <span>Target: {ex.target_metabolism}</span>
                              </div>
                            )}

                            <div className="pt-1 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                              <span className="font-bold text-slate-700">Pathology Benefit: </span>
                              {ex.clinical_benefit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 7-Day Movement Schedule */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        <span>{t('diet.exercise_schedule', '7-Day Synchronized Movement & Workout Schedule')}</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2.5">
                        {selectedPlan.exercise_prescription.recommended_days?.map((sDay, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2 hover:border-teal-400 transition-colors flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <span className="font-extrabold text-xs text-slate-900">{sDay.day}</span>
                                <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-1.5 py-0.5 rounded">
                                  {sDay.duration}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 mt-2 font-medium leading-snug">
                                {sDay.routine}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-semibold truncate">
                              Focus: {sDay.focus}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Safety Precautions & Recovery Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl shadow-2xs space-y-2">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>{t('diet.safety_precautions', 'Clinical Safety & Precautions')}</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-amber-900/90 pl-1">
                          {selectedPlan.exercise_prescription.safety_precautions?.map((prec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{prec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl shadow-2xs space-y-2">
                        <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          <span>{t('diet.rest_recovery', 'Rest & Recovery Protocol')}</span>
                        </div>
                        <p className="text-xs text-blue-950 leading-relaxed">
                          {selectedPlan.exercise_prescription.rest_recovery_protocol}
                        </p>
                        <div className="pt-2 text-[11px] text-blue-700 font-medium">
                          Always cross-reference heart rate and blood pressure with your prescribing physician.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Foods Tab */}
                {activeTab === 'foods' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Include */}
                    <div className="border border-emerald-200 rounded-xl overflow-hidden shadow-2xs">
                      <div className="p-3.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Therapeutic Foods to Prioritize</span>
                        </span>
                        <span className="text-[10px] bg-emerald-200/60 text-emerald-900 font-bold px-2 py-0.5 rounded">
                          {selectedPlan.foods_to_include?.length || 0} Recommended
                        </span>
                      </div>

                      <div className="divide-y divide-emerald-50 p-2">
                        {selectedPlan.foods_to_include?.map((item, idx) => (
                          <div key={idx} className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-xs text-emerald-950">
                                {item.item}
                              </span>
                              {item.portion && (
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                                  {item.portion}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                              {item.clinical_benefit}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Avoid */}
                    <div className="border border-rose-200 rounded-xl overflow-hidden shadow-2xs">
                      <div className="p-3.5 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Foods to Restrict / Strictly Avoid</span>
                        </span>
                        <span className="text-[10px] bg-rose-200/60 text-rose-900 font-bold px-2 py-0.5 rounded">
                          {selectedPlan.foods_to_avoid?.length || 0} Restricted
                        </span>
                      </div>

                      <div className="divide-y divide-rose-50 p-2">
                        {selectedPlan.foods_to_avoid?.map((item, idx) => (
                          <div key={idx} className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-xs text-rose-950">
                                {item.item}
                              </span>
                              <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                                {item.severity || 'Restrict'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                              {item.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Rationale & Lifestyle */}
                {activeTab === 'rationale' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-teal-600" />
                        <span>Biomarker & Physiological Mechanism Analysis</span>
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        This protocol was synthesized by matching the patient's out-of-range analytes with nutritional biochemistry principles. Dietary carbohydrates, lipids, and sodium levels are calibrated to diminish metabolic resistance and decrease vascular/renal organ stress.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-teal-600" />
                        <span>Core Lifestyle & Clinical Monitoring Protocols</span>
                      </h4>
                      <div className="space-y-2.5">
                        {selectedPlan.lifestyle_guidelines?.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white border border-slate-200 rounded-lg text-xs flex items-start gap-2.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-slate-800 font-medium leading-relaxed">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Notes & Verification */}
                {activeTab === 'notes' && (
                  <div className="space-y-5">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Prescribing Clinician
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {selectedPlan.assigned_by || 'Dr. Sarah Jenkins, MD, FACP (Chief Pathologist)'}
                          </div>
                        </div>
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          LIS Certified
                        </span>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-700 mb-1">
                          Clinical Nutrition Remarks
                        </div>
                        <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                          {selectedPlan.nutritionist_notes || 'No custom clinician notes recorded yet.'}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Created: {selectedPlan.created_at}</span>
                        <span>Last Updated: {selectedPlan.updated_at}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleOpenEditModal}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Update Clinician Notes & Prescription
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Clinical Nutrition Prescription • MetroHealth Pathology LIS</span>
                </div>
                {selectedPlan.report_id && onSelectReport && (
                  <button
                    onClick={() => onSelectReport(selectedPlan.report_id!)}
                    className="text-teal-700 hover:text-teal-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View Associated Lab Report ({selectedPlan.report_id})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-400 space-y-3">
              <Salad className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-700">No Patient Plan Selected</h3>
              <p className="text-xs max-w-sm mx-auto">
                Select a patient from the directory on the left or upload an analyzer CSV to generate automated pathology diet plans.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Adjust Modal */}
      {isEditModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Adjust Clinical Diet Prescription
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: {selectedPlan.patient_name} ({selectedPlan.patient_id})
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Daily Caloric Target (kcal)
                </label>
                <input
                  type="number"
                  value={editCalories}
                  onChange={(e) => setEditCalories(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dietary Paradigm / Preference
                </label>
                <select
                  value={editDietPref}
                  onChange={(e) => setEditDietPref(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Standard Balanced">Standard Balanced / Mediterranean</option>
                  <option value="Vegetarian">Strict Lacto-Ovo Vegetarian</option>
                  <option value="Vegan">100% Plant-Based Vegan</option>
                  <option value="Low Carbohydrate">Low Carbohydrate / Ketogenic</option>
                  <option value="DASH Low Sodium">DASH Strict Low Sodium</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Clinician & Nutritionist Instructions
                </label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Enter medical instructions, allergy notes, or consultation follow-up..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdjustments}
                disabled={isSaving}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Prescription'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
};
