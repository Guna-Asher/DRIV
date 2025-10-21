import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, Package, DollarSign, Users as UsersIcon, FileText, Bitcoin, FolderOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { AuthContext } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';

const categoryIcons = {
  financial: DollarSign,
  social: UsersIcon,
  personal: FileText,
  crypto: Bitcoin,
  documents: FolderOpen,
  other: Package
};

export default function AssetsPage() {
  const { API } = useContext(AuthContext);
  const [assets, setAssets] = useState([]);
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    vault_id: '',
    name: '',
    category: 'financial',
    description: '',
    url: '',
    credentials: '',
    value: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assetsRes, vaultsRes] = await Promise.all([
        axios.get(`${API}/assets`),
        axios.get(`${API}/vaults`)
      ]);
      setAssets(assetsRes.data);
      setVaults(vaultsRes.data);
      if (vaultsRes.data.length > 0 && !formData.vault_id) {
        setFormData(prev => ({ ...prev, vault_id: vaultsRes.data[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/assets`, formData);
      toast.success('Asset added successfully');
      setShowCreate(false);
      setFormData({ vault_id: vaults[0]?.id || '', name: '', category: 'financial', description: '', url: '', credentials: '', value: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create asset');
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await axios.delete(`${API}/assets/${assetId}`);
      toast.success('Asset deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white" data-testid="assets-page">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Digital Assets</h1>
            <p className="text-gray-400">Manage all your digital assets in one place</p>
          </div>
          <Button 
            onClick={() => setShowCreate(true)}
            data-testid="create-asset-btn"
            disabled={vaults.length === 0}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Asset
          </Button>
        </div>

        {vaults.length === 0 ? (
          <Card className="glass p-12 text-center" data-testid="no-vaults-warning">
            <Package className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Create a vault first</h3>
            <p className="text-gray-400">You need to create a vault before adding assets</p>
          </Card>
        ) : loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : assets.length === 0 ? (
          <Card className="glass p-12 text-center" data-testid="no-assets">
            <Package className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No assets yet</h3>
            <p className="text-gray-400 mb-4">Start adding your digital assets to secure them</p>
            <Button onClick={() => setShowCreate(true)} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" /> Add Your First Asset
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => {
              const Icon = categoryIcons[asset.category] || Package;
              return (
                <Card key={asset.id} className="glass p-6 card-hover" data-testid={`asset-card-${asset.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="w-8 h-8 text-cyan-400" />
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`delete-asset-${asset.id}`}
                      onClick={() => handleDelete(asset.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <h3 className="text-xl font-bold mb-2 neon-text">{asset.name}</h3>
                  <div className="px-3 py-1 rounded-full text-xs bg-cyan-600/20 text-cyan-400 inline-block mb-2">
                    {asset.category}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{asset.description || 'No description'}</p>
                  {asset.url && (
                    <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs hover:underline block truncate">
                      {asset.url}
                    </a>
                  )}
                  {asset.value && (
                    <p className="text-green-400 text-sm mt-2">Value: {asset.value}</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="glass border-cyan-800 max-w-2xl" data-testid="create-asset-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl neon-text">Add Digital Asset</DialogTitle>
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
              <label className="text-sm text-gray-400 mb-2 block">Asset Name</label>
              <Input
                data-testid="asset-name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="Bank Account, Social Media, Crypto Wallet, etc."
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Category</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-gray-900 border-cyan-800 text-white" data-testid="category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-cyan-800">
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Description</label>
              <Input
                data-testid="asset-description-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="Brief description of this asset"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">URL (Optional)</label>
              <Input
                data-testid="asset-url-input"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Credentials (Encrypted)</label>
              <Input
                data-testid="asset-credentials-input"
                value={formData.credentials}
                onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="Username/password or access keys"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Estimated Value (Optional)</label>
              <Input
                data-testid="asset-value-input"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="$10,000 or 1.5 BTC"
              />
            </div>
            <Button type="submit" data-testid="submit-asset-btn" className="w-full bg-cyan-600 hover:bg-cyan-700">
              Add Asset
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}