import PropTypes from 'prop-types';
import { useState } from 'react';

const Governance = ({ circleId, proposals }) => {
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    type: 'DONATION',
    amount: '',
    recipient: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProposal(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateProposal = () => {
    alert(`Proposal "${newProposal.title}" created successfully!`);
    setNewProposal({
      title: '',
      description: '',
      type: 'DONATION',
      amount: '',
      recipient: ''
    });
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Circle Governance</h3>
        <button 
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm py-1 px-3 rounded"
          onClick={() => document.getElementById('proposal-modal').showModal()}
        >
          New Proposal
        </button>
      </div>
      
      {proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map(proposal => (
            <div key={proposal.id} className="border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between">
                <h4 className="font-bold text-lg">{proposal.title}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  proposal.type === 'DONATION' ? 'bg-purple-100 text-purple-800' : 
                  proposal.type === 'WITHDRAWAL' ? 'bg-blue-100 text-blue-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {proposal.type}
                </span>
              </div>
              <p className="text-gray-600 my-2">{proposal.description}</p>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                    <span className="text-sm">{proposal.votesFor} For</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                    <span className="text-sm">{proposal.votesAgainst} Against</span>
                  </div>
                </div>
                
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 text-sm rounded">
                  Vote Now
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-orange-50 rounded-lg">
          <p className="text-gray-600">No active proposals yet</p>
          <button 
            className="mt-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
            onClick={() => document.getElementById('proposal-modal').showModal()}
          >
            Create First Proposal
          </button>
        </div>
      )}
      
      {/* Proposal Creation Modal */}
      <dialog id="proposal-modal" className="rounded-xl shadow-2xl backdrop:bg-black/50 p-0 max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Create New Proposal</h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Proposal Title</label>
            <input
              type="text"
              name="title"
              value={newProposal.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
              placeholder="What's your proposal about?"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={newProposal.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
              rows="3"
              placeholder="Explain your proposal in detail..."
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Proposal Type</label>
            <select
              name="type"
              value={newProposal.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="DONATION">Donation</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="PARAM_CHANGE">Parameter Change</option>
            </select>
          </div>
          
          {(newProposal.type === 'DONATION' || newProposal.type === 'WITHDRAWAL') && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Amount (BTC)</label>
                <input
                  type="number"
                  name="amount"
                  value={newProposal.amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="0.00"
                  step="0.001"
                  min="0.001"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  {newProposal.type === 'DONATION' ? 'Recipient Address' : 'Withdrawal Address'}
                </label>
                <input
                  type="text"
                  name="recipient"
                  value={newProposal.recipient}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="bc1q..."
                />
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button 
              className="px-4 py-2 border border-gray-300 rounded text-gray-700"
              onClick={() => document.getElementById('proposal-modal').close()}
            >
              Cancel
            </button>
            <button 
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
              onClick={handleCreateProposal}
            >
              Create Proposal
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

Governance.propTypes = {
  circleId: PropTypes.number.isRequired,
  proposals: PropTypes.array.isRequired
};

export default Governance;