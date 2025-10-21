import React, { useState, useEffect, useContext } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { AuthContext } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const { API } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [vaults, setVaults] = useState([]);
  const [selectedVault, setSelectedVault] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, vaultsRes] = await Promise.all([
        axios.get(`${API}/analytics/dashboard`),
        axios.get(`${API}/vaults`)
      ]);
      setAnalytics(analyticsRes.data);
      setVaults(vaultsRes.data);
      if (vaultsRes.data.length > 0) {
        setSelectedVault(vaultsRes.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async (analysisType) => {
    if (!selectedVault) {
      toast.error('Please select a vault first');
      return;
    }
    setLoadingAI(true);
    try {
      const response = await axios.post(`${API}/ai/analyze`, {
        vault_id: selectedVault,
        analysis_type: analysisType
      });
      setAiAnalysis(response.data);
      toast.success('AI analysis completed');
    } catch (error) {
      toast.error('Failed to run AI analysis');
    } finally {
      setLoadingAI(false);
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

  return (
    <div className="min-h-screen bg-gray-950 text-white" data-testid="analytics-page">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold neon-text mb-2">Analytics & Insights</h1>
          <p className="text-gray-400">Visualize your digital legacy planning progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="glass p-6" data-testid="completion-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold neon-text">Vault Completion</h3>
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-cyan-400 bg-cyan-600/20">
                    Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold neon-text">{analytics?.completion_percentage || 0}%</span>
                </div>
              </div>
              <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-800">
                <div 
                  style={{ width: `${analytics?.completion_percentage || 0}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-cyan-500 to-green-500"
                ></div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Complete your vault setup to ensure your digital legacy is properly secured.
            </p>
          </Card>

          <Card className="glass p-6" data-testid="asset-breakdown-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold neon-text">Asset Distribution</h3>
              <PieChart className="w-6 h-6 text-cyan-400" />
            </div>
            {analytics?.asset_breakdown && Object.keys(analytics.asset_breakdown).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analytics.asset_breakdown).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-gray-400 capitalize">{category}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${(count / analytics.assets) * 100}%` }}
                          className="h-full bg-cyan-500"
                        ></div>
                      </div>
                      <span className="text-cyan-400 font-bold w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No assets yet</p>
            )}
          </Card>
        </div>

        <Card className="glass p-6 mb-8" data-testid="ai-analysis-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold neon-text mb-2">AI-Powered Insights</h3>
              <p className="text-gray-400 text-sm">Get recommendations using Hugging Face Transformers (Mock)</p>
            </div>
            <BarChart3 className="w-8 h-8 text-cyan-400" />
          </div>
          
          {vaults.length > 0 && (
            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">Select Vault for Analysis</label>
              <select
                data-testid="vault-select"
                value={selectedVault || ''}
                onChange={(e) => setSelectedVault(e.target.value)}
                className="bg-gray-900 border border-cyan-800 text-white rounded-md p-3 w-full"
              >
                {vaults.map((vault) => (
                  <option key={vault.id} value={vault.id}>{vault.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 mb-6 flex-wrap">
            <Button 
              onClick={() => runAIAnalysis('asset_summary')}
              data-testid="asset-summary-btn"
              disabled={loadingAI || !selectedVault}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Asset Summary
            </Button>
            <Button 
              onClick={() => runAIAnalysis('risk_assessment')}
              data-testid="risk-assessment-btn"
              disabled={loadingAI || !selectedVault}
              variant="outline"
              className="border-cyan-600 text-cyan-400 hover:bg-cyan-600/20"
            >
              Risk Assessment
            </Button>
            <Button 
              onClick={() => runAIAnalysis('recommendation')}
              data-testid="recommendation-btn"
              disabled={loadingAI || !selectedVault}
              variant="outline"
              className="border-cyan-600 text-cyan-400 hover:bg-cyan-600/20"
            >
              Recommendations
            </Button>
          </div>

          {loadingAI ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner"></div>
              <span className="ml-4 text-gray-400">Running AI analysis...</span>
            </div>
          ) : aiAnalysis ? (
            <div className="bg-gray-900/50 border border-cyan-800/50 rounded-lg p-6" data-testid="ai-analysis-result">
              <h4 className="text-lg font-bold text-cyan-400 mb-3">
                {aiAnalysis.analysis_type.replace('_', ' ').toUpperCase()}
              </h4>
              <p className="text-gray-300 leading-relaxed">{aiAnalysis.result}</p>
              <p className="text-xs text-gray-500 mt-4">
                Generated at: {new Date(aiAnalysis.generated_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select a vault and click an analysis button to get AI-powered insights
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass p-6" data-testid="stat-vaults">
            <TrendingUp className="w-8 h-8 text-cyan-400 mb-3" />
            <p className="text-gray-400 text-sm mb-1">Vaults</p>
            <p className="text-3xl font-bold neon-text">{analytics?.vaults || 0}</p>
          </Card>
          <Card className="glass p-6" data-testid="stat-assets">
            <BarChart3 className="w-8 h-8 text-green-400 mb-3" />
            <p className="text-gray-400 text-sm mb-1">Total Assets</p>
            <p className="text-3xl font-bold text-green-400">{analytics?.assets || 0}</p>
          </Card>
          <Card className="glass p-6" data-testid="stat-instructions">
            <Activity className="w-8 h-8 text-purple-400 mb-3" />
            <p className="text-gray-400 text-sm mb-1">Legacy Instructions</p>
            <p className="text-3xl font-bold text-purple-400">{analytics?.legacy_instructions || 0}</p>
          </Card>
          <Card className="glass p-6" data-testid="stat-parties">
            <PieChart className="w-8 h-8 text-amber-400 mb-3" />
            <p className="text-gray-400 text-sm mb-1">Trusted Parties</p>
            <p className="text-3xl font-bold text-amber-400">{analytics?.trusted_parties || 0}</p>
          </Card>
        </div>
      </main>
    </div>
  );
}