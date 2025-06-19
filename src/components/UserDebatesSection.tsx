
import React from 'react';
import { OnlineUsers } from './OnlineUsers';
import { DebateRequests } from './DebateRequests';

export const UserDebatesSection = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            🥊 Challenge Other Debaters
          </h1>
          <p className="text-muted-foreground">
            Connect with other users and engage in real-time debates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OnlineUsers />
          <DebateRequests />
        </div>
      </div>
    </div>
  );
};
