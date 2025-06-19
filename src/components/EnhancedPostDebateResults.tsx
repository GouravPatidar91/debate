import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDebateResults, DebateResultsData } from '@/hooks/useDebateResults';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedPostDebateResultsProps {
  data: DebateResultsData | null;
  onReturnHome: () => void;
  onStartNewDebate?: () => void;
}

export const EnhancedPostDebateResults = ({ 
  data, 
  onReturnHome, 
  onStartNewDebate 
}: EnhancedPostDebateResultsProps) => {
  const [savedResultId, setSavedResultId] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);
  const { saveDebateResult, shareDebateResult, isLoading } = useDebateResults();
  const { user } = useAuth();

  // Auto-save results when component mounts
  useEffect(() => {
    if (data && user && !savedResultId) {
      saveDebateResult(data, 'Climate Change Debate').then((result) => {
        if (result) {
          setSavedResultId(result.id);
        }
      });
    }
  }, [data, user, savedResultId, saveDebateResult]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Button onClick={onReturnHome}>Return Home</Button>
      </div>
    );
  }

  const { score, duration, metrics, comparison, improvements } = data;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLetter = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    return 'D';
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return "Outstanding performance! 🌟";
    if (score >= 80) return "Excellent debate skills! 🎯";
    if (score >= 70) return "Great job! Room for improvement. 👍";
    if (score >= 60) return "Good effort, keep practicing! 📈";
    return "Keep working on your skills! 💪";
  };

  const handleShareResults = async () => {
    if (!savedResultId) {
      console.error('No saved result ID available');
      return;
    }

    const success = await shareDebateResult(savedResultId, score);
    if (success) {
      setIsShared(true);
    }
  };

  const structureScore = Object.values(metrics.structure).filter(Boolean).length * 25;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-white flex items-center">
            🏆 Debate Results
            <Badge className="ml-4 bg-blue-600 text-lg px-4 py-2">
              {getPerformanceMessage(score)}
            </Badge>
          </h1>
          <Button onClick={onReturnHome} variant="outline" size="lg">
            Return Home
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Score Card */}
          <Card className="lg:col-span-1 bg-slate-900/70 backdrop-blur-sm border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-xl text-white text-center">Overall Performance</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="relative">
                <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-8 border-blue-500/50 flex flex-col items-center justify-center">
                  <div className={`text-7xl font-bold ${getScoreClass(score)}`}>
                    {getScoreLetter(score)}
                  </div>
                  <div className="text-2xl text-slate-300">{score}/100</div>
                </div>
                <Badge className="absolute -top-2 -right-2 bg-purple-600 text-lg px-3 py-1">
                  {comparison.percentileRank}th percentile
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-slate-300">Duration: {formatTime(duration)}</p>
                <p className="text-slate-300">Filler words: {metrics.fillerWords}</p>
                {savedResultId && (
                  <Badge className={isShared ? "bg-green-600" : "bg-blue-600"}>
                    {isShared ? "✓ Shared to Leaderboard" : "Ready to Share"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <Card className="lg:col-span-2 bg-slate-900/70 backdrop-blur-sm border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-xl text-white">Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Argument Strength</span>
                      <span className={`${getScoreClass(metrics.argumentStrength)} font-medium`}>
                        {metrics.argumentStrength}%
                      </span>
                    </div>
                    <Progress 
                      value={metrics.argumentStrength} 
                      className={`h-3 ${getProgressColor(metrics.argumentStrength)}`}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Clarity & Delivery</span>
                      <span className={`${getScoreClass(metrics.clarity)} font-medium`}>
                        {metrics.clarity}%
                      </span>
                    </div>
                    <Progress 
                      value={metrics.clarity} 
                      className={`h-3 ${getProgressColor(metrics.clarity)}`}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Engagement</span>
                      <span className={`${getScoreClass(metrics.engagement)} font-medium`}>
                        {metrics.engagement}%
                      </span>
                    </div>
                    <Progress 
                      value={metrics.engagement} 
                      className={`h-3 ${getProgressColor(metrics.engagement)}`}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Topic Relevance</span>
                      <span className={`${getScoreClass(metrics.topicRelevance)} font-medium`}>
                        {metrics.topicRelevance}%
                      </span>
                    </div>
                    <Progress 
                      value={metrics.topicRelevance} 
                      className={`h-3 ${getProgressColor(metrics.topicRelevance)}`}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Structure Score</span>
                      <span className={`${getScoreClass(structureScore)} font-medium`}>
                        {structureScore}%
                      </span>
                    </div>
                    <Progress 
                      value={structureScore} 
                      className={`h-3 ${getProgressColor(structureScore)}`}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Emotional Tone</span>
                      <Badge className={
                        metrics.emotionalTone === 'positive' ? 'bg-green-600' :
                        metrics.emotionalTone === 'negative' ? 'bg-red-600' : 'bg-gray-600'
                      }>
                        {metrics.emotionalTone}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison & Structure */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Performance Comparison */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border-green-500/30">
            <CardHeader>
              <CardTitle className="text-xl text-white">📊 Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                <span className="text-slate-300">Your Score</span>
                <span className={`text-xl font-bold ${getScoreClass(score)}`}>{score}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                <span className="text-slate-300">AI Opponent</span>
                <span className="text-xl font-bold text-blue-400">{comparison.aiScore}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                <span className="text-slate-300">Average User</span>
                <span className="text-xl font-bold text-yellow-400">{comparison.averageUserScore}</span>
              </div>
              <div className="text-center pt-2">
                <Badge className="bg-purple-600 text-lg px-4 py-2">
                  Top {100 - comparison.percentileRank}% of all debaters!
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Debate Structure */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-xl text-white">🏗️ Debate Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(metrics.structure).map(([key, completed]) => (
                  <div key={key} className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded">
                    <div className={`w-4 h-4 rounded-full ${completed ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className="text-slate-300 capitalize">
                      {key.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    {completed && <span className="text-green-400">✓</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Progress value={structureScore} className={`h-3 ${getProgressColor(structureScore)}`} />
                <p className="text-sm text-slate-400 mt-2">
                  Structure Completeness: {structureScore}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Feedback & Improvements */}
        <Card className="bg-slate-900/70 backdrop-blur-sm border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-xl text-white">🤖 AI Analysis & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">📝 Detailed Feedback</h3>
                <div className="space-y-3 text-slate-300">
                  <p>
                    Your debate performance scored {score}/100, placing you in the {comparison.percentileRank}th percentile.
                    {score >= 80 ? ' Your arguments were well-structured and convincing.' : ' There\'s significant room for improvement in your argumentation.'}
                  </p>
                  <p>
                    {metrics.argumentStrength >= 75 
                      ? 'Your arguments demonstrated solid evidence and logical reasoning.' 
                      : 'Consider strengthening your arguments with more concrete evidence and clearer logical connections.'}
                  </p>
                  <p>
                    {metrics.clarity >= 75
                      ? 'Your speech was clear and articulate throughout the debate.' 
                      : 'Focus on speaking more clearly and reducing filler words to improve your delivery.'}
                  </p>
                  <p>
                    {metrics.topicRelevance >= 70
                      ? 'You stayed well-focused on the debate topic.' 
                      : 'Try to maintain closer focus on the specific debate topic and avoid tangential points.'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">🎯 Areas for Improvement</h3>
                <div className="space-y-2">
                  {improvements.map((improvement, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-slate-800/50 rounded">
                      <span className="text-blue-400 font-bold text-lg">{index + 1}.</span>
                      <span className="text-slate-300">{improvement}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button
            onClick={onReturnHome}
            variant="outline"
            size="lg"
            className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
          >
            🏠 Return Home
          </Button>
          
          <div className="space-x-4">
            <Button
              onClick={handleShareResults}
              disabled={!savedResultId || isShared || isLoading}
              variant="outline"
              size="lg"
              className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white disabled:opacity-50"
            >
              {isLoading ? '⏳ Sharing...' : isShared ? '✓ Shared to Leaderboard' : '📤 Share to Leaderboard'}
            </Button>
            <Button
              onClick={onStartNewDebate}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              🎯 Start New Debate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
