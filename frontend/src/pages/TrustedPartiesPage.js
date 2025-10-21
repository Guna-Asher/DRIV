import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, Users, Mail, Phone, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { AuthContext } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';

const roleColors = {
  heir: 'cyan',
  verifier: 'green',
  executor: 'purple'
};

export default function TrustedPartiesPage() {
  const { API } = useContext(AuthContext);
  const [parties, setParties] = useState([]);
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    vault_id: '',
    name: '',
    email: '',
    role: 'heir',
    phone: '',
    relationship: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [partiesRes, vaultsRes] = await Promise.all([
        axios.get(`${API}/trusted-parties`),
        axios.get(`${API}/vaults`)
      ]);
      setParties(partiesRes.data);
      setVaults(vaultsRes.data);
      if (vaultsRes.data.length > 0 && !formData.vault_id) {
        setFormData(prev => ({ ...prev, vault_id: vaultsRes.data[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load trusted parties');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/trusted-parties`, formData);
      toast.success('Trusted party added');
      setShowCreate(false);
      setFormData({ vault_id: vaults[0]?.id || '', name: '', email: '', role: 'heir', phone: '', relationship: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add trusted party');
    }
  };

  const handleDelete = async (partyId) => {
    if (!window.confirm('Are you sure you want to remove this trusted party?')) return;
    try {
      await axios.delete(`${API}/trusted-parties/${partyId}`);
      toast.success('Trusted party removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove trusted party');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white" data-testid="trusted-parties-page">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Trusted Parties</h1>
            <p className="text-gray-400">Manage heirs, verifiers, and executors for your digital legacy</p>
          </div>
          <Button 
            onClick={() => setShowCreate(true)}
            data-testid="add-party-btn"
            disabled={vaults.length === 0}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Trusted Party
          </Button>
        </div>

        {vaults.length === 0 ? (
          <Card className="glass p-12 text-center" data-testid="no-vaults-warning">
            <Shield className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Create a vault first</h3>
            <p className="text-gray-400">You need to create a vault before adding trusted parties</p>
          </Card>
        ) : loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : parties.length === 0 ? (
          <Card className="glass p-12 text-center" data-testid="no-parties">
            <Users className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No trusted parties yet</h3>
            <p className="text-gray-400 mb-4">Add people who will inherit or verify your digital assets</p>
            <Button onClick={() => setShowCreate(true)} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" /> Add Your First Trusted Party
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parties.map((party) => {
              const roleColor = roleColors[party.role] || 'cyan';
              return (
                <Card key={party.id} className="glass p-6 card-hover" data-testid={`party-card-${party.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <Users className="w-8 h-8 text-cyan-400" />
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs bg-${roleColor}-600/20 text-${roleColor}-400`}>
                        {party.role}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`delete-party-${party.id}`}
                        onClick={() => handleDelete(party.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 neon-text">{party.name}</h3>
                  {party.relationship && (
                    <p className="text-gray-400 text-sm mb-2">{party.relationship}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{party.email}</span>
                    </div>
                    {party.phone && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{party.phone}</span>
                      </div>
                    )}
                  </div>
                  {party.has_signed && (
                    <div className="mt-3 px-3 py-1 rounded-md text-xs bg-green-600/20 text-green-400 text-center">
                      Signed on {new Date(party.signed_at).toLocaleDateString()}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="glass border-cyan-800 max-w-2xl" data-testid="add-party-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl neon-text">Add Trusted Party</DialogTitle>
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
              <label className="text-sm text-gray-400 mb-2 block">Full Name</label>
              <Input
                data-testid="party-name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Email</label>
              <Input
                data-testid="party-email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Role</label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="bg-gray-900 border-cyan-800 text-white" data-testid="role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-cyan-800">
                  <SelectItem value="heir">Heir (inherits assets)</SelectItem>
                  <SelectItem value="verifier">Verifier (confirms death)</SelectItem>
                  <SelectItem value="executor">Executor (executes instructions)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Phone (Optional)</label>
              <Input
                data-testid="party-phone-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="+1234567890"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Relationship (Optional)</label>
              <Input
                data-testid="party-relationship-input"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="Spouse, Child, Friend, etc."
              />
            </div>
            <Button type="submit" data-testid="submit-party-btn" className="w-full bg-cyan-600 hover:bg-cyan-700">
              Add Trusted Party
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}