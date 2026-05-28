'use client';

import useAppStore from '@/store';
import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Avatar from '../shared/Avatar';

export default function UserProfile() {
  const router = useRouter();
  const user = useAppStore((st) => st.user);
  const logout = useAppStore((st) => st.logout);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    const logoutPromise = logout();
    toast.promise(logoutPromise, {
      loading: 'Logging out...',
      success: 'Logged out successfully!',
      error: 'Failed to logout. Try again.',
    });
    await logoutPromise;
    router.push('/');
  };

  const handleViewProfile = () => {
    setIsOpen(false);
    router.push('/settings');
  };

  if (!user) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* User Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100 active:bg-gray-200"
        aria-label="Open user menu"
        aria-expanded={isOpen}
      >
        <div className="shrink-0">
          <Avatar name={user.name} src={user.avatar} size={40} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-gray-900">
            {user.name}
          </p>
          <p className="truncate text-xs text-gray-500">Online</p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 bottom-full z-50 mb-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* View Profile Option */}
          <button
            onClick={handleViewProfile}
            className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <User className="h-4 w-4 text-green-600" />
            <span className="font-medium">View Profile</span>
          </button>

          {/* Logout Option */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
