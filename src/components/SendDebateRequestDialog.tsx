
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SendDebateRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string | null;
  onSend: (receiverId: string, topic: string, message?: string) => Promise<boolean>;
}

export const SendDebateRequestDialog = ({ 
  isOpen, 
  onClose, 
  receiverId, 
  onSend 
}: SendDebateRequestDialogProps) => {
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const predefinedTopics = [
    "Climate Change Solutions",
    "Artificial Intelligence Ethics",
    "Social Media Impact on Society",
    "Universal Basic Income",
    "Space Exploration vs Earth Problems",
    "Cryptocurrency Future",
    "Remote Work vs Office Work",
    "Electric Vehicles Adoption"
  ];

  const handleSend = async () => {
    if (!receiverId || !topic.trim()) return;

    setLoading(true);
    const success = await onSend(receiverId, topic.trim(), message.trim() || undefined);
    
    if (success) {
      setTopic('');
      setMessage('');
      onClose();
    }
    setLoading(false);
  };

  const handleClose = () => {
    setTopic('');
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🎯 Send Debate Challenge</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="topic">Debate Topic *</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter debate topic..."
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Quick Topics</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {predefinedTopics.slice(0, 4).map((predefinedTopic) => (
                <Button
                  key={predefinedTopic}
                  variant="outline"
                  size="sm"
                  onClick={() => setTopic(predefinedTopic)}
                  className="text-xs h-8 justify-start"
                >
                  {predefinedTopic}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="message">Optional Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message (optional)..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={!topic.trim() || loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Sending...' : 'Send Challenge'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
