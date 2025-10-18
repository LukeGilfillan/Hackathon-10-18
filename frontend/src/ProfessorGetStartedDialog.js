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
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GroupIcon from '@mui/icons-material/Group';
import PublicIcon from '@mui/icons-material/Public';

const API_BASE_URL = 'http://localhost:8000/api';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '24px',
    padding: 0,
    background: theme.palette.background.paper,
    boxShadow: '0 24px 40px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    minHeight: '600px',
    maxWidth: '800px',
    width: '90%',
    [theme.breakpoints.down('sm')]: {
      borderRadius: '16px',
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
    borderRadius: '12px',
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
  borderRadius: '16px',
  padding: '12px 24px',
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
  color: theme.palette.common.white,
  boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: '12px',
    padding: '10px 20px',
    fontSize: '0.9rem',
    minHeight: '48px'
  }
}));

const StyledStepper = styled(Stepper)(({ theme }) => ({
  padding: theme.spacing(2, 0),
  backgroundColor: 'transparent',
  marginBottom: theme.spacing(3),
  '& .MuiStepLabel-root': {
    '& .MuiStepLabel-label': {
      color: theme.palette.text.secondary,
      fontSize: '0.9rem',
      fontWeight: 500,
      transition: 'all 0.3s ease-in-out',
      '&.Mui-active': {
        color: theme.palette.primary.main,
        fontWeight: 600,
      },
      '&.Mui-completed': {
        color: theme.palette.success.main,
      }
    },
    '& .MuiStepIcon-root': {
      width: 32,
      height: 32,
      color: theme.palette.grey[300],
      transition: 'all 0.3s ease-in-out',
      '&.Mui-active': {
        color: theme.palette.primary.main,
      },
      '&.Mui-completed': {
        color: theme.palette.success.main,
      }
    }
  }
}));

const WelcomeSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(4),
  background: theme.palette.background.paper,
  borderRadius: '24px 24px 0 0',
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  }
}));

const ContentSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  background: theme.palette.background.paper,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  }
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2)
}));

const ProfessorGetStartedDialog = ({ open, onClose, currentUser, onProfileComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form data
  const [profileData, setProfileData] = useState({
    name: '',
    title: '',
    department: '',
    school: '',
    university: '',
    research_areas: [],
    research_interests: '',
    current_projects: '',
    preferred_agencies: [],
    preferred_funding_types: [],
    preferred_award_ranges: { min: 50000, max: 500000 },
    travel_willingness: 'moderate',
    collaboration_style: 'any',
    max_applications_per_year: 10,
    website_url: '',
    contact_info: {
      phone: '',
      location: ''
    }
  });

  const [newResearchArea, setNewResearchArea] = useState('');
  const [newAgency, setNewAgency] = useState('');

  // Common funding agencies
  const commonAgencies = [
    'NSF', 'NIH', 'DOE', 'DOD', 'NASA', 'USDA', 'EPA', 'NOAA', 
    'NIST', 'NEH', 'NEA', 'FEMA', 'CDC', 'FDA', 'DHS'
  ];

  // Common funding types
  const fundingTypes = [
    'Research Grant', 'Equipment Grant', 'Travel Grant', 'Fellowship',
    'Training Grant', 'Infrastructure Grant', 'Collaborative Grant'
  ];

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
        research_interests: profile.research_interests || '',
        current_projects: profile.current_projects || '',
        preferred_agencies: profile.preferred_agencies || [],
        preferred_funding_types: profile.preferred_funding_types || [],
        preferred_award_ranges: profile.preferred_award_ranges || { min: 50000, max: 500000 },
        travel_willingness: profile.travel_willingness || 'moderate',
        collaboration_style: profile.collaboration_style || 'any',
        max_applications_per_year: profile.max_applications_per_year || 10,
        website_url: profile.website_url || '',
        contact_info: {
          phone: profile.contact_info?.phone || '',
          location: profile.contact_info?.location || ''
        }
      });
    } else if (currentUser?.email) {
      // Set basic info from email
      const emailName = currentUser.email.split('@')[0].replace(/[._]/g, ' ');
      setProfileData(prev => ({
        ...prev,
        name: prev.name || emailName,
        email: currentUser.email
      }));
    }
  }, [currentUser]);

  const steps = [
    { label: 'Basic Info', icon: <PersonIcon /> },
    { label: 'Institution', icon: <SchoolIcon /> },
    { label: 'Research', icon: <ScienceIcon /> },
    { label: 'Preferences', icon: <WorkIcon /> }
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactInfoChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [field]: value
      }
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

  const toggleAgency = (agency) => {
    setProfileData(prev => ({
      ...prev,
      preferred_agencies: prev.preferred_agencies.includes(agency)
        ? prev.preferred_agencies.filter(a => a !== agency)
        : [...prev.preferred_agencies, agency]
    }));
  };

  const toggleFundingType = (type) => {
    setProfileData(prev => ({
      ...prev,
      preferred_funding_types: prev.preferred_funding_types.includes(type)
        ? prev.preferred_funding_types.filter(t => t !== type)
        : [...prev.preferred_funding_types, type]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE_URL}/professors/profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${sessionToken}`
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

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  label="Full Name *"
                  fullWidth
                  required
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
                  label="Phone Number"
                  fullWidth
                  value={profileData.contact_info.phone}
                  onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  label="Location"
                  fullWidth
                  value={profileData.contact_info.location}
                  onChange={(e) => handleContactInfoChange('location', e.target.value)}
                  InputProps={{
                    startAdornment: <LocationOnIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  label="Website URL"
                  fullWidth
                  value={profileData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  placeholder="https://your-website.com"
                  InputProps={{
                    startAdornment: <PublicIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
              Institutional Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  label="Department *"
                  fullWidth
                  required
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
                  label="University/Institution *"
                  fullWidth
                  required
                  value={profileData.university}
                  onChange={(e) => handleInputChange('university', e.target.value)}
                  placeholder="e.g., University of California, Berkeley"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
              Research Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                    Research Areas *
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {profileData.research_areas.map((area, index) => (
                      <Chip
                        key={index}
                        label={area}
                        onDelete={() => removeResearchArea(area)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
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
                <StyledTextField
                  label="Research Interests"
                  multiline
                  rows={3}
                  fullWidth
                  value={profileData.research_interests}
                  onChange={(e) => handleInputChange('research_interests', e.target.value)}
                  placeholder="Describe your current research interests and focus areas..."
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  label="Current Projects"
                  multiline
                  rows={3}
                  fullWidth
                  value={profileData.current_projects}
                  onChange={(e) => handleInputChange('current_projects', e.target.value)}
                  placeholder="Describe any current research projects you're working on..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
              Grant Preferences
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                  Preferred Funding Agencies
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {commonAgencies.map((agency) => (
                    <Chip
                      key={agency}
                      label={agency}
                      onClick={() => toggleAgency(agency)}
                      color={profileData.preferred_agencies.includes(agency) ? 'primary' : 'default'}
                      variant={profileData.preferred_agencies.includes(agency) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                  Preferred Funding Types
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {fundingTypes.map((type) => (
                    <Chip
                      key={type}
                      label={type}
                      onClick={() => toggleFundingType(type)}
                      color={profileData.preferred_funding_types.includes(type) ? 'secondary' : 'default'}
                      variant={profileData.preferred_funding_types.includes(type) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Travel Willingness</InputLabel>
                  <Select
                    value={profileData.travel_willingness}
                    onChange={(e) => handleInputChange('travel_willingness', e.target.value)}
                    label="Travel Willingness"
                  >
                    <MenuItem value="none">No travel required</MenuItem>
                    <MenuItem value="minimal">Minimal travel</MenuItem>
                    <MenuItem value="moderate">Moderate travel</MenuItem>
                    <MenuItem value="extensive">Extensive travel</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Collaboration Style</InputLabel>
                  <Select
                    value={profileData.collaboration_style}
                    onChange={(e) => handleInputChange('collaboration_style', e.target.value)}
                    label="Collaboration Style"
                  >
                    <MenuItem value="solo">Solo research</MenuItem>
                    <MenuItem value="small_team">Small team (2-5 people)</MenuItem>
                    <MenuItem value="large_team">Large team (5+ people)</MenuItem>
                    <MenuItem value="any">Any team size</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  label="Max Applications Per Year"
                  type="number"
                  fullWidth
                  value={profileData.max_applications_per_year}
                  onChange={(e) => handleInputChange('max_applications_per_year', parseInt(e.target.value) || 10)}
                  inputProps={{ min: 1, max: 50 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  label="Min Award Amount ($)"
                  type="number"
                  fullWidth
                  value={profileData.preferred_award_ranges.min}
                  onChange={(e) => handleInputChange('preferred_award_ranges', {
                    ...profileData.preferred_award_ranges,
                    min: parseInt(e.target.value) || 0
                  })}
                />
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return profileData.name.trim() !== '';
      case 1:
        return profileData.department.trim() !== '' && profileData.university.trim() !== '';
      case 2:
        return profileData.research_areas.length > 0;
      case 3:
        return true; // Preferences are optional
      default:
        return false;
    }
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
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" sx={{ mb: 2, color: 'success.main', fontWeight: 600 }}>
              Profile Complete!
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Your professor profile has been successfully created. You can now receive personalized grant recommendations.
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
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            zIndex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>

        <WelcomeSection>
          <IconWrapper>
            <SchoolIcon sx={{ fontSize: 32 }} />
          </IconWrapper>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
            Complete Your Professor Profile
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: '600px' }}>
            Help us understand your research interests and preferences so we can provide you with the most relevant grant opportunities.
          </Typography>
        </WelcomeSection>

        <ContentSection>
          <StyledStepper activeStep={activeStep} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconComponent={({ active, completed }) => (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: completed
                          ? 'success.main'
                          : active
                          ? 'primary.main'
                          : 'grey.300',
                        color: 'white',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {completed ? <CheckCircleIcon /> : step.icon}
                    </Box>
                  )}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </StyledStepper>

          <Box sx={{ minHeight: '400px', mb: 3 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </Box>

          {error && (
            <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
              {error}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
              sx={{ borderRadius: '12px' }}
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeStep === steps.length - 1 ? (
                <StyledButton
                  onClick={handleSubmit}
                  disabled={!isStepValid() || loading}
                  sx={{ borderRadius: '12px' }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      <span>Saving...</span>
                    </Box>
                  ) : (
                    'Complete Profile'
                  )}
                </StyledButton>
              ) : (
                <StyledButton
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  sx={{ borderRadius: '12px' }}
                >
                  Next
                </StyledButton>
              )}
            </Box>
          </Box>
        </ContentSection>
      </Box>
    </StyledDialog>
  );
};

export default ProfessorGetStartedDialog;
