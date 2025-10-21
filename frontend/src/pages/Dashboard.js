import React, { useState, useEffect, useContext } from 'react';
import { Vault, Package, FileText, Users, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { AuthContext } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { API } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`);
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Vault, label: 'Vaults', value: analytics?.vaults || 0, color: 'cyan' },
    { icon: Package, label: 'Assets', value: analytics?.assets || 0, color: 'emerald' },
    { icon: FileText, label: 'Legacy Instructions', value: analytics?.legacy_instructions || 0, color: 'blue' },
    { icon: Users, label: 'Trusted Parties', value: analytics?.trusted_parties || 0, color: 'purple' },
    { icon: CheckCircle, label: 'Verifications', value: analytics?.verifications || 0, color: 'green' },
    { icon: TrendingUp, label: 'Completion', value: `${analytics?.completion_percentage || 0}%`, color: 'amber' }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white" data-testid="dashboard">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold neon-text mb-2">Dashboard</h1>
          <p className="text-gray-400">Overview of your digital inheritance vault</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="glass p-6 card-hover" data-testid={`stat-card-${stat.label.toLowerCase().replace(' ', '-')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold neon-text">{stat.value}</p>
                </div>
                <stat.icon className={`w-12 h-12 text-${stat.color}-400`} />
              </div>
            </Card>
          ))}
        </div>

        {analytics?.completion_percentage < 50 && (
          <Card className="glass p-6 mb-8 border-amber-600/50" data-testid="setup-alert">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-400 mb-2">Complete Your Vault Setup</h3>
                <p className="text-gray-400 mb-4">Your vault is {analytics?.completion_percentage}% complete. Add more assets, legacy instructions, and trusted parties to secure your digital legacy.</p>
                <div className="flex gap-3 flex-wrap">
                  <Link to="/assets">
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" data-testid="add-assets-btn">Add Assets</Button>
                  </Link>
                  <Link to="/legacy">
                    <Button size="sm" variant="outline" className="border-cyan-600 text-cyan-400" data-testid="add-legacy-btn">Add Legacy Instructions</Button>
                  </Link>
                  <Link to="/trusted-parties">
                    <Button size="sm" variant="outline" className="border-cyan-600 text-cyan-400" data-testid="add-parties-btn">Add Trusted Parties</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        )}

        {analytics?.asset_breakdown && Object.keys(analytics.asset_breakdown).length > 0 && (
          <Card className="glass p-6" data-testid="asset-breakdown">
            <h3 className="text-xl font-bold neon-text mb-4">Asset Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(analytics.asset_breakdown).map(([category, count]) => (
                <div key={category} className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">{count}</div>
                  <div className="text-sm text-gray-400 capitalize">{category}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}