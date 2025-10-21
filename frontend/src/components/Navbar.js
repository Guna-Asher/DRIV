import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, LayoutDashboard, Vault, Package, FileText, Users, CheckCircle, BarChart3, CreditCard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthContext } from '@/App';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/vaults', icon: Vault, label: 'Vaults' },
    { path: '/assets', icon: Package, label: 'Assets' },
    { path: '/legacy', icon: FileText, label: 'Legacy' },
    { path: '/trusted-parties', icon: Users, label: 'Trusted Parties' },
    { path: '/verification', icon: CheckCircle, label: 'Verification' },
    { path: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' }
  ];

  return (
    <nav className="glass border-b border-cyan-900/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Lock className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold neon-text">DRIV</span>
          </div>
          
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={isActive ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white hover:bg-cyan-600/20'}
                    size="sm"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400 hidden sm:block">{user?.email}</span>
            <Button 
              onClick={logout}
              data-testid="logout-btn"
              variant="outline"
              size="sm"
              className="border-red-600 text-red-400 hover:bg-red-600/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}