import { SettingsTab } from '@/types/setting.types';
import NotificationsView from '../views/NotificationsView';
import PrivacyView from '../views/PrivacyView';
import ProfileView from '../views/ProfileView';
import EmptyDetailView from './EmptyDetailView';

export default function renderDetailView(
  activeTab: SettingsTab,
  onBack: () => void
): React.ReactNode {
  switch (activeTab) {
    case 'profile':
      return <ProfileView onBack={onBack} />;
    case 'notifications':
      return <NotificationsView onBack={onBack} />;
    case 'privacy':
      return <PrivacyView onBack={onBack} />;
    default:
      return <EmptyDetailView />;
  }
}
