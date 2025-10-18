import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ReplyIcon from '@mui/icons-material/Reply';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  Paper, 
  Typography, 
  Avatar, 
  IconButton, 
  Box, 
  CircularProgress 
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

const API_BASE_URL = 'http://localhost:8000/api';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 24,
    boxShadow: `0 20px 40px ${alpha('#dc3545', 0.15)}`,
    background: alpha('#ffffff', 0.95),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha('#e9ecef', 0.2)}`,
    overflow: 'hidden',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    width: '500px',
    height: '600px',
  },
}));

const DialogHeader = styled('div')(({ theme }) => ({
  padding: '24px',
  background: `linear-gradient(135deg,
    ${alpha('#ffffff', 0.95)} 0%,
    ${alpha('#f8f9fa', 0.98)} 100%
  ),
  radial-gradient(
    circle at 70% 30%,
    ${alpha('#dc3545', 0.08)} 0%,
    transparent 50%
  )`,
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  borderBottom: `1px solid ${alpha('#e9ecef', 0.2)}`,
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(-45deg,
      #dc3545,
      #c82333,
      #bd2130,
      #dc3545
    )`,
    backgroundSize: '400% 400%',
    animation: 'gradient 15s ease infinite',
  },
  '@keyframes gradient': {
    '0%': {
      backgroundPosition: '0% 50%'
    },
    '50%': {
      backgroundPosition: '100% 50%'
    },
    '100%': {
      backgroundPosition: '0% 50%'
    }
  }
}));

const HeaderLogo = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flex: 1,
  '& h2': {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    background: `linear-gradient(135deg, #dc3545, #c82333)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }
}));

const MessageList = styled(List)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  marginBottom: 0,
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: alpha('#f8f9fa', 0.8),
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: `linear-gradient(135deg, #dc3545, #c82333)`,
    borderRadius: '4px',
    '&:hover': {
      background: `linear-gradient(135deg, #c82333, #bd2130)`,
    }
  }
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  marginBottom: '16px',
  '&:last-child': {
    marginBottom: 0,
  },
}));

const MessagePaper = styled(Paper)(({ theme, isUser, isStreaming }) => ({
  padding: '16px',
  maxWidth: '80%',
  borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
  boxShadow: isUser
    ? `0 8px 16px ${alpha('#dc3545', 0.2)}`
    : `0 4px 12px ${alpha('#e9ecef', 0.3)}`,
  background: isUser
    ? `linear-gradient(135deg, #dc3545, #c82333)`
    : alpha('#ffffff', 0.9),
  color: isUser ? '#FFFFFF' : '#212529',
  position: 'relative',
  border: isUser ? 'none' : `1px solid ${alpha('#e9ecef', 0.2)}`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: isUser
      ? `0 12px 24px ${alpha('#dc3545', 0.3)}`
      : `0 8px 16px ${alpha('#e9ecef', 0.4)}`,
  },
  '& .MuiTypography-root': {
    fontSize: '1rem',
    lineHeight: 1.6,
    letterSpacing: '0.1px',
    color: isUser ? '#FFFFFF' : 'inherit'
  },
  '@keyframes dot1': {
    '0%, 20%': { opacity: 0 },
    '40%': { opacity: 1 },
    '60%, 100%': { opacity: 0 }
  },
  '@keyframes dot2': {
    '0%, 40%': { opacity: 0 },
    '60%': { opacity: 1 },
    '80%, 100%': { opacity: 0 }
  },
  '@keyframes dot3': {
    '0%, 60%': { opacity: 0 },
    '80%': { opacity: 1 },
    '100%': { opacity: 0 }
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '20px',
    backgroundColor: alpha('#ffffff', 0.9),
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: `0 4px 12px ${alpha('#dc3545', 0.1)}`,
      transform: 'translateY(-2px)',
    },
    '&.Mui-focused': {
      boxShadow: `0 8px 16px ${alpha('#dc3545', 0.15)}`,
      transform: 'translateY(-2px)',
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: alpha('#e9ecef', 0.3),
  },
}));

const SendButton = styled(Button)(({ theme }) => ({
  minWidth: '48px',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  padding: 0,
  marginTop: '8px',
  background: `linear-gradient(135deg, #dc3545, #c82333)`,
  color: '#ffffff',
  boxShadow: `0 8px 16px ${alpha('#dc3545', 0.3)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    background: `linear-gradient(135deg, #c82333, #bd2130)`,
    boxShadow: `0 12px 24px ${alpha('#dc3545', 0.4)}`,
    transform: 'translateY(-2px)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '20px',
    transition: 'transform 0.3s ease',
  },
  '&:disabled': {
    background: alpha('#6c757d', 0.5),
    color: alpha('#ffffff', 0.7),
    boxShadow: 'none',
  },
  '& .MuiCircularProgress-root': {
    color: 'inherit'
  }
}));

const CardinalConcordiaDialog = ({ open, onClose }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Add welcome message
      setMessages([{
        id: 'welcome',
        type: 'bot',
        content: 'Hello! I\'m Cardinal Concordia, your AI research assistant. I can help you find grants, connect with researchers, and answer questions about the platform. How can I assist you today?',
        timestamp: new Date()
      }]);
    }
  }, [open, messages.length]);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (question.trim() && !loading) {
        handleSubmit();
      }
    }
  };

  const handleQuestionChange = (event) => {
    setQuestion(event.target.value);
  };

  const handleSubmit = async () => {
    if (!question.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    // Create a temporary bot message for streaming
    const tempBotMessageId = Date.now() + 1;
    const tempBotMessage = {
      id: tempBotMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, tempBotMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          conversation_history: messages.slice(-5) // Send last 5 messages for context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }

              if (data.content) {
                fullContent += data.content;
                // Update the streaming message
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === tempBotMessageId 
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                );
              }

              if (data.done) {
                // Mark streaming as complete
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === tempBotMessageId 
                      ? { ...msg, isStreaming: false }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error querying chatbot:', error);
      // Replace the streaming message with an error message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempBotMessageId 
            ? { 
                ...msg, 
                content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
                isStreaming: false
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const LoadingDots = () => (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <Typography component="span" sx={{ animation: 'dot1 1.4s infinite' }}>.</Typography>
      <Typography component="span" sx={{ animation: 'dot2 1.4s infinite' }}>.</Typography>
      <Typography component="span" sx={{ animation: 'dot3 1.4s infinite' }}>.</Typography>
    </Box>
  );

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogHeader>
        <HeaderLogo>
          <Box sx={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <img
              src="/images/ConcordiaLogo.png"
              alt="Cardinal Concordia"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '50%'
              }}
            />
          </Box>
          <h2>Cardinal Concordia</h2>
        </HeaderLogo>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#6c757d',
            '&:hover': {
              color: '#212529',
              transform: 'rotate(90deg)',
              transition: 'all 0.2s ease-in-out'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogHeader>

      <DialogContent sx={{
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        <MessageList>
          {messages.map((message) => (
            <React.Fragment key={message.id}>
              <StyledListItem alignItems="flex-start">
                {message.type === 'user' ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
                    <MessagePaper isUser elevation={0}>
                      <Typography variant="body1">{message.content}</Typography>
                    </MessagePaper>
                    <Typography variant="caption" sx={{ mt: 1, color: '#6c757d' }}>You</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      }}>
                        <img
                          src="/images/ConcordiaLogo.png"
                          alt="Cardinal Concordia"
                          style={{
                            width: '32px',
                            height: '32px',
                            objectFit: 'contain',
                            borderRadius: '50%'
                          }}
                        />
                      </Box>
                      <MessagePaper elevation={0} isStreaming={message.isStreaming}>
                        {message.isStreaming && !message.content ? (
                          <LoadingDots />
                        ) : (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <Typography variant="body1" component="p" sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
                                  {children}
                                </Typography>
                              ),
                              h1: ({ children }) => (
                                <Typography variant="h5" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
                                  {children}
                                </Typography>
                              ),
                              h2: ({ children }) => (
                                <Typography variant="h6" component="h2" sx={{ mb: 1, fontWeight: 600 }}>
                                  {children}
                                </Typography>
                              ),
                              h3: ({ children }) => (
                                <Typography variant="subtitle1" component="h3" sx={{ mb: 1, fontWeight: 600 }}>
                                  {children}
                                </Typography>
                              ),
                              strong: ({ children }) => (
                                <Typography component="span" sx={{ fontWeight: 600 }}>
                                  {children}
                                </Typography>
                              ),
                              em: ({ children }) => (
                                <Typography component="span" sx={{ fontStyle: 'italic' }}>
                                  {children}
                                </Typography>
                              ),
                              ul: ({ children }) => (
                                <Box component="ul" sx={{ pl: 2, mb: 1 }}>
                                  {children}
                                </Box>
                              ),
                              ol: ({ children }) => (
                                <Box component="ol" sx={{ pl: 2, mb: 1 }}>
                                  {children}
                                </Box>
                              ),
                              li: ({ children }) => (
                                <Typography component="li" variant="body1" sx={{ mb: 0.5 }}>
                                  {children}
                                </Typography>
                              ),
                              code: ({ children }) => (
                                <Box
                                  component="code"
                                  sx={{
                                    backgroundColor: alpha('#dc3545', 0.1),
                                    color: '#dc3545',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.875rem',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {children}
                                </Box>
                              ),
                              blockquote: ({ children }) => (
                                <Box
                                  sx={{
                                    borderLeft: `4px solid #dc3545`,
                                    pl: 2,
                                    ml: 2,
                                    mb: 1,
                                    fontStyle: 'italic',
                                    color: '#6c757d',
                                  }}
                                >
                                  {children}
                                </Box>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        )}
                      </MessagePaper>
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, color: '#6c757d' }}>Cardinal Concordia</Typography>
                  </Box>
                )}
              </StyledListItem>
            </React.Fragment>
          ))}
        </MessageList>
        
        <Box sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: alpha('#e9ecef', 0.3),
          background: '#f8f9fa'
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <StyledTextField
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              placeholder="Ask Cardinal Concordia about grants, researchers, or the platform..."
              value={question}
              onChange={handleQuestionChange}
              onKeyPress={handleKeyPress}
            />
            <SendButton
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || !question.trim()}
            >
              {loading ? <CircularProgress size={20} /> : <SendIcon />}
            </SendButton>
          </Box>
        </Box>
      </DialogContent>
    </StyledDialog>
  );
};

export default CardinalConcordiaDialog;
