
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLeaderboard } from '@/hooks/useLeaderboard';

export const EnhancedLeaderboard = () => {
  const { leaders, isLoading } = useLeaderboard();
  const [filterBy, setFilterBy] = useState<'global' | 'monthly' | 'weekly'>('global');
  const [sortBy, setSortBy] = useState<'score' | 'winRate' | 'debates'>('score');

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  const getTrendBadge = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <Badge className="bg-green-600 text-xs">↑</Badge>;
      case 'down':
        return <Badge className="bg-red-600 text-xs">↓</Badge>;
      default:
        return <Badge className="bg-gray-600 text-xs">—</Badge>;
    }
  };

  const getRankDisplay = (rank: number | null) => {
    if (!rank) return '#--';
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getDisplayData = () => {
    let filteredData = [...leaders];
    
    // Sort based on selected criteria
    if (sortBy === 'score') {
      filteredData = filteredData.sort((a, b) => b.total_score - a.total_score);
    } else if (sortBy === 'winRate') {
      filteredData = filteredData.sort((a, b) => b.win_rate - a.win_rate);
    } else {
      filteredData = filteredData.sort((a, b) => b.total_debates - a.total_debates);
    }

    return filteredData;
  };

  const displayedLeaders = getDisplayData();

  return (
    <Card className="bg-slate-900/70 backdrop-blur-sm border-blue-500/30">
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <CardTitle className="text-xl text-white flex items-center">
            🏆 Live Global Leaderboard
            <Badge className="ml-2 bg-green-600 animate-pulse">LIVE</Badge>
          </CardTitle>
          
          <div className="flex space-x-2 flex-wrap">
            {/* Time Filter */}
            <div className="flex space-x-1">
              {(['global', 'monthly', 'weekly'] as const).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={filterBy === filter ? 'default' : 'outline'}
                  onClick={() => setFilterBy(filter)}
                  className="text-xs"
                >
                  {filter === 'global' ? 'All Time' : filter}
                </Button>
              ))}
            </div>
            
            {/* Sort Filter */}
            <div className="flex space-x-1">
              {([
                { key: 'score', label: 'Score' },
                { key: 'winRate', label: 'Win Rate' },
                { key: 'debates', label: 'Debates' }
              ] as const).map(({ key, label }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={sortBy === key ? 'default' : 'outline'}
                  onClick={() => setSortBy(key)}
                  className="text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : displayedLeaders.length === 0 ? (
          <div className="text-center p-8 text-slate-400">
            <p>No leaderboard entries yet. Be the first to share your debate results!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left border-b border-slate-700">
                <tr>
                  <th className="p-3 text-slate-400 font-medium">Rank</th>
                  <th className="p-3 text-slate-400 font-medium">Player</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Score</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Win Rate</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Debates</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Last Match</th>
                  <th className="p-3 text-slate-400 font-medium text-right">Trend</th>
                </tr>
              </thead>
              <tbody>
                {displayedLeaders.slice(0, 20).map((leader, index) => (
                  <tr 
                    key={leader.id} 
                    className={`border-b border-slate-800 hover:bg-slate-800/50 transition-all duration-200 ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-900/20 to-transparent' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-white text-lg">
                      {getRankDisplay(leader.rank)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                            {leader.username.substring(0, 2).toUpperCase()}
                          </div>
                          {leader.is_online && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <span className="text-white font-medium">{leader.username}</span>
                          {leader.is_online && (
                            <Badge className="ml-2 bg-green-600 text-xs">Online</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-mono text-blue-400 font-bold text-lg">
                        {leader.total_score.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-green-400 font-medium">{leader.win_rate.toFixed(1)}%</span>
                    </td>
                    <td className="p-3 text-right text-slate-300 font-medium">
                      {leader.total_debates}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-medium ${
                        !leader.last_match_score ? 'text-slate-500' :
                        leader.last_match_score >= 80 ? 'text-green-400' :
                        leader.last_match_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {leader.last_match_score || '--'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {getTrendBadge(leader.trend)}
                        <span className="text-sm">{getTrendIcon(leader.trend)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="mt-4 text-center">
              <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30">
                🔄 Live updates via WebSocket
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
