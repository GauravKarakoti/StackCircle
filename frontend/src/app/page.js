"use client";

import { useCitrea } from './contexts/CitreaContext';
import CircleWizard from "./components/CircleWizard";

export default function Home() {
  const { account, connectWallet } = useCitrea();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-12">
        <div className="text-center mb-14">
          <h1 className="text-5xl font-extrabold text-orange-600 mb-4 drop-shadow-sm">
            Stack Bitcoin Together
          </h1>
          <p className="text-xl text-gray-600">
            Create social savings circles with friends, families, or communities.<br />
            Achieve your financial goals on Bitcoin&apos;s first ZK Rollup.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-14 border border-orange-100 hover:border-orange-300 transition">
          <h2 className="text-3xl font-bold text-center mb-8 text-orange-500">Create a Stacking Circle</h2>
          {account ? (
            <CircleWizard />
          ) : (
            <div className="text-center py-10">
              <button 
                onClick={connectWallet}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transition"
              >
                Connect Wallet to Get Started
              </button>
              <p className="mt-5 text-gray-500">
                Connect your wallet to create your first stacking circle
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-orange-50 rounded-xl p-8 shadow hover:shadow-lg transition flex flex-col items-center">
            <div className="mb-3 text-3xl">🎯</div>
            <h3 className="font-bold text-lg mb-2 text-orange-600">1. Create Circle</h3>
            <p className="text-gray-700 text-center">
              Set a savings goal and contribution schedule for your group
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl p-8 shadow hover:shadow-lg transition flex flex-col items-center">
            <div className="mb-3 text-3xl">🤝</div>
            <h3 className="font-bold text-lg mb-2 text-orange-600">2. Invite Members</h3>
            <p className="text-gray-700 text-center">
              Add friends, family, or community members to your circle
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl p-8 shadow hover:shadow-lg transition flex flex-col items-center">
            <div className="mb-3 text-3xl">💰</div>
            <h3 className="font-bold text-lg mb-2 text-orange-600">3. Stack Together</h3>
            <p className="text-gray-700 text-center">
              Contribute regularly and track your progress toward the goal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}