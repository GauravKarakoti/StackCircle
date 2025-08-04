'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import '../globals.css';

// Dynamically import WalletSection to avoid SSR issues
const WalletSection = dynamic(() => import('./WalletSection'), {
  ssr: false,
});

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="bg-white rounded-full p-1 shadow-lg ring-2 ring-orange-500 transition group-hover:ring-orange-300">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 w-8 h-8 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-base">₿</span>
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