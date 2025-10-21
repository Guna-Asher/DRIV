import React, { useState, useContext } from 'react';
import { Lock, Shield, Users, Clock, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AuthContext } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';

export default function LandingPage() {
  const { login, API } = useContext(AuthContext);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${endpoint}`, formData);
      login(response.data.access_token, response.data.user);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="grid-bg min-h-screen">
        <nav className="glass border-b border-cyan-900/30 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Lock className="w-8 h-8 text-cyan-400" />
                <span className="text-2xl font-bold neon-text">DRIV</span>
              </div>
              <Button 
                onClick={() => setShowAuth(true)}
                data-testid="get-started-btn"
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-md neon-border"
              >
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 neon-text animate-float">
              Digital Rights Inheritance Vault
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Secure your digital legacy. Ensure your assets are transferred safely after your passing.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                onClick={() => setShowAuth(true)}
                data-testid="hero-start-btn"
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 text-lg rounded-lg neon-border"
              >
                Start Protecting Your Legacy
              </Button>
              <Button 
                variant="outline" 
                className="border-cyan-600 text-cyan-400 hover:bg-cyan-600/10 px-8 py-4 text-lg rounded-lg"
              >
                Learn More
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              { icon: Shield, title: 'AES-256 Encryption', desc: 'Military-grade encryption for all your digital assets' },
              { icon: Users, title: 'Trusted Parties', desc: 'Assign heirs and verifiers with multi-signature security' },
              { icon: Clock, title: 'Time-Locked Actions', desc: 'Automated posthumous instructions with delay mechanisms' },
              { icon: FileText, title: 'Legacy Instructions', desc: 'Define exactly what happens to each digital asset' },
              { icon: Lock, title: 'Death Verification', desc: 'Multi-party verification system for security' },
              { icon: TrendingUp, title: 'Analytics Dashboard', desc: 'Track asset growth and legacy planning progress' }
            ].map((feature, index) => (
              <Card key={index} className="glass p-6 card-hover" data-testid={`feature-card-${index}`}>
                <feature.icon className="w-12 h-12 text-cyan-400 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-cyan-300">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </Card>
            ))}
          </div>

          <div className="glass p-12 rounded-2xl neon-border text-center">
            <h2 className="text-4xl font-bold mb-4 neon-green">Why DRIV?</h2>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-8">
              Every year, billions of dollars in digital assets become inaccessible due to lack of proper inheritance planning.
              DRIV ensures your digital life is preserved and transferred according to your wishes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-5xl font-bold neon-text mb-2">100%</div>
                <div className="text-gray-400">Encrypted</div>
              </div>
              <div>
                <div className="text-5xl font-bold neon-green mb-2">24/7</div>
                <div className="text-gray-400">Monitoring</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-emerald-400 mb-2">∞</div>
                <div className="text-gray-400">Asset Types</div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showAuth && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="glass p-8 max-w-md w-full neon-border" data-testid="auth-modal">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold neon-text">{isLogin ? 'Login' : 'Register'}</h2>
              <button onClick={() => setShowAuth(false)} data-testid="close-auth-modal" className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <Input
                  data-testid="full-name-input"
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required={!isLogin}
                  className="bg-gray-900 border-cyan-800 text-white"
                />
              )}
              <Input
                data-testid="email-input"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-gray-900 border-cyan-800 text-white"
              />
              <Input
                data-testid="password-input"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="bg-gray-900 border-cyan-800 text-white"
              />
              <Button 
                type="submit" 
                data-testid="submit-auth-btn"
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
              </Button>
            </form>
            <p className="text-center text-gray-400 mt-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                data-testid="toggle-auth-mode"
                onClick={() => setIsLogin(!isLogin)}
                className="text-cyan-400 ml-2 hover:underline"
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}