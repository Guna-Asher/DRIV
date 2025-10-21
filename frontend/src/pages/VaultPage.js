import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, Lock, Unlock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import { AuthContext } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';

export default function VaultPage() {
  const { API } = useContext(AuthContext);
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchVaults();
  }, []);

  const fetchVaults = async () => {
    try {
      const response = await axios.get(`${API}/vaults`);
      setVaults(response.data);
    } catch (error) {
      toast.error('Failed to load vaults');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/vaults`, formData);
      toast.success('Vault created successfully');
      setShowCreate(false);
      setFormData({ name: '', description: '' });
      fetchVaults();
    } catch (error) {
      toast.error('Failed to create vault');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white" data-testid="vaults-page">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Vaults</h1>
            <p className="text-gray-400">Manage your encrypted digital vaults</p>
          </div>
          <Button 
            onClick={() => setShowCreate(true)}
            data-testid="create-vault-btn"
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Vault
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : vaults.length === 0 ? (
          <Card className="glass p-12 text-center" data-testid="no-vaults">
            <Lock className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No vaults yet</h3>
            <p className="text-gray-400 mb-4">Create your first vault to start securing your digital assets</p>
            <Button onClick={() => setShowCreate(true)} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" /> Create Your First Vault
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaults.map((vault) => (
              <Card key={vault.id} className="glass p-6 card-hover" data-testid={`vault-card-${vault.id}`}>
                <div className="flex items-start justify-between mb-4">
                  {vault.is_locked ? (
                    <Lock className="w-8 h-8 text-red-400" />
                  ) : (
                    <Unlock className="w-8 h-8 text-cyan-400" />
                  )}
                  <div className={`px-3 py-1 rounded-full text-xs ${
                    vault.is_locked ? 'bg-red-600/20 text-red-400' : 'bg-cyan-600/20 text-cyan-400'
                  }`}>
                    {vault.is_locked ? 'Locked' : 'Unlocked'}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 neon-text">{vault.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{vault.description || 'No description'}</p>
                <div className="text-xs text-gray-500">
                  Created: {new Date(vault.created_at).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="glass border-cyan-800" data-testid="create-vault-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl neon-text">Create New Vault</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Vault Name</label>
              <Input
                data-testid="vault-name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="My Digital Assets Vault"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Description (Optional)</label>
              <Input
                data-testid="vault-description-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="Vault for all my important digital assets"
              />
            </div>
            <Button type="submit" data-testid="submit-vault-btn" className="w-full bg-cyan-600 hover:bg-cyan-700">
              Create Vault
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}