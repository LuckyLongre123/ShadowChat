import ChatLayout from '@/components/chat/ChatLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShadowChat — Conversations',
  description: 'Your real-time end-to-end encrypted chat experience.',
};

/**
 * Server Component – acts purely as a route wrapper.
 * All interactivity is delegated to client components below.
 */
export default function ChatPage() {
  return <ChatLayout />;
}
