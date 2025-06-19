
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AnalysisPanelProps {
  isActive: boolean;
}

export const AnalysisPanel = ({ isActive }: AnalysisPanelProps) => {
  const [metrics, setMetrics] = useState({
    argumentStrength: 0,
    clarity: 0,
    engagement: 0,
    fillerWords: 0,
    speakingTime: 0,
    pauses: 0,
  });

  const [realtimeData, setRealtimeData] = useState({
    currentScore: 0,
    wordsPerMinute: 0,
    confidence: 0,
  });

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        setMetrics(prev => ({
          argumentStrength: Math.min(100, prev.argumentStrength + Math.random() * 5),
          clarity: Math.min(100, prev.clarity + Math.random() * 3),
          engagement: Math.min(100, prev.engagement + Math.random() * 4),
          fillerWords: prev.fillerWords + (Math.random() > 0.8 ? 1 : 0),
          speakingTime: prev.speakingTime + 1,
          pauses: prev.pauses + (Math.random() > 0.9 ? 1 : 0),
        }));

        setRealtimeData(prev => ({
          currentScore: Math.min(100, prev.currentScore + (Math.random() * 2 - 1)),
          wordsPerMinute: 75 + Math.random() * 20,
          confidence: Math.min(100, prev.confidence + (Math.random() * 4 - 2)),
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorForValue = (value: number) => {
    if (value < 40) return 'bg-red-500';
    if (value < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold text-white border-b border-blue-500/30 pb-2">Live Analysis</h2>

      {/* Current Score */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-500/30 p-4">
        <h3 className="text-lg font-medium text-white mb-2">Performance Score</h3>
        <div className="flex items-center">
          <div className="text-4xl font-bold text-blue-400 mr-4">
            {Math.round(realtimeData.currentScore)}
          </div>
          <div className="flex-1">
            <Progress value={realtimeData.currentScore} className="h-3" />
          </div>
        </div>
      </Card>

      {/* Speaking Stats */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-purple-500/30 p-4">
        <h3 className="text-lg font-medium text-white mb-3">Speaking Metrics</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">Speaking Time</span>
              <span className="text-slate-300">{formatTime(metrics.speakingTime)}</span>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">Words Per Minute</span>
              <span className="text-slate-300">{Math.round(realtimeData.wordsPerMinute)}</span>
            </div>
            <Progress value={realtimeData.wordsPerMinute / 2} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">Pauses</span>
              <span className="text-slate-300">{metrics.pauses}</span>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">Filler Words</span>
              <span className="text-slate-300">{metrics.fillerWords}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Argument Quality */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-500/30 p-4">
        <h3 className="text-lg font-medium text-white mb-3">Argument Quality</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">Argument Strength</span>
              <span className="text-slate-300">{Math.round(metrics.argumentStrength)}%</span>
            </div>
            <Progress 
              value={metrics.argumentStrength} 
              className={`h-2 ${getColorForValue(metrics.argumentStrength)}`} 
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">Clarity</span>
              <span className="text-slate-300">{Math.round(metrics.clarity)}%</span>
            </div>
            <Progress 
              value={metrics.clarity} 
              className={`h-2 ${getColorForValue(metrics.clarity)}`} 
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">Engagement</span>
              <span className="text-slate-300">{Math.round(metrics.engagement)}%</span>
            </div>
            <Progress 
              value={metrics.engagement} 
              className={`h-2 ${getColorForValue(metrics.engagement)}`} 
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">Confidence</span>
              <span className="text-slate-300">{Math.round(realtimeData.confidence)}%</span>
            </div>
            <Progress 
              value={realtimeData.confidence} 
              className={`h-2 ${getColorForValue(realtimeData.confidence)}`} 
            />
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-purple-500/30 p-4">
        <h3 className="text-lg font-medium text-white mb-2">Live Tips</h3>
        <ul className="space-y-2 text-sm">
          <li className="text-slate-300">• Try to reduce filler words like "um" and "ah"</li>
          <li className="text-slate-300">• Support your claims with specific data</li>
          <li className="text-slate-300">• Maintain consistent eye contact</li>
          <li className="text-slate-300">• Vary your tone for better engagement</li>
        </ul>
      </Card>
    </div>
  );
};
