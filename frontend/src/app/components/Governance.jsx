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

  const handleVote = async (support) => {
    if (!votingProposal) return;
    
    try {
      setIsVoting(true);
      await voteOnProposal(governanceAddress, votingProposal.id, support);
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
                
                <button 
                  onClick={() => {
                    setVotingProposal(proposal);
                    if (voteModalRef.current) {
                      voteModalRef.current.showModal();
                    }
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 text-sm rounded"
                >
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
      
      {/* Vote Modal - Moved outside the loop */}
      <dialog 
        ref={voteModalRef}
        className="rounded-xl shadow-2xl backdrop:bg-black/50 p-0 max-w-md w-full"
      >
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Cast Your Vote</h3>
          
          {votingProposal && (
            <>
              <h4 className="font-bold text-lg mb-2">{votingProposal.title}</h4>
              <p className="text-gray-600 mb-4">{votingProposal.description}</p>
              
              <div className="flex space-x-4">
                <button 
                  disabled={isVoting}
                  onClick={() => handleVote(true)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded disabled:opacity-50"
                >
                  {isVoting ? 'Processing...' : 'Vote For'}
                </button>
                <button 
                  disabled={isVoting}
                  onClick={() => handleVote(false)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded disabled:opacity-50"
                >
                  {isVoting ? 'Processing...' : 'Vote Against'}
                </button>
              </div>
            </>
          )}
          
          <button 
            className="mt-4 w-full py-2 border border-gray-300 rounded text-gray-700"
            onClick={() => voteModalRef.current?.close()}
          >
            Cancel
          </button>
        </div>
      </dialog>
      
      {/* Proposal Creation Modal */}
      <dialog id="proposal-modal" className="rounded-xl shadow-2xl backdrop:bg-black/50 p-0 max-w-md w-full">
        {/* ... existing proposal modal code ... */}
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