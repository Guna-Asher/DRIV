import React, { useState, useEffect, useContext } from 'react';
import { Plus, CheckCircle, XCircle, Clock, AlertTriangle, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { AuthContext } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';

const statusIcons = {
  pending: Clock,
  verified: CheckCircle,
  rejected: XCircle
};

const statusColors = {
  pending: 'amber',
  verified: 'green',
  rejected: 'red'
};

export default function VerificationPage() {
  const { API } = useContext(AuthContext);
  const [verifications, setVerifications] = useState([]);
  const [vaults, setVaults] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    vault_id: '',
    submitted_by: '',
    evidence_type: 'death_certificate',
    evidence_url: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [verificationsRes, vaultsRes, partiesRes] = await Promise.all([
        axios.get(`${API}/death-verifications`),
        axios.get(`${API}/vaults`),
        axios.get(`${API}/trusted-parties`)
      ]);
      setVerifications(verificationsRes.data);
      setVaults(vaultsRes.data);
      setParties(partiesRes.data);
      if (vaultsRes.data.length > 0 && !formData.vault_id) {
        setFormData(prev => ({ ...prev, vault_id: vaultsRes.data[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/death-verifications`, formData);
      toast.success('Verification submitted');
      setShowCreate(false);
      setFormData({ vault_id: vaults[0]?.id || '', submitted_by: '', evidence_type: 'death_certificate', evidence_url: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit verification');
    }
  };

  const handleUpdateStatus = async (verificationId, newStatus) => {
    try {
      await axios.patch(`${API}/death-verifications/${verificationId}/status?status=${newStatus}`);
      toast.success(`Verification ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const verifiedCount = verifications.filter(v => v.status === 'verified').length;
  const pendingCount = verifications.filter(v => v.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-950 text-white" data-testid="verification-page">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Death Verification</h1>
            <p className="text-gray-400">Multi-signature verification system for vault unlocking</p>
          </div>
          <Button 
            onClick={() => setShowCreate(true)}
            data-testid="submit-verification-btn"
            disabled={vaults.length === 0 || parties.length === 0}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Submit Verification
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass p-6" data-testid="verification-stats">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Verifications</p>
                <p className="text-3xl font-bold neon-text">{verifications.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-cyan-400" />
            </div>
          </Card>
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Verified</p>
                <p className="text-3xl font-bold text-green-400">{verifiedCount}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </Card>
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Pending</p>
                <p className="text-3xl font-bold text-amber-400">{pendingCount}</p>
              </div>
              <Clock className="w-12 h-12 text-amber-400" />
            </div>
          </Card>
        </div>

        {vaults.length === 0 ? (
          <Card className="glass p-12 text-center" data-testid="no-vaults-warning">
            <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Create a vault first</h3>
            <p className="text-gray-400">You need to create a vault before submitting verifications</p>
          </Card>
        ) : parties.length === 0 ? (
          <Card className="glass p-12 text-center" data-testid="no-parties-warning">
            <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Add trusted parties first</h3>
            <p className="text-gray-400">You need to add trusted parties (verifiers) before submitting verifications</p>
          </Card>
        ) : loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : verifications.length === 0 ? (
          <Card className="glass p-12 text-center" data-testid="no-verifications">
            <CheckCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No verifications yet</h3>
            <p className="text-gray-400 mb-4">Verifications are submitted by trusted parties to unlock your vault</p>
            <Button onClick={() => setShowCreate(true)} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" /> Submit Mock Verification
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {verifications.map((verification) => {
              const StatusIcon = statusIcons[verification.status] || Clock;
              const statusColor = statusColors[verification.status] || 'amber';
              const party = parties.find(p => p.id === verification.submitted_by);
              
              return (
                <Card key={verification.id} className="glass p-6" data-testid={`verification-card-${verification.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <StatusIcon className={`w-8 h-8 text-${statusColor}-400 flex-shrink-0`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold neon-text">{verification.evidence_type.replace('_', ' ')}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs bg-${statusColor}-600/20 text-${statusColor}-400`}>
                            {verification.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          Submitted by: {party?.name || 'Unknown'} ({party?.email || 'N/A'})
                        </p>
                        {verification.notes && (
                          <p className="text-gray-400 text-sm mb-2">Notes: {verification.notes}</p>
                        )}
                        {verification.evidence_url && (
                          <a href={verification.evidence_url} target="_blank" rel="noopener noreferrer" 
                             className="text-cyan-400 text-sm hover:underline">
                            View Evidence
                          </a>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted: {new Date(verification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {verification.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          data-testid={`approve-verification-${verification.id}`}
                          onClick={() => handleUpdateStatus(verification.id, 'verified')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`reject-verification-${verification.id}`}
                          onClick={() => handleUpdateStatus(verification.id, 'rejected')}
                          className="border-red-600 text-red-400 hover:bg-red-600/20"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {verifiedCount >= 2 && (
          <Card className="glass p-6 mt-8 border-green-600/50" data-testid="unlock-notification">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-green-400 mb-2">Vault Unlocked!</h3>
                <p className="text-gray-400">The vault has been unlocked after multi-signature verification threshold was met. Legacy instructions will be executed according to configured delays.</p>
              </div>
            </div>
          </Card>
        )}
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="glass border-cyan-800 max-w-2xl" data-testid="submit-verification-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl neon-text">Submit Death Verification</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Vault</label>
              <Select value={formData.vault_id} onValueChange={(value) => setFormData({ ...formData, vault_id: value })}>
                <SelectTrigger className="bg-gray-900 border-cyan-800 text-white" data-testid="vault-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-cyan-800">
                  {vaults.map((vault) => (
                    <SelectItem key={vault.id} value={vault.id}>{vault.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Submitted By (Trusted Party)</label>
              <Select value={formData.submitted_by} onValueChange={(value) => setFormData({ ...formData, submitted_by: value })}>
                <SelectTrigger className="bg-gray-900 border-cyan-800 text-white" data-testid="party-select">
                  <SelectValue placeholder="Select a verifier" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-cyan-800">
                  {parties.filter(p => p.role === 'verifier').map((party) => (
                    <SelectItem key={party.id} value={party.id}>{party.name} - {party.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Evidence Type</label>
              <Select value={formData.evidence_type} onValueChange={(value) => setFormData({ ...formData, evidence_type: value })}>
                <SelectTrigger className="bg-gray-900 border-cyan-800 text-white" data-testid="evidence-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-cyan-800">
                  <SelectItem value="death_certificate">Death Certificate</SelectItem>
                  <SelectItem value="obituary">Obituary</SelectItem>
                  <SelectItem value="government_record">Government Record</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Evidence URL (Optional)</label>
              <Input
                data-testid="evidence-url-input"
                value={formData.evidence_url}
                onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })}
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="https://example.com/document.pdf"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Notes</label>
              <textarea
                data-testid="evidence-notes-input"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-gray-900 border border-cyan-800 text-white rounded-md p-3 min-h-[100px]"
                placeholder="Additional information about the verification..."
              />
            </div>
            <div className="bg-amber-600/10 border border-amber-600/30 rounded-md p-4">
              <p className="text-amber-400 text-sm">
                <strong>Note:</strong> This is a mock submission for demonstration. In production, this would be submitted by actual trusted parties with proper authentication.
              </p>
            </div>
            <Button type="submit" data-testid="submit-verification-form-btn" className="w-full bg-cyan-600 hover:bg-cyan-700">
              Submit Verification
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}