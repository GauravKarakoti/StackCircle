'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import WalletSection to avoid SSR issues
const WalletSection = dynamic(() => import('./WalletSection'), {
  ssr: false,
});

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="bg-white rounded-full p-1 shadow-lg ring-2 ring-orange-400 transition">
            <div className="bg-orange-500 w-7 h-7 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">₿</span>
            </div>
          </div>
          <span className="text-2xl font-extrabold tracking-tight group-hover:text-orange-100 transition">StackCircle</span>
        </Link>
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="hover:text-orange-100 transition font-medium">
            Dashboard
          </Link>
          <WalletSection />
        </div>
      </div>
    </header>
  );
}