
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: 'home' | 'debate' | 'results' | 'leaderboard' | 'user-debates') => void;
}

export const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <nav className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Debatrix AI
        </h1>
        <div className="flex space-x-4">
          <Button
            variant={currentView === 'home' ? 'default' : 'ghost'}
            onClick={() => onViewChange('home')}
            className="text-white"
          >
            Home
          </Button>
          <Button
            variant={currentView === 'user-debates' ? 'default' : 'ghost'}
            onClick={() => onViewChange('user-debates')}
            className="text-white"
          >
            User Debates
          </Button>
          <Button
            variant={currentView === 'leaderboard' ? 'default' : 'ghost'}
            onClick={() => onViewChange('leaderboard')}
            className="text-white"
          >
            Leaderboard
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-white">
              Welcome, {user.user_metadata?.first_name || user.email}
            </span>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleSignIn}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
};
