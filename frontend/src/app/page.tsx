import InstallPWA_Popup from '@/components/chat/InstallPWA_Popup';
import GoogleLoginButton from '@/components/common/GoogleLoginButton';
import { MessageSquare, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <InstallPWA_Popup />
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <MessageSquare className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to ShadowChat
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Log in to connect with your friends and family.
          </p>
        </div>

        <div className="space-y-4">
          <GoogleLoginButton />

          <div className="relative flex items-center py-2">
            <div className="grow border-t border-gray-200"></div>
            <span className="shrink-0 px-4 text-xs text-gray-400">or</span>
            <div className="grow border-t border-gray-200"></div>
          </div>

          <button
            disabled
            className="w-full cursor-not-allowed rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-500"
          >
            Phone Login (Coming Soon)
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-2 text-xs text-gray-400">
          <ShieldCheck className="h-4 w-4" />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}
