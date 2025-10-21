import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, CreditCard, DollarSign, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { AuthContext } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';

export default function SubscriptionsPage() {
  const { API } = useContext(AuthContext);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    service_name: '',
    category: 'streaming',
    amount: '',
    billing_cycle: 'monthly',
    auto_cancel_enabled: false
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get(`${API}/subscriptions`);
      setSubscriptions(response.data);
    } catch (error) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/subscriptions`, { ...formData, amount: parseFloat(formData.amount) });
      toast.success('Subscription added');
      setShowCreate(false);
      setFormData({ service_name: '', category: 'streaming', amount: '', billing_cycle: 'monthly', auto_cancel_enabled: false });
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to add subscription');
    }
  };

  const handleDelete = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    try {
      await axios.delete(`${API}/subscriptions/${subscriptionId}`);
      toast.success('Subscription deleted');
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to delete subscription');
    }
  };

  const handleOAuthConnect = async () => {
    try {
      const response = await axios.post(`${API}/subscriptions/oauth-mock`);
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to connect OAuth');
    }
  };

  const totalMonthly = subscriptions
    .filter(s => s.billing_cycle === 'monthly')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white" data-testid="subscriptions-page">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Subscriptions</h1>
            <p className="text-gray-400">Manage and auto-cancel recurring payments</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleOAuthConnect}
              data-testid="connect-oauth-btn"
              variant="outline"
              className="border-cyan-600 text-cyan-400 hover:bg-cyan-600/20"
            >
              Connect OAuth (Mock)
            </Button>
            <Button 
              onClick={() => setShowCreate(true)}
              data-testid="add-subscription-btn"
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Subscription
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass p-6" data-testid="subscription-stats">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Subscriptions</p>
                <p className="text-3xl font-bold neon-text">{subscriptions.length}</p>
              </div>
              <CreditCard className="w-12 h-12 text-cyan-400" />
            </div>
          </Card>
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Monthly Spending</p>
                <p className="text-3xl font-bold text-green-400">${totalMonthly.toFixed(2)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-400" />
            </div>
          </Card>
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Auto-Cancel Enabled</p>
                <p className="text-3xl font-bold text-amber-400">
                  {subscriptions.filter(s => s.auto_cancel_enabled).length}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-amber-400" />
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : subscriptions.length === 0 ? (
          <Card className="glass p-12 text-center" data-testid="no-subscriptions">
            <CreditCard className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No subscriptions yet</h3>
            <p className="text-gray-400 mb-4">Add your recurring subscriptions to enable auto-cancellation</p>
            <Button onClick={() => setShowCreate(true)} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" /> Add Your First Subscription
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} className="glass p-6 card-hover" data-testid={`subscription-card-${subscription.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <CreditCard className="w-8 h-8 text-cyan-400" />
                  <div className="flex items-center gap-2">
                    {subscription.auto_cancel_enabled && (
                      <span className="px-3 py-1 rounded-full text-xs bg-green-600/20 text-green-400">
                        Auto-Cancel
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`delete-subscription-${subscription.id}`}
                      onClick={() => handleDelete(subscription.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 neon-text">{subscription.service_name}</h3>
                <div className="px-3 py-1 rounded-full text-xs bg-cyan-600/20 text-cyan-400 inline-block mb-3">
                  {subscription.category}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-green-400 font-bold">${subscription.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Billing:</span>
                    <span className="text-white capitalize">{subscription.billing_cycle}</span>
                  </div>
                  {subscription.oauth_connected && (
                    <div className="mt-2 px-3 py-1 rounded-md text-xs bg-green-600/20 text-green-400 text-center">
                      OAuth Connected
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="glass border-cyan-800 max-w-2xl" data-testid="add-subscription-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl neon-text">Add Subscription</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Service Name</label>
              <Input
                data-testid="service-name-input"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                required
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="Netflix, Spotify, etc."
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Category</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-gray-900 border-cyan-800 text-white" data-testid="category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-cyan-800">
                  <SelectItem value="streaming">Streaming</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Amount</label>
              <Input
                data-testid="amount-input"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="bg-gray-900 border-cyan-800 text-white"
                placeholder="9.99"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Billing Cycle</label>
              <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}>
                <SelectTrigger className="bg-gray-900 border-cyan-800 text-white" data-testid="billing-cycle-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-cyan-800">
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                data-testid="auto-cancel-checkbox"
                checked={formData.auto_cancel_enabled}
                onChange={(e) => setFormData({ ...formData, auto_cancel_enabled: e.target.checked })}
                className="w-5 h-5"
              />
              <label className="text-sm text-gray-300">Enable auto-cancellation after death verification</label>
            </div>
            <div className="bg-cyan-600/10 border border-cyan-600/30 rounded-md p-4">
              <p className="text-cyan-400 text-sm">
                <strong>Mock Integration:</strong> OAuth connection is simulated. In production, this would integrate with email providers to detect and cancel subscriptions automatically.
              </p>
            </div>
            <Button type="submit" data-testid="submit-subscription-btn" className="w-full bg-cyan-600 hover:bg-cyan-700">
              Add Subscription
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}