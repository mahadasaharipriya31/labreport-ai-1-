import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, CheckCircle2, Monitor } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'sidebar' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running in standalone mode (already installed as PWA mobile app)
  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-800/40 rounded-lg text-[11px] font-semibold text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Mobile App Installed</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'navbar' && (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer ${className}`}
          title="Install LabReport AI Mobile App"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xs:inline">Install Mobile App</span>
          <span className="xs:hidden">App</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-blue-900/60 to-teal-900/60 hover:from-blue-900 hover:to-teal-900 border border-blue-500/30 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm ${className}`}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-400 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">Install Mobile App</div>
              <div className="text-[10px] text-teal-200/80 font-normal">Add to Home Screen</div>
            </div>
          </div>
          <Download className="w-3.5 h-3.5 text-teal-300 shrink-0" />
        </button>
      )}

      {variant === 'card' && (
        <div className={`bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-800/40 rounded-2xl p-5 text-white shadow-md relative overflow-hidden ${className}`}>
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">LabReport AI for Mobile & Tablet</h3>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-400/30 px-1.5 py-0.5 rounded font-bold">
                    PWA Ready
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Install LabReport AI directly onto your iPhone, Android, or tablet. Works offline with fast instant access to pathology reports and patient diet plans.
                </p>
              </div>
            </div>
            <button
              onClick={handleClick}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install to Home Screen</span>
            </button>
          </div>
        </div>
      )}

      {/* Installation Guide Modal (Supports Android, iOS Safari & Desktop) */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-slate-900 relative">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Install LabReport AI Mobile App</h3>
                <p className="text-xs text-slate-500">Standalone pathology assistant on your home screen</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>iPhone / iPad (iOS Safari) Instructions:</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>
                    Tap the <strong className="text-slate-900 inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 text-blue-600" /> Share button</strong> in the bottom Safari toolbar.
                  </li>
                  <li>
                    Scroll down and select <strong className="text-slate-900 inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-blue-600" /> Add to Home Screen</strong>.
                  </li>
                  <li>
                    Tap <strong>Add</strong> in the top-right corner. The app icon will appear on your phone screen!
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-teal-600" />
                  <span>Android (Chrome / Edge / Firefox) Instructions:</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>
                    Tap the <strong>three dots menu (⋮)</strong> in your mobile browser.
                  </li>
                  <li>
                    Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.
                  </li>
                  <li>
                    Confirm install. LabReport AI will run as a native standalone app!
                  </li>
                </ol>

                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-slate-500 text-[11px]">
                  <Monitor className="w-3.5 h-3.5 text-slate-400" />
                  <span>On Desktop: Click the install icon in your browser address bar.</span>
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center gap-2">
              {isInstallable && (
                <button
                  onClick={async () => {
                    await install();
                    setShowGuide(false);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Prompt Install Now</span>
                </button>
              )}
              <button
                onClick={() => setShowGuide(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
