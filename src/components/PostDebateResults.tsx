
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PostDebateResultsProps {
  data: any;
  onReturnHome: () => void;
}

export const PostDebateResults = ({ data, onReturnHome }: PostDebateResultsProps) => {
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Button onClick={onReturnHome}>Return Home</Button>
      </div>
    );
  }

  const { score, duration, metrics } = data;
  
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
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Debate Results</h1>
          <Button onClick={onReturnHome}>Return Home</Button>
        </div>

        {/* Summary Card */}
        <Card className="bg-slate-900/70 backdrop-blur-sm border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-xl text-white">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-8 border-blue-500/50 flex flex-col items-center justify-center">
                  <div className={`text-6xl font-bold ${getScoreClass(score)}`}>
                    {getScoreLetter(score)}
                  </div>
                  <div className="text-lg text-slate-300">{score} points</div>
                </div>
                <p className="mt-4 text-slate-300">Debate duration: {formatTime(duration)}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Argument Strength</span>
                      <span className="text-slate-300">{metrics.argumentStrength}%</span>
                    </div>
                    <Progress 
                      value={metrics.argumentStrength} 
                      className={`h-2 ${getProgressColor(metrics.argumentStrength)}`}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Clarity</span>
                      <span className="text-slate-300">{metrics.clarity}%</span>
                    </div>
                    <Progress 
                      value={metrics.clarity} 
                      className={`h-2 ${getProgressColor(metrics.clarity)}`}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Engagement</span>
                      <span className="text-slate-300">{metrics.engagement}%</span>
                    </div>
                    <Progress 
                      value={metrics.engagement} 
                      className={`h-2 ${getProgressColor(metrics.engagement)}`}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Filler Words</span>
                      <span className="text-slate-300">{metrics.fillerWords} instances</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Card */}
        <Card className="bg-slate-900/70 backdrop-blur-sm border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-xl text-white">AI Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-slate-300">
              <p>
                Your debate performance showed {score >= 75 ? 'strong' : 'adequate'} argumentation skills.
                {score >= 80 ? ' Your points were clear and well-structured.' : ' There\'s room for improvement in structuring your arguments.'}
              </p>
              <p>
                {metrics.argumentStrength >= 75 
                  ? 'Your arguments were supported with solid reasoning and evidence.' 
                  : 'Consider backing up your points with more concrete evidence and examples.'}
              </p>
              <p>
                {metrics.clarity >= 75
                  ? 'Your speech was clear and easy to follow.' 
                  : 'Work on articulating your thoughts more clearly to enhance understanding.'}
              </p>
              <p>
                {metrics.engagement >= 75
                  ? 'You maintained good engagement throughout the debate.' 
                  : 'Try to be more dynamic in your delivery to better engage with your audience.'}
              </p>
              <p>
                {metrics.fillerWords <= 5
                  ? 'Your speech contained minimal filler words - well done!' 
                  : 'Practice reducing filler words like "um" and "ah" to sound more confident.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            onClick={onReturnHome}
            className="bg-transparent border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
          >
            Return Home
          </Button>
          
          <div className="space-x-4">
            <Button
              onClick={() => {}}
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
            >
              Share Results
            </Button>
            <Button
              onClick={() => {}}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Start New Debate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
