'use client';

import { X, Search, ChevronRight, Star, Bell, Timer, Ban, ThumbsDown, Trash2 } from 'lucide-react';
import useAppStore from '@/store';
import Avatar from './shared/Avatar';

interface ContactInfoSidebarProps {
  onSearchClick: () => void;
}

export default function ContactInfoSidebar({ onSearchClick }: ContactInfoSidebarProps) {
  const closeContactInfo = useAppStore((s) => s.closeContactInfo);
  const activeChatId = useAppStore((s) => s.activeChatId);
  const chats = useAppStore((s) => s.chats);
  
  const activeChat = chats.find((c) => c.id === activeChatId);

  if (!activeChat) return null;

  const { participant } = activeChat;

  return (
    <div className="flex h-full w-[400px] flex-col bg-[#f0f2f5] text-gray-900 shadow-xl border-l border-gray-200">
      {/* Header */}
      <div className="flex h-[60px] shrink-0 items-center gap-6 bg-white px-6 border-b border-gray-200">
        <button
          onClick={closeContactInfo}
          className="text-gray-500 transition-colors hover:text-gray-700"
          aria-label="Close contact info"
        >
          <X className="h-6 w-6" />
        </button>
        <span className="text-base font-medium">Contact info</span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Profile Section */}
        <div className="flex flex-col items-center bg-white px-4 py-8 shadow-sm border-b border-gray-200">
          <Avatar name={participant.name} src={participant.avatar} size={200} />
          <h2 className="mt-4 text-2xl font-normal text-gray-900">{participant.name}</h2>
          <p className="mt-1 text-base text-gray-500">
            {participant.email || '+1 (555) 0123-4567'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="my-2 border-y border-gray-200 bg-white py-4 shadow-sm">
          <div 
            className="mx-auto flex w-fit flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onSearchClick}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
              <Search className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Search</span>
          </div>
        </div>

        {/* About Section */}
        <div className="my-2 border-y border-gray-200 bg-white px-7 py-4 shadow-sm">
          <h3 className="mb-1 text-sm text-gray-500">About</h3>
          <p className="text-base text-gray-900">Available</p>
        </div>

        {/* Media, links and docs */}
        <div className="my-2 border-y border-gray-200 bg-white px-7 py-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">Media, links and docs</span>
            <div className="flex items-center gap-1 text-gray-500">
              <span className="text-sm">48</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
          {/* Dummy thumbnails */}
          <div className="flex gap-2">
            <div className="h-20 w-20 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">Image</div>
            <div className="h-20 w-20 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">Image</div>
            <div className="h-20 w-20 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">Image</div>
          </div>
        </div>

        {/* Settings Links */}
        <div className="my-2 border-y border-gray-200 bg-white shadow-sm">
          {/* Starred Messages */}
          <button className="flex w-full items-center justify-between px-7 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <Star className="h-5 w-5 text-gray-500" />
              <span className="text-base text-gray-900">Starred messages</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>

          <hr className="ml-[68px] border-gray-200" />

          {/* Mute Notifications */}
          <button className="flex w-full items-center justify-between px-7 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="text-base text-gray-900">Mute notifications</span>
            </div>
            {/* Custom CSS Toggle Switch */}
            <div className="relative inline-flex h-[14px] w-[34px] cursor-pointer items-center rounded-full bg-gray-300 transition-colors">
              <span className="absolute left-0 inline-block h-5 w-5 rounded-full bg-white shadow transform -translate-x-[2px] transition-transform" />
            </div>
          </button>

          <hr className="ml-[68px] border-gray-200" />

          {/* Disappearing Messages */}
          <button className="flex w-full items-center justify-between px-7 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <Timer className="h-5 w-5 text-gray-500" />
              <div className="flex flex-col items-start">
                <span className="text-base text-gray-900">Disappearing messages</span>
                <span className="text-sm text-gray-500">Off</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Danger Zone Actions */}
        <div className="my-2 border-y border-gray-200 bg-white shadow-sm">
          <button className="flex w-full items-center gap-5 px-7 py-4 hover:bg-gray-50 transition-colors text-red-500">
            <Ban className="h-5 w-5" />
            <span className="text-base">Block {participant.name}</span>
          </button>
          <hr className="ml-[68px] border-gray-200" />
          <button className="flex w-full items-center gap-5 px-7 py-4 hover:bg-gray-50 transition-colors text-red-500">
            <ThumbsDown className="h-5 w-5" />
            <span className="text-base">Report {participant.name}</span>
          </button>
          <hr className="ml-[68px] border-gray-200" />
          <button className="flex w-full items-center gap-5 px-7 py-4 hover:bg-gray-50 transition-colors text-red-500">
            <Trash2 className="h-5 w-5" />
            <span className="text-base">Delete chat</span>
          </button>
        </div>
        
        {/* Spacer at bottom */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
