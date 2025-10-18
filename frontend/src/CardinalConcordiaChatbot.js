import React, { useState } from 'react';
import { Button, styled, alpha } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import CardinalConcordiaDialog from './CardinalConcordiaDialog';

const FloatingChatButton = styled(Button)(({ theme, $isOpen }) => ({
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: $isOpen 
    ? `linear-gradient(135deg, ${alpha('#dc3545', 0.9)} 0%, ${alpha('#c82333', 0.9)} 100%)`
    : `linear-gradient(135deg, #dc3545 0%, #c82333 100%)`,
  color: 'white',
  boxShadow: `0 8px 32px ${alpha('#dc3545', 0.4)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 1000,
  '&:hover': {
    background: `linear-gradient(135deg, #c82333 0%, #bd2130 100%)`,
    boxShadow: `0 12px 40px ${alpha('#dc3545', 0.5)}`,
    transform: 'translateY(-4px) scale(1.05)',
  },
  '&:active': {
    transform: 'translateY(-2px) scale(1.02)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '28px',
    transition: 'transform 0.3s ease',
    transform: $isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
  },
  // Pulse animation when closed
  ...(!$isOpen && {
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': {
        boxShadow: `0 8px 32px ${alpha('#dc3545', 0.4)}`,
      },
      '50%': {
        boxShadow: `0 8px 32px ${alpha('#dc3545', 0.6)}, 0 0 0 8px ${alpha('#dc3545', 0.1)}`,
      },
      '100%': {
        boxShadow: `0 8px 32px ${alpha('#dc3545', 0.4)}`,
      },
    },
  }),
}));

const CardinalConcordiaChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <FloatingChatButton
        onClick={handleToggle}
        $isOpen={isOpen}
        aria-label={isOpen ? 'Close Cardinal Concordia Chat' : 'Open Cardinal Concordia Chat'}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </FloatingChatButton>
      
      <CardinalConcordiaDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default CardinalConcordiaChatbot;
