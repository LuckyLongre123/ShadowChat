'use client';

import { SettingsTab } from '@/types/setting.types';
import { useCallback, useEffect, useState } from 'react';
import SettingsSidebar from './SettingsSidebar';
import renderDetailView from './common/renderDetailView';

export default function SettingsLayout() {
  // 🌟 FIX 1: Lazy State Initialization (No more synchronous cascading renders!)
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(min-width: 768px)').matches ? 'profile' : null;
    }
    return null;
  });

  // 🌟 FIX 2: Clean Effect (Only handles dynamic resizing / external browser changes)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Agar user screen resize karke desktop par laye, aur kuch select na ho, toh profile kholo
      if (e.matches) {
        setActiveTab((prev) => (prev === null ? 'profile' : prev));
      }
    };

    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const handleTabSelect = useCallback((tab: SettingsTab) => {
    setActiveTab(tab);
  }, []);

  const handleBack = useCallback(() => {
    setActiveTab(null);
  }, []);

  const showSidebar = activeTab === null;
  const showDetail = activeTab !== null;

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50">
      {/* ── LEFT PANE ── */}
      <div
        className={[
          'w-full shrink-0 border-r border-slate-200 bg-white',
          'md:flex md:w-85 md:flex-col lg:w-95',
          showSidebar ? 'flex flex-col' : 'hidden',
        ].join(' ')}
      >
        <SettingsSidebar activeTab={activeTab} onTabSelect={handleTabSelect} />
      </div>

      {/* ── RIGHT PANE ── */}
      <div
        className={[
          'flex-1 overflow-hidden',
          'md:flex md:flex-col',
          showDetail ? 'flex flex-col' : 'hidden',
        ].join(' ')}
      >
        {renderDetailView(activeTab, handleBack)}
      </div>
    </div>
  );
}
