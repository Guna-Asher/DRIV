import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, Send, Trash, Share2, Bell, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { AuthContext } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';

const actionIcons = {
  send_message: Send,
  delete_account: Trash,
  transfer_asset: Share2,
  donate: Bell,
  notify: Bell
};

export default function LegacyPage() {
  const { API } = useContext(AuthContext);
  const [instructions, setInstructions] = useState([]);
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    vault_id: '',
    action_type: 'send_message',
    title: '',
    description: '',
    target_email: '',
    message_content: '',
    delay_days: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [instructionsRes, vaultsRes] = await Promise.all([
        axios.get(`${API}/legacy-instructions`),
        axios.get(`${API}/vaults`)
      ]);
      setInstructions(instructionsRes.data);
      setVaults(vaultsRes.data);
      if (vaultsRes.data.length > 0 && !formData.vault_id) {
        setFormData(prev => ({ ...prev, vault_id: vaultsRes.data[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load legacy instructions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/legacy-instructions`, formData);
      toast.success('Legacy instruction created');
      setShowCreate(false);
      setFormData({ vault_id: vaults[0]?.id || '', action_type: 'send_message', title: '', description: '', target_email: '', message_content: '', delay_days: 0 });
      fetchData();
    } catch (error) {
      toast.error('Failed to create instruction');
    }
  };

  const handleDelete = async (instructionId) => {
    if (!window.confirm('Are you sure you want to delete this instruction?')) return;
    try {
      await axios.delete(`${API}/legacy-instructions/${instructionId}`);
      toast.success('Instruction deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete instruction');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white" data-testid="legacy-page">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Legacy Instructions</h1>
            <p className="text-gray-400">Define what happens to your assets after your passing</p>
          </div>
          <Button 
            onClick={() => setShowCreate(true)}
            data-testid="create-instruction-btn"
            disabled={vaults.length === 0}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Instruction
          </Button>
        </div>

        {vaults.length === 0 ? (
          <Card className="glass p-12 text-center" data-testid="no-vaults-warning">
            <Bell className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Create a vault first</h3>
            <p className="text-gray-400">You need to create a vault before adding legacy instructions</p>
          </Card>
        ) : loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : instructions.length === 0 ? (
          <Card className="glass p-12 text-center" data-testid="no-instructions">
            <Send className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No legacy instructions yet</h3>
            <p className="text-gray-400 mb-4">Create instructions for what should happen to your digital assets</p>
            <Button onClick={() => setShowCreate(true)} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" /> Add Your First Instruction
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {instructions.map((instruction) => {
              const Icon = actionIcons[instruction.action_type] || Send;
              return (
                <Card key={instruction.id} className="glass p-6 card-hover" data-testid={`instruction-card-${instruction.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="w-8 h-8 text-cyan-400" />
                    <div className="flex items-center gap-2">
                      {instruction.is_executed ? (
                        <span className="px-3 py-1 rounded-full text-xs bg-green-600/20 text-green-400">Executed</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs bg-amber-600/20 text-amber-400">Pending</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`delete-instruction-${instruction.id}`}
                        onClick={() => handleDelete(instruction.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 neon-text">{instruction.title}</h3>
                  <div className="px-3 py-1 rounded-full text-xs bg-cyan-600/20 text-cyan-400 inline-block mb-3">
                    {instruction.action_type.replace('_', ' ')}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{instruction.description}</p>
                  {instruction.target_email && (
                    <p className="text-cyan-400 text-sm mb-2">To: {instruction.target_email}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    Delay: {instruction.delay_days} days after verification
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="glass border-cyan-800 max-w-2xl" data-testid="create-instruction-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl neon-text">Create Legacy Instruction</DialogTitle>
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
              <label className="text-sm text-gray-400 mb-2 block">Action Type</label>
              <Select value={formData.action_type} onValueChange={(value) => setFormData({ ...formData, action_type: value })}>
                <SelectTrigger className="bg-gray-900 border-cyan-800 text-white" data-testid="action-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-cyan-800">
                  <SelectItem value="send_message">Send Message</SelectItem>
                  <SelectItem value="delete_account">Delete Account</SelectItem>
                  <SelectItem value="transfer_asset">Transfer Asset</SelectItem>
                  <SelectItem value="donate">Donate</SelectItem>
                  <SelectItem value="notify">Notify</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Title</label>
              <Input
                data-testid="instruction-title-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="Send farewell message to family"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Description</label>
              <Input
                data-testid="instruction-description-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="Details about this instruction"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Target Email</label>
              <Input
                data-testid="instruction-email-input"
                type="email"
                value={formData.target_email}
                onChange={(e) => setFormData({ ...formData, target_email: e.target.value })}
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Message Content</label>
              <textarea
                data-testid="instruction-message-input"
                value={formData.message_content}
                onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
                className="w-full bg-gray-900 border border-cyan-800 text-white rounded-md p-3 min-h-[100px]"
                placeholder="Your message..."
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Delay After Verification (days)</label>
              <Input
                data-testid="instruction-delay-input"
                type="number"
                min="0"
                value={formData.delay_days}
                onChange={(e) => setFormData({ ...formData, delay_days: parseInt(e.target.value) || 0 })}
                className="bg-gray-900 border-cyan-800 text-white"
              />
            </div>
            <Button type="submit" data-testid="submit-instruction-btn" className="w-full bg-cyan-600 hover:bg-cyan-700">
              Create Instruction
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}