
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserVsUserDebate } from '@/components/UserVsUserDebate';
import { useAuth } from '@/contexts/AuthContext';

const DebatePage = () => {
  const { debateId } = useParams<{ debateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user || !debateId) {
    navigate('/auth');
    return null;
  }

  const handleEndDebate = () => {
    navigate('/');
  };

  return (
    <UserVsUserDebate 
      debateId={debateId}
      onEndDebate={handleEndDebate}
    />
  );
};

export default DebatePage;
