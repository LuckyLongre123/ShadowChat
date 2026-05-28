export type SettingsTab = 'profile' | 'notifications' | 'privacy' | null;

export interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabSelect: (tab: SettingsTab) => void;
}

export interface MenuRowProps {
  id: SettingsTab;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  active: boolean;
  onSelect: (tab: SettingsTab) => void;
  danger?: boolean;
}

export interface PrivacyViewProps {
  onBack: () => void;
}
