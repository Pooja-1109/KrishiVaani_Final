import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, SupportedLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/api';
import {
  Sprout,
  TrendingUp,
  Scale,
  Users,
  Clock,
  Handshake,
  ShieldAlert,
  Receipt,
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Languages,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNotifications,
  unreadCount = 0,
}) => {
  const { user, profile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getFarmerNavItems = () => [
    { id: 'dashboard', label: t.nav.dashboard, icon: Sprout },
    { id: 'module1', label: t.nav.module1, icon: TrendingUp },
    { id: 'module2', label: t.nav.module2, icon: Scale },
    { id: 'module3', label: t.nav.module3, icon: Users },
    { id: 'module4', label: t.nav.module4, icon: Clock },
    { id: 'module5', label: t.nav.module5, icon: Handshake },
    { id: 'module6', label: t.nav.module6, icon: ShieldAlert },
    { id: 'transactions', label: t.nav.transactions, icon: Receipt },
  ];

  const getBuyerNavItems = () => [
    { id: 'dashboard', label: t.nav.dashboard, icon: Sprout },
    { id: 'buyerRequirements', label: t.nav.buyerRequirements, icon: Scale },
    { id: 'matchedProduce', label: t.nav.matchedProduce, icon: TrendingUp },
    { id: 'bidding', label: t.nav.bidding, icon: Handshake },
    { id: 'transactions', label: t.nav.transactions, icon: Receipt },
  ];

  const getAdminNavItems = () => [
    { id: 'adminDashboard', label: t.nav.dashboard, icon: Sprout },
    { id: 'adminUsers', label: t.nav.adminUsers, icon: Users },
    { id: 'adminFarmers', label: t.nav.adminFarmers, icon: Sprout },
    { id: 'adminBuyers', label: t.nav.adminBuyers, icon: Handshake },
    { id: 'adminMarkets', label: t.nav.adminMarkets, icon: TrendingUp },
    { id: 'adminRescue', label: t.nav.adminRescue, icon: ShieldAlert },
  ];

  const navItems =
    user?.role === 'FARMER'
      ? getFarmerNavItems()
      : user?.role === 'BUYER'
      ? getBuyerNavItems()
      : user?.role === 'ADMIN'
      ? getAdminNavItems()
      : [];

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    if (user) {
      api.updateLanguage(lang).catch(() => {});
    }
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    if (user.role === 'FARMER' && profile && 'full_name' in profile) {
      return profile.full_name.split(' ')[0];
    }
    if (user.role === 'BUYER' && profile && 'business_name' in profile) {
      return profile.business_name;
    }
    if (user.role === 'ADMIN') return 'Admin';
    return user.mobile;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single Wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab(user?.role === 'ADMIN' ? 'adminDashboard' : 'dashboard')}
              className="flex items-center gap-2 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-xs">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-[#173D32] block leading-none font-serif">
                  {t.common.appName}
                </span>
                <span className="text-[10px] text-stone-700 font-medium block mt-0.5">
                  {user?.role === 'FARMER'
                    ? (language === 'mr' ? 'शेतकरी मंच' : language === 'hi' ? 'किसान मंच' : 'Farmer Platform')
                    : user?.role === 'BUYER'
                    ? (language === 'mr' ? 'खरेदीदार कक्ष' : language === 'hi' ? 'व्यापारी डेस्क' : 'Buyer Desk')
                    : user?.role === 'ADMIN'
                    ? (language === 'mr' ? 'प्रशासन कक्ष' : language === 'hi' ? 'प्रशासनिक कक्ष' : 'Admin Console')
                    : t.common.appTagline}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          {user && (
            <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-2">
              {navItems.slice(0, 6).map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={`nav-top-${item.id}`}
                    onClick={() => onSelectTab(item.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-stone-700'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {navItems.length > 6 && (
                <div className="relative group">
                  <button className="px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md">
                    {language === 'mr' ? 'अधिक...' : language === 'hi' ? 'अधिक...' : 'More...'}
                  </button>
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-stone-200 rounded-lg shadow-lg py-1 hidden group-hover:block z-50">
                    {navItems.slice(6).map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={`nav-more-${item.id}`}
                          onClick={() => onSelectTab(item.id)}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2"
                        >
                          <Icon className="w-3.5 h-3.5 text-stone-700" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </nav>
          )}

          {/* Zone 3: Actions (Language, Notifs, Profile, Logout) */}
          <div className="flex items-center gap-2">
            {/* Global Language Selector */}
            <div className="flex items-center bg-stone-100 rounded-md p-0.5 border border-stone-200 text-xs">
              <Languages className="w-3.5 h-3.5 text-stone-700 ml-1.5 mr-0.5" />
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-1 font-semibold rounded-sm transition-colors ${
                  language === 'en'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageChange('mr')}
                className={`px-2 py-1 font-semibold rounded-sm transition-colors ${
                  language === 'mr'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => handleLanguageChange('hi')}
                className={`px-2 py-1 font-semibold rounded-sm transition-colors ${
                  language === 'hi'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {user ? (
              <>
                {/* Notifications Bell */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                  title={t.nav.notifications}
                  aria-label={t.nav.notifications}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full"></span>
                  )}
                </button>

                {/* Profile Link */}
                <button
                  onClick={() => onSelectTab('profile')}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-md max-w-[140px] truncate"
                  title={t.nav.profile}
                >
                  <UserIcon className="w-3.5 h-3.5 text-stone-700 shrink-0" />
                  <span className="truncate">{getUserDisplayName()}</span>
                </button>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="p-2 text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                  title={t.nav.logout}
                  aria-label={t.nav.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : null}

            {/* Mobile Hamburger */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-md"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && user && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <div className="px-2 py-1.5 text-xs text-stone-700 font-bold border-b border-stone-100 mb-1">
            {getUserDisplayName()} ({user.role})
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={`nav-mobile-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md flex items-center gap-2 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-700'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-4 h-4 text-stone-700" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              onSelectTab('profile');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-md flex items-center gap-2"
          >
            <UserIcon className="w-4 h-4 text-stone-700" />
            <span>{t.nav.profile}</span>
          </button>
          <button
            onClick={() => {
              logout();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-md flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.nav.logout}</span>
          </button>
        </div>
      )}
    </header>
  );
};
