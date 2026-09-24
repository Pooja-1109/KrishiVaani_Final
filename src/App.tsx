/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { AuthScreen } from './components/auth/AuthScreen';
import { FarmerDashboard } from './components/dashboards/FarmerDashboard';
import { BuyerDashboard } from './components/dashboards/BuyerDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { Module1MarketPrices } from './components/modules/Module1MarketPrices';
import { Module2NetRealisation } from './components/modules/Module2NetRealisation';
import { Module3FPOAggregation } from './components/modules/Module3FPOAggregation';
import { Module4SellOrWait } from './components/modules/Module4SellOrWait';
import { Module5BuyerBidding } from './components/modules/Module5BuyerBidding';
import { Module6CropRescue } from './components/modules/Module6CropRescue';
import { TransactionsView } from './components/modules/TransactionsView';
import { NotificationsModal } from './components/modules/NotificationsModal';
import { ProfileView } from './components/modules/ProfileView';
import { FarmerOnboardingModal } from './components/auth/FarmerOnboardingModal';
import { api } from './services/api';

function MainApp() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [targetCropIdForCalc, setTargetCropIdForCalc] = useState<number | undefined>(undefined);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showFarmerOnboarding, setShowFarmerOnboarding] = useState<boolean>(false);

  // Sync tab on role load & check new signup
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      setCurrentTab('adminDashboard');
    } else {
      setCurrentTab('dashboard');
    }

    if (user?.role === 'FARMER') {
      try {
        const isNewSignup = sessionStorage.getItem('krishivaani_new_signup');
        if (isNewSignup === 'true') {
          setShowFarmerOnboarding(true);
        }
      } catch (_) {}
    }
  }, [user?.role]);

  // Check unread notifications
  useEffect(() => {
    if (!user) return;
    api.getNotifications().then((notifs) => {
      const unread = notifs.filter((n) => !n.read).length;
      setUnreadCount(unread);
    }).catch(() => {});
  }, [user, currentTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-stone-600 tracking-wide">
            {t.common.loading}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Navbar
          currentTab="auth"
          onSelectTab={() => {}}
          onOpenNotifications={() => {}}
          unreadCount={0}
        />
        <AuthScreen />
      </div>
    );
  }

  const navigateToTab = (tab: string, extra?: any) => {
    if (extra && typeof extra === 'number') {
      setTargetCropIdForCalc(extra);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={navigateToTab}
        onOpenNotifications={() => setShowNotifications(true)}
        unreadCount={unreadCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* FARMER VIEWS */}
        {user.role === 'FARMER' && (
          <>
            {currentTab === 'dashboard' && (
              <FarmerDashboard
                onNavigate={navigateToTab}
                onOpenVoiceSetup={() => setShowFarmerOnboarding(true)}
              />
            )}
            {currentTab === 'module1' && (
              <Module1MarketPrices
                onNavigateToNetCalculator={(cropId) => {
                  setTargetCropIdForCalc(cropId);
                  setCurrentTab('module2');
                }}
              />
            )}
            {currentTab === 'module2' && (
              <Module2NetRealisation initialCropId={targetCropIdForCalc} />
            )}
            {currentTab === 'module3' && (
              <Module3FPOAggregation
                onAnalyzeLotInNetCalculator={(cropId) => {
                  setTargetCropIdForCalc(cropId);
                  setCurrentTab('module2');
                }}
              />
            )}
            {currentTab === 'module4' && <Module4SellOrWait />}
            {currentTab === 'module5' && <Module5BuyerBidding onNavigate={navigateToTab} />}
            {currentTab === 'module6' && <Module6CropRescue />}
            {currentTab === 'transactions' && <TransactionsView onNavigate={navigateToTab} />}
            {currentTab === 'profile' && <ProfileView />}
          </>
        )}

        {/* BUYER VIEWS */}
        {user.role === 'BUYER' && (
          <>
            {currentTab === 'dashboard' && <BuyerDashboard onNavigate={navigateToTab} />}
            {currentTab === 'module1' && (
              <Module1MarketPrices
                onNavigateToNetCalculator={(cropId) => {
                  setTargetCropIdForCalc(cropId);
                  setCurrentTab('module2');
                }}
              />
            )}
            {currentTab === 'module2' && (
              <Module2NetRealisation initialCropId={targetCropIdForCalc} />
            )}
            {(currentTab === 'module5' ||
              currentTab === 'buyerRequirements' ||
              currentTab === 'matchedProduce' ||
              currentTab === 'bidding') && (
              <Module5BuyerBidding
                initialView={
                  currentTab === 'matchedProduce'
                    ? 'produce'
                    : currentTab === 'bidding'
                    ? 'bids'
                    : 'requirements'
                }
                onNavigate={navigateToTab}
              />
            )}
            {currentTab === 'transactions' && <TransactionsView onNavigate={navigateToTab} />}
            {currentTab === 'profile' && <ProfileView />}
          </>
        )}

        {/* ADMIN VIEWS */}
        {user.role === 'ADMIN' && (
          <>
            {(currentTab === 'adminDashboard' ||
              currentTab === 'adminUsers' ||
              currentTab === 'adminFarmers' ||
              currentTab === 'adminBuyers' ||
              currentTab === 'adminMarkets' ||
              currentTab === 'adminRescue') && <AdminDashboard />}
            {currentTab === 'profile' && <ProfileView />}
          </>
        )}
      </main>

      {/* Notifications Drawer / Modal */}
      {showNotifications && (
        <NotificationsModal
          onClose={() => {
            setShowNotifications(false);
            setUnreadCount(0);
          }}
        />
      )}

      {/* Farmer Onboarding / Voice Setup Modal */}
      {showFarmerOnboarding && (
        <FarmerOnboardingModal
          onComplete={() => {
            setShowFarmerOnboarding(false);
            try {
              sessionStorage.removeItem('krishivaani_new_signup');
            } catch (_) {}
          }}
        />
      )}

      {/* Shared Deep Forest Footer */}
      <footer className="border-t border-[#153B32]/40 bg-[#153B32] text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D6A844]"></span>
                <strong className="font-serif text-[#F6F1E5] text-lg tracking-tight font-black">{t.common.appName}</strong>
              </div>
              <p className="text-xs text-stone-300 max-w-md">
                {t.common.appTagline}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-300 font-medium">
              <button onClick={() => setCurrentTab('dashboard')} className="hover:text-white transition-colors cursor-pointer">
                {t.nav.dashboard}
              </button>
              <button onClick={() => setCurrentTab('module1')} className="hover:text-white transition-colors cursor-pointer">
                {t.nav.module1}
              </button>
              <button onClick={() => setCurrentTab('module2')} className="hover:text-white transition-colors cursor-pointer">
                {t.nav.module2}
              </button>
              <button onClick={() => setCurrentTab('module4')} className="hover:text-white transition-colors cursor-pointer">
                {t.nav.module4}
              </button>
              <button onClick={() => setCurrentTab('module5')} className="hover:text-white transition-colors cursor-pointer">
                {t.nav.module5}
              </button>
              <button onClick={() => setCurrentTab('module6')} className="hover:text-white transition-colors cursor-pointer">
                {t.nav.module6}
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
            <div>
              © {new Date().getFullYear()} {t.common.appName}. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-[11px] text-stone-400">
              <span>Maharashtra APMC Network</span>
              <span>•</span>
              <span>Open-Meteo Telemetry</span>
              <span>•</span>
              <span>Agmarknet Verified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
