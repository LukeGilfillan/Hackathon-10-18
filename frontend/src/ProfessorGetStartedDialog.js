import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Typography,
  TextField,
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Chip
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

const API_BASE_URL = 'http://localhost:8000/api';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  zIndex: 9999,
  '& .MuiBackdrop-root': {
    background: 'linear-gradient(135deg, rgba(255, 76, 81, 0.1) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 76, 81, 0.1) 100%)',
    backdropFilter: 'blur(8px)',
  },
  '& .MuiDialog-paper': {
    borderRadius: '32px',
    padding: 0,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 24px 40px rgba(255, 76, 81, 0.2)',
    overflow: 'hidden',
    minHeight: '600px',
    maxHeight: '90vh',
    maxWidth: '1200px',
    width: '95%',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10000,
    border: '1px solid rgba(255, 76, 81, 0.2)',
    [theme.breakpoints.down('lg')]: {
      maxWidth: '1000px',
      width: '90%',
    },
    [theme.breakpoints.down('md')]: {
      maxWidth: '800px',
      width: '90%',
    },
    [theme.breakpoints.down('sm')]: {
      borderRadius: '24px',
      margin: theme.spacing(1),
      maxHeight: '90vh',
      minHeight: 'auto',
      width: 'calc(100% - 16px)',
      maxWidth: 'calc(100% - 16px)',
    }
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(theme.palette.background.paper, 0.5),
    borderRadius: '16px',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 0.7),
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
    }
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '24px',
  padding: '12px 24px',
  background: `linear-gradient(45deg, #FF4C51 30%, #FF7074 90%)`,
  color: '#fff',
  boxShadow: '0 3px 5px 2px rgba(255, 76, 81, .3)',
  '&:hover': {
    background: `linear-gradient(45deg, #FF7074 30%, #FF4C51 90%)`,
  },
  '&:disabled': {
    background: '#f5f5f5',
    color: '#999',
    boxShadow: 'none',
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: '20px',
    padding: '10px 20px',
    fontSize: '0.9rem',
    minHeight: '48px'
  }
}));

const WelcomeSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3, 6),
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '32px 32px 0 0',
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(3, 5),
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3, 4),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2, 3),
  }
}));

const ContentSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 6),
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(4, 5),
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(4, 4),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2, 3),
  }
}));

const ScrollableContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingRight: theme.spacing(1),
  minHeight: 0,
  maxHeight: 'calc(90vh - 300px)',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#FF4C51',
    borderRadius: '4px',
    '&:hover': {
      background: '#E64449',
    }
  },
  scrollbarWidth: 'thin',
  scrollbarColor: '#FF4C51 #f1f1f1',
}));

const ButtonSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 6, 4, 6),
  borderTop: '1px solid #e0e0e0',
  marginTop: theme.spacing(2),
  flexShrink: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  position: 'sticky',
  bottom: 0,
  zIndex: 1,
  borderRadius: '0 0 32px 32px',
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(3, 5, 4, 5),
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3, 4, 4, 4),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 3, 4, 3),
  }
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 76, 81, 0.1)',
  color: '#FF4C51',
  marginBottom: theme.spacing(1.5)
}));

const ProfessorGetStartedDialog = ({ open, onClose, currentUser, onProfileComplete, isNewProfile = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Simplified form data
  const [profileData, setProfileData] = useState({
    name: '',
    title: '',
    department: '',
    school: '',
    university: '',
    research_areas: [],
    capability_and_strategy: ''
  });

  const [newResearchArea, setNewResearchArea] = useState('');

  // Initialize form with user data
  useEffect(() => {
    if (currentUser?.professor_profile) {
      const profile = currentUser.professor_profile;
      setProfileData({
        name: profile.name || '',
        title: profile.title || '',
        department: profile.department || '',
        school: profile.school || '',
        university: profile.university || '',
        research_areas: profile.research_areas || [],
        capability_and_strategy: profile.capability_and_strategy || ''
      });
    } else if (currentUser?.email) {
      // Set basic info from email for new users
      const emailName = currentUser.email.split('@')[0].replace(/[._]/g, ' ');
      setProfileData(prev => ({
        ...prev,
        name: prev.name || emailName
      }));
    }
  }, [currentUser]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addResearchArea = () => {
    if (newResearchArea.trim() && !profileData.research_areas.includes(newResearchArea.trim())) {
      setProfileData(prev => ({
        ...prev,
        research_areas: [...prev.research_areas, newResearchArea.trim()]
      }));
      setNewResearchArea('');
    }
  };

  const removeResearchArea = (area) => {
    setProfileData(prev => ({
      ...prev,
      research_areas: prev.research_areas.filter(a => a !== area)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE_URL}/professors/${currentUser.email}/update/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${sessionToken}`,
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      setSuccess(true);
      setTimeout(() => {
        onProfileComplete();
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = () => {
    return true; // No requirements - always allow completion
  };

  if (success) {
    return (
      <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 6 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircleIcon sx={{ fontSize: 80, color: '#FF4C51', mb: 2 }} />
            <Typography variant="h4" sx={{ mb: 2, color: '#FF4C51', fontWeight: 600 }}>
              {isNewProfile ? 'Profile Complete!' : 'Profile Updated!'}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Your professor profile has been successfully {isNewProfile ? 'created' : 'updated'}. You can now receive personalized grant recommendations.
            </Typography>
          </motion.div>
        </DialogContent>
      </StyledDialog>
    );
  }

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      disableEscapeKeyDown
    >
      <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            zIndex: 10001,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>

        <WelcomeSection sx={{ flexShrink: 0 }}>
          <IconWrapper>
            <SchoolIcon sx={{ fontSize: 32 }} />
          </IconWrapper>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#FF4C51', textAlign: 'center' }}>
            {isNewProfile ? 'Complete Your Professor Profile' : 'Review & Update Your Professor Profile'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: '500px', fontStyle: 'italic' }}>
            Tell us about your research capabilities and strategy
          </Typography>
        </WelcomeSection>

        <ContentSection>
          <ScrollableContent>
            <Box sx={{ minHeight: '500px', padding: 3 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ mb: 4, color: '#FF4C51', fontWeight: 600 }}>
                      Your Profile Information
                    </Typography>
                    
                    <Grid container spacing={4}>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          label="Full Name"
                          fullWidth
                          value={profileData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          InputProps={{
                            startAdornment: <PersonIcon sx={{ color: 'text.secondary', mr: 1 }} />
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          label="Title/Position"
                          fullWidth
                          value={profileData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="e.g., Professor, Associate Professor"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          label="Department"
                          fullWidth
                          value={profileData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          placeholder="e.g., Computer Science"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          label="School/College"
                          fullWidth
                          value={profileData.school}
                          onChange={(e) => handleInputChange('school', e.target.value)}
                          placeholder="e.g., School of Engineering"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <StyledTextField
                          label="University/Institution"
                          fullWidth
                          value={profileData.university}
                          onChange={(e) => handleInputChange('university', e.target.value)}
                          placeholder="e.g., University of California, Berkeley"
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                            Research Areas
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                            {profileData.research_areas.map((area, index) => (
                              <Chip
                                key={index}
                                label={area}
                                onDelete={() => removeResearchArea(area)}
                                sx={{ 
                                  color: '#FF4C51', 
                                  borderColor: '#FF4C51',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 76, 81, 0.1)'
                                  }
                                }}
                                variant="outlined"
                              />
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <StyledTextField
                              label="Add Research Area"
                              value={newResearchArea}
                              onChange={(e) => setNewResearchArea(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addResearchArea()}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                            <Button
                              variant="outlined"
                              onClick={addResearchArea}
                              disabled={!newResearchArea.trim()}
                            >
                              Add
                            </Button>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: '#FF4C51' }}>
                            Your Research Plans & App Strategy
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                            Describe your research capabilities, expertise, and how you plan to use this grant matching app. Include your unique strengths, past successes, research goals, and your strategy for finding and securing grants through this platform.
                          </Typography>
                        </Box>
                        <StyledTextField
                          label="Research Plans & App Strategy"
                          multiline
                          rows={6}
                          fullWidth
                          value={profileData.capability_and_strategy}
                          onChange={(e) => handleInputChange('capability_and_strategy', e.target.value)}
                          placeholder="Example: I am a computer science professor specializing in machine learning and AI. My research focuses on developing ethical AI systems for healthcare applications. I have successfully secured 3 NSF grants totaling $2.5M over the past 5 years. Through this app, I plan to find grants that align with my research in AI ethics, particularly those from NIH, NSF, and private foundations. My strategy is to identify grants that support interdisciplinary research between computer science and healthcare, and I'm looking for opportunities to collaborate with medical institutions..."
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </motion.div>
              </AnimatePresence>
            </Box>
          </ScrollableContent>

          {error && (
            <Box sx={{ flexShrink: 0, mb: 2 }}>
              <Typography color="error" sx={{ textAlign: 'center', color: '#FF4C51' }}>
                {error}
              </Typography>
            </Box>
          )}

          <ButtonSection>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <StyledButton
                onClick={handleSubmit}
                disabled={!isFormComplete() || loading}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    <span>Saving...</span>
                  </Box>
                ) : (
                  isNewProfile ? 'Complete Profile' : 'Update Profile'
                )}
              </StyledButton>
            </Box>
          </ButtonSection>
        </ContentSection>
      </Box>
    </StyledDialog>
  );
};

export default ProfessorGetStartedDialog;