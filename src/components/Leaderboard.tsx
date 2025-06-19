
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LeaderboardEntry {
  id: number;
  name: string;
  rank: number;
  score: number;
  winRate: number;
  debates: number;
  trend: 'up' | 'down' | 'stable';
}

export const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterBy, setFilterBy] = useState<'global' | 'monthly' | 'weekly'>('global');

  useEffect(() => {
    // Simulate fetching leaderboard data
    setIsLoading(true);
    setTimeout(() => {
      const generateLeaders = (): LeaderboardEntry[] => {
        return Array(20).fill(null).map((_, i) => ({
          id: i + 1,
          name: `Debater${Math.floor(Math.random() * 1000)}`,
          rank: i + 1,
          score: Math.floor(Math.random() * 400) + 600,
          winRate: Math.floor(Math.random() * 60) + 40,
          debates: Math.floor(Math.random() * 50) + 5,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
        }));
      };

      const sorted = generateLeaders().sort((a, b) => b.score - a.score);
      setLeaders(sorted);
      setIsLoading(false);
      
      // Simulate websocket updates
      const interval = setInterval(() => {
        setLeaders(prev => {
          const updated = [...prev];
          const indexToUpdate = Math.floor(Math.random() * updated.length);
          updated[indexToUpdate] = {
            ...updated[indexToUpdate],
            score: updated[indexToUpdate].score + Math.floor(Math.random() * 10) - 5,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          };
          return updated.sort((a, b) => b.score - a.score).map((item, idx) => ({
            ...item,
            rank: idx + 1
          }));
        });
      }, 5000);
      
      return () => clearInterval(interval);
    }, 1000);
  }, [filterBy]);

  const getTrendBadge = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <Badge className="bg-green-600">↑</Badge>;
      case 'down':
        return <Badge className="bg-red-600">↓</Badge>;
      default:
        return <Badge className="bg-gray-600">—</Badge>;
    }
  };

  return (
    <Card className="bg-slate-900/70 backdrop-blur-sm border-blue-500/30">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-white">Global Leaderboard</CardTitle>
          <div className="flex space-x-2">
            <Badge 
              className={`cursor-pointer ${filterBy === 'global' ? 'bg-blue-600' : 'bg-slate-700'}`}
              onClick={() => setFilterBy('global')}
            >
              All Time
            </Badge>
            <Badge 
              className={`cursor-pointer ${filterBy === 'monthly' ? 'bg-blue-600' : 'bg-slate-700'}`}
              onClick={() => setFilterBy('monthly')}
            >
              Monthly
            </Badge>
            <Badge 
              className={`cursor-pointer ${filterBy === 'weekly' ? 'bg-blue-600' : 'bg-slate-700'}`}
              onClick={() => setFilterBy('weekly')}
            >
              Weekly
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left border-b border-slate-700">
                <tr>
                  <th className="p-3 text-slate-400 font-medium">Rank</th>
                  <th className="p-3 text-slate-400 font-medium">User</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Score</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Win Rate</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Debates</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Trend</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((leader) => (
                  <tr 
                    key={leader.id} 
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-semibold text-white">#{leader.rank}</td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 mr-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                          {leader.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-white">{leader.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono text-blue-400">{leader.score}</td>
                    <td className="p-3 text-right text-green-400">{leader.winRate}%</td>
                    <td className="p-3 text-right text-slate-300">{leader.debates}</td>
                    <td className="p-3 text-right">{getTrendBadge(leader.trend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
