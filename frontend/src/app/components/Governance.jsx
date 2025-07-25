import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import { useCitrea } from '../contexts/CitreaContext';
import toast from 'react-hot-toast';

const Governance = ({ circleId, governanceAddress, proposals, updateProposals }) => {
  const { createProposal, fetchProposals, voteOnProposal } = useCitrea();
  const [votingProposal, setVotingProposal] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [userVotes, setUserVotes] = useState({});
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    type: 'DONATION',
    amount: '',
    recipient: ''
  });
  
  // Create ref for vote modal
  const voteModalRef = useRef(null);

  const checkUserVotes = async (proposals) => {    
    const votes = {};
    for (const proposal of proposals) {
      votes[proposal.id] = false; 
    }
    setUserVotes(votes);
  };

  useEffect(() => {
    if (proposals.length > 0) {
      checkUserVotes(proposals);
    }
  }, [proposals]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProposal(prev => ({ ...prev, [name]: value }));
  };

  const refetchProposals = async () => {
    const proposalIds = proposals.map(p => p.id);
    const updated = await fetchProposals(governanceAddress, proposalIds);
    updateProposals(circleId, updated);
  };

  const handleVote = async (id, support) => {    
    try {
      setIsVoting(true);
      await voteOnProposal(governanceAddress, id, support);
      await refetchProposals();
      toast.success(`Voted ${support ? 'FOR' : 'AGAINST'} proposal!`);
      
      // Close the modal explicitly
      if (voteModalRef.current) {
        voteModalRef.current.close();
      }
      setVotingProposal(null);
    } catch (error) {
      toast.error(`Vote failed: ${error.message}`);
    } finally {
      setIsVoting(false);
    }
  };

  const handleCreateProposal = async () => {
    try {
      await createProposal(circleId, newProposal);
      await refetchProposals();
      
      setNewProposal({ title: '', description: '', type: 'DONATION', amount: '', recipient: '' });
      document.getElementById('proposal-modal').close();
      toast.success("Proposal created!");
    } catch(error) {
      toast.error(`Failed: ${error.message}`);
    }
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
            <div key={proposal.id} className="border border-orange-200 rounded-xl bg-white overflow-hidden p-4 hover:shadow-md transition-shadow">
              <div className={`p-4 ${
                proposal.type === 'WITHDRAWAL' ? 'bg-blue-50' : 
                proposal.type === 'DONATION' ? 'bg-purple-50' : 
                'bg-green-50'
              }`}>
                <div className="flex justify-between">
                  <h4 className="font-bold text-lg">{proposal.title}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${
                    proposal.type === 'DONATION' ? 'bg-blue-100 text-blue-800' : 
                    proposal.type === 'WITHDRAWAL' ? 'bg-purple-100 text-purple-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {proposal.type}
                  </span>
                </div>
                <p className="text-gray-600 my-2">{proposal.description}</p>
              </div>

              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Deadline</span>
                  <span className="font-medium">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-orange-500" 
                    style={{ 
                      width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100}%` 
                    }}
                  />
                </div>
                
                <div className="flex justify-between">
                  <button 
                    onClick={() => handleVote(proposal.id, true)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-l-md"
                  >
                    For ({proposal.votesFor})
                  </button>
                  <button 
                    onClick={() => handleVote(proposal.id, false)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-r-md"
                  >
                    Against ({proposal.votesAgainst})
                  </button>
                </div>
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
  proposals: PropTypes.array.isRequired,
  updateProposals: PropTypes.func.isRequired
};

export default Governance;