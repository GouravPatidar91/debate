
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VideoInterface } from '@/components/VideoInterface';
import { RealTimeAnalysisPanel } from '@/components/RealTimeAnalysisPanel';
import { EnhancedLeaderboard } from '@/components/EnhancedLeaderboard';
import { EnhancedPostDebateResults } from '@/components/EnhancedPostDebateResults';
import { Navigation } from '@/components/Navigation';
import { UserDebatesSection } from '@/components/UserDebatesSection';
import { useAuth } from '@/contexts/AuthContext';
import { DebateResultsData } from '@/hooks/useDebateResults';
import Landing from './Landing';

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'debate' | 'results' | 'leaderboard' | 'user-debates'>('home');
  const [isDebating, setIsDebating] = useState(false);
  const [debateData, setDebateData] = useState<DebateResultsData | null>(null);
  const [transcriptHistory, setTranscriptHistory] = useState<{ speaker: 'AI' | 'Person'; text: string; timestamp: number }[]>([]);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // No redirect. Show Landing to unauthorized users instead.
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading your debate arena...</p>
        </div>
      </div>
    );
  }

  // 👇 Show the Landing page to unauthorized users
  if (!user) {
    return <Landing />;
  }

  const startDebate = () => {
    setCurrentView('debate');
    setIsDebating(true);
    setTranscriptHistory([]);
  };

  const endDebate = (results: any) => {
    setIsDebating(false);
    
    const enhancedResults: DebateResultsData = {
      ...results,
      comparison: {
        aiScore: Math.floor(Math.random() * 20) + 80,
        averageUserScore: Math.floor(Math.random() * 30) + 60,
        percentileRank: Math.floor(Math.random() * 40) + 60,
      },
      improvements: [
        "Practice using more concrete evidence to support your arguments",
        "Reduce filler words like 'um' and 'ah' for clearer delivery",
        "Improve your conclusion to better summarize key points",
        "Work on maintaining eye contact with the camera",
        "Structure your arguments with clearer transitions"
      ].slice(0, Math.floor(Math.random() * 3) + 2),
      metrics: {
        ...results.metrics,
        topicRelevance: Math.floor(Math.random() * 40) + 60,
        emotionalTone: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
        structure: {
          hasOpening: Math.random() > 0.3,
          hasArgument: Math.random() > 0.2,
          hasRebuttal: Math.random() > 0.5,
          hasConclusion: Math.random() > 0.4,
        }
      }
    };
    
    setDebateData(enhancedResults);
    setCurrentView('results');
  };

  const handleTranscriptUpdate = (newTranscriptHistory: { speaker: 'AI' | 'Person'; text: string; timestamp: number }[]) => {
    setTranscriptHistory(newTranscriptHistory);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'debate':
        return (
          <div className="flex flex-col lg:flex-row h-screen bg-background">
            <div className="flex-1 relative min-h-[60vh] lg:min-h-full">
              <VideoInterface 
                isDebating={isDebating} 
                onEndDebate={endDebate}
                onTranscriptUpdate={handleTranscriptUpdate}
              />
            </div>
            <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border">
              <RealTimeAnalysisPanel 
                isActive={isDebating} 
                onTranscriptUpdate={handleTranscriptUpdate}
                transcriptHistory={transcriptHistory}
              />
            </div>
          </div>
        );
      case 'results':
        return (
          <EnhancedPostDebateResults 
            data={debateData} 
            onReturnHome={() => setCurrentView('home')}
            onStartNewDebate={startDebate}
          />
        );
      case 'leaderboard':
        return (
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-6 lg:py-8">
              <Navigation currentView={currentView} onViewChange={setCurrentView} />
              <div className="mt-8">
                <EnhancedLeaderboard />
              </div>
            </div>
          </div>
        );
      case 'user-debates':
        return (
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-6 lg:py-8">
              <Navigation currentView={currentView} onViewChange={setCurrentView} />
              <div className="mt-8">
                <UserDebatesSection />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-6 lg:py-12">
              <Navigation currentView={currentView} onViewChange={setCurrentView} />
              
              {/* Hero Section */}
              <div className="text-center space-y-8 max-w-4xl mx-auto animate-slide-up">
                <div className="space-y-6">
                  <h1 className="text-display gradient-text animate-float">
                    Debatrix AI
                  </h1>
                  <p className="text-subheading text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Master the art of debate with our AI-powered platform. Get real-time analysis, 
                    personalized feedback, and compete globally.
                  </p>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    onClick={startDebate}
                    className="btn-primary text-lg px-8 py-4 w-full sm:w-auto animate-glow"
                  >
                    🎯 Start AI Debate
                  </Button>
                  <Button 
                    onClick={() => setCurrentView('user-debates')}
                    className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto"
                  >
                    🥊 Challenge Users
                  </Button>
                  <Button 
                    onClick={() => setCurrentView('leaderboard')}
                    className="btn-ghost text-lg px-8 py-4 w-full sm:w-auto"
                  >
                    🏆 View Leaderboard
                  </Button>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 lg:mt-24">
                <Card className="card-feature text-center p-6 animate-fade-in">
                  <div className="text-4xl mb-4 animate-float">🤖</div>
                  <h3 className="text-heading text-foreground mb-3">AI Opponent</h3>
                  <p className="text-body text-muted-foreground">
                    Debate against sophisticated AI with realistic responses and adaptive arguments
                  </p>
                </Card>
                
                <Card className="card-feature text-center p-6 animate-fade-in" style={{animationDelay: '0.1s'}}>
                  <div className="text-4xl mb-4 animate-float" style={{animationDelay: '1s'}}>🥊</div>
                  <h3 className="text-heading text-foreground mb-3">User vs User</h3>
                  <p className="text-body text-muted-foreground">
                    Challenge other users in real-time debates and test your skills against human opponents
                  </p>
                </Card>
                
                <Card className="card-feature text-center p-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
                  <div className="text-4xl mb-4 animate-float" style={{animationDelay: '2s'}}>📊</div>
                  <h3 className="text-heading text-foreground mb-3">Performance Insights</h3>
                  <p className="text-body text-muted-foreground">
                    Detailed analytics on clarity, structure, and persuasiveness of your arguments
                  </p>
                </Card>
                
                <Card className="card-feature text-center p-6 animate-fade-in" style={{animationDelay: '0.3s'}}>
                  <div className="text-4xl mb-4 animate-float" style={{animationDelay: '3s'}}>🏆</div>
                  <h3 className="text-heading text-foreground mb-3">Global Competition</h3>
                  <p className="text-body text-muted-foreground">
                    Compete with debaters worldwide and climb the live leaderboard rankings
                  </p>
                </Card>
              </div>

              {/* Stats Section */}
              <div className="mt-16 lg:mt-24">
                <div className="card-modern text-center max-w-3xl mx-auto">
                  <h2 className="text-heading mb-8">Join the Debate Revolution</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-primary">1000+</div>
                      <p className="text-muted-foreground">Active Debaters</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-primary">50k+</div>
                      <p className="text-muted-foreground">Debates Completed</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-primary">98%</div>
                      <p className="text-muted-foreground">Skill Improvement</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderContent();
};

export default Index;

