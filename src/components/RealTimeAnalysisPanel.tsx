
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useDebateAnalysis } from '@/hooks/useDebateAnalysis';

interface RealTimeAnalysisPanelProps {
  isActive: boolean;
  onTranscriptUpdate?: (transcript: { speaker: 'AI' | 'Person'; text: string; timestamp: number }[]) => void;
  transcriptHistory?: { speaker: 'AI' | 'Person'; text: string; timestamp: number }[];
}

export const RealTimeAnalysisPanel = ({ isActive, onTranscriptUpdate, transcriptHistory = [] }: RealTimeAnalysisPanelProps) => {
  const {
    isListening,
    transcript,
    interimTranscript,
    analysis,
    startListening,
    stopListening,
    confidence,
  } = useSpeechRecognition();

  const { metrics, analyzeDebateContent } = useDebateAnalysis();

  useEffect(() => {
    if (isActive && !isListening) {
      startListening();
    } else if (!isActive && isListening) {
      stopListening();
    }
  }, [isActive, isListening, startListening, stopListening]);

  useEffect(() => {
    if (transcript) {
      analyzeDebateContent(transcript, confidence);
      // Add user transcript to global function
      if ((window as any).addUserTranscript) {
        (window as any).addUserTranscript(transcript);
      }
    }
  }, [transcript, confidence, analyzeDebateContent]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Real-Time Analysis</h2>
        <Badge className={isListening ? 'bg-green-600' : 'bg-gray-600'}>
          {isListening ? 'Listening' : 'Stopped'}
        </Badge>
      </div>

      {/* Speech Recognition Status */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Speech Recognition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Confidence</span>
            <span className="text-slate-300">{Math.round(confidence * 100)}%</span>
          </div>
          <Progress value={confidence * 100} className="h-2" />
          {interimTranscript && (
            <p className="text-xs text-green-400 italic">You: "{interimTranscript}"</p>
          )}
        </CardContent>
      </Card>

      {/* Speech Analysis */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-purple-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Speech Quality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Clarity</span>
              <span className={`${getScoreColor(analysis.clarity)} font-medium`}>
                {analysis.clarity}%
              </span>
            </div>
            <Progress value={analysis.clarity} className={`h-2 ${getProgressColor(analysis.clarity)}`} />
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Words per Minute</span>
              <span className="text-slate-300">{analysis.wordsPerMinute}</span>
            </div>
            <Progress value={Math.min(100, analysis.wordsPerMinute / 2)} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Filler Words</span>
              <p className="text-red-400 font-medium">{analysis.fillerWords.length}</p>
            </div>
            <div>
              <span className="text-slate-400">Pauses</span>
              <p className="text-yellow-400 font-medium">{analysis.pauseCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debate Analysis */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-green-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Debate Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Argument Strength</span>
              <span className={`${getScoreColor(metrics.argumentStrength)} font-medium`}>
                {metrics.argumentStrength}%
              </span>
            </div>
            <Progress value={metrics.argumentStrength} className={`h-2 ${getProgressColor(metrics.argumentStrength)}`} />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Topic Relevance</span>
              <span className={`${getScoreColor(metrics.topicRelevance)} font-medium`}>
                {metrics.topicRelevance}%
              </span>
            </div>
            <Progress value={metrics.topicRelevance} className={`h-2 ${getProgressColor(metrics.topicRelevance)}`} />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Engagement</span>
              <span className={`${getScoreColor(metrics.engagement)} font-medium`}>
                {metrics.engagement}%
              </span>
            </div>
            <Progress value={metrics.engagement} className={`h-2 ${getProgressColor(metrics.engagement)}`} />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Emotional Tone</span>
              <Badge className={
                metrics.emotionalTone === 'positive' ? 'bg-green-600' :
                metrics.emotionalTone === 'negative' ? 'bg-red-600' : 'bg-gray-600'
              }>
                {metrics.emotionalTone}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Structure Analysis */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-orange-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Debate Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${metrics.structure.hasOpening ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-slate-300">Opening</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${metrics.structure.hasArgument ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-slate-300">Argument</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${metrics.structure.hasRebuttal ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-slate-300">Rebuttal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${metrics.structure.hasConclusion ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-slate-300">Conclusion</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation History */}
      {transcriptHistory.length > 0 && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Conversation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto text-xs space-y-2 bg-slate-900/50 p-3 rounded">
              {transcriptHistory.map((entry, index) => (
                <div key={index} className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      entry.speaker === 'AI' ? 'text-blue-400' : 'text-green-400'
                    }`}>
                      {entry.speaker === 'AI' ? '🤖 Debatrix' : '👤 You'}:
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white text-sm ml-4">{entry.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current User Input */}
      {(transcript || interimTranscript) && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Your Current Speech</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-24 overflow-y-auto text-xs text-slate-300 bg-slate-900/50 p-2 rounded">
              {transcript && <p className="text-green-400">Confirmed: {transcript}</p>}
              {interimTranscript && (
                <p className="text-yellow-400 italic">Speaking: {interimTranscript}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
