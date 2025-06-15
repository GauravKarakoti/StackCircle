import { useCitrea } from '../contexts/CitreaContext';
import CircleWizard from '../components/CircleWizard';
import '../globals.css';

export default function Home() {
  const { account, connectWallet } = useCitrea();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-orange-600 mb-4">
            Stack Bitcoin Together
          </h1>
          <p className="text-lg text-gray-600">
            Create social savings circles with friends, families, or communities.<br />
            Achieve your financial goals on Bitcoin's first ZK Rollup.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">Create a Stacking Circle</h2>
          {account ? (
            <CircleWizard />
          ) : (
            <div className="text-center py-8">
              <button 
                onClick={connectWallet}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg text-lg"
              >
                Connect Wallet to Get Started
              </button>
              <p className="mt-4 text-gray-600">
                Connect your wallet to create your first stacking circle
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-2">1. Create Circle</h3>
            <p className="text-gray-700">
              Set a savings goal and contribution schedule for your group
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-2">2. Invite Members</h3>
            <p className="text-gray-700">
              Add friends, family, or community members to your circle
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-2">3. Stack Together</h3>
            <p className="text-gray-700">
              Contribute regularly and track your progress toward the goal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}