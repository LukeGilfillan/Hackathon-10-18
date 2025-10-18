import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ForumIcon from '@mui/icons-material/Forum';
import AddIcon from '@mui/icons-material/Add';
import MessageIcon from '@mui/icons-material/Message';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ReplyIcon from '@mui/icons-material/Reply';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const API_BASE_URL = 'http://localhost:8000/api';

// Simple date formatting function
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

// Styled components matching App.js design system

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '25px',
  padding: '12px 24px',
  minWidth: '120px',
  height: '48px',
  background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
  color: 'white',
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #c82333 0%, #dc3545 100%)',
    boxShadow: '0 6px 20px rgba(220, 53, 69, 0.4)',
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    background: 'linear-gradient(135deg, rgba(108, 117, 125, 0.7) 0%, rgba(73, 80, 87, 0.7) 100%)',
    color: 'rgba(255, 255, 255, 0.7)',
    boxShadow: 'none',
    transform: 'none',
  },
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  borderRadius: '25px',
  padding: '10px 20px',
  border: '2px solid #dc3545',
  background: 'transparent',
  color: '#dc3545',
  fontSize: '0.9rem',
  fontWeight: '600',
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: '#dc3545',
    color: 'white',
    transform: 'translateY(-1px)',
  },
}));

// Inline styles matching App.js
const styles = {
  forumContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    border: '1px solid #e9ecef',
  },
  forumTitle: {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '20px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    background: 'linear-gradient(135deg, #212529 0%, #495057 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textAlign: 'center',
  },
  breadcrumbContainer: {
    marginBottom: '30px',
    padding: '15px 20px',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    borderRadius: '15px',
    border: '1px solid #e9ecef',
  },
  forumGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '25px',
    marginBottom: '40px',
  },
  topicCard: {
    background: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    transition: 'all 0.3s ease',
    border: '1px solid #e9ecef',
    marginBottom: '20px',
  },
  topicTitle: {
    color: '#212529',
    marginBottom: '15px',
    fontSize: '1.3rem',
    lineHeight: 1.4,
    fontWeight: '600',
  },
  topicMeta: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  metaTag: {
    background: '#f8f9fa',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  agencyTag: {
    background: 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)',
    color: '#495057',
  },
  closeDateTag: {
    background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
    color: '#721c24',
  },
  topicDescription: {
    color: '#6c757d',
    lineHeight: 1.6,
    marginBottom: '15px',
  },
  postCard: {
    background: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    transition: 'all 0.3s ease',
    border: '1px solid #e9ecef',
    marginBottom: '20px',
  },
  postContent: {
    color: '#6c757d',
    lineHeight: 1.6,
    marginBottom: '15px',
  },
  errorMessage: {
    maxWidth: '1200px',
    margin: '0 auto 20px',
    background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
    color: '#721c24',
    padding: '15px 20px',
    borderRadius: '10px',
    border: '1px solid #f5c6cb',
    textAlign: 'center',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
    borderRadius: '20px',
    border: '1px solid #e9ecef',
  },
  emptyState: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: '1.2rem',
    margin: '40px 0',
    padding: '40px',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    borderRadius: '15px',
    border: '1px solid #e9ecef',
  },
};

const Forum = () => {
  const [forums, setForums] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedForum, setSelectedForum] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentView, setCurrentView] = useState('forums'); // 'forums', 'topics', 'topic'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Dialog states
  const [newTopicDialog, setNewTopicDialog] = useState(false);
  const [newPostDialog, setNewPostDialog] = useState(false);
  
  // Form states
  const [newTopicForm, setNewTopicForm] = useState({
    title: '',
    content: '',
    is_anonymous: false
  });
  const [newPostForm, setNewPostForm] = useState({
    content: '',
    is_anonymous: false
  });
  

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/forums/`);
      if (!response.ok) throw new Error('Failed to fetch forums');
      
      const data = await response.json();
      setForums(data.forums || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (forumSlug) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/forums/${forumSlug}/topics/`);
      if (!response.ok) throw new Error('Failed to fetch topics');
      
      const data = await response.json();
      setTopics(data.topics || []);
      setSelectedForum(data.forum);
      setCurrentView('topics');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicDetails = async (topicId) => {
    setLoading(true);
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE_URL}/topics/${topicId}/?session_token=${sessionToken}`);
      if (!response.ok) throw new Error('Failed to fetch topic details');
      
      const data = await response.json();
      setSelectedTopic(data);
      setCurrentView('topic');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTopic = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE_URL}/topics/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTopicForm,
          forum_slug: selectedForum.slug,
          session_token: sessionToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create topic');
      }

      setSnackbar({
        open: true,
        message: 'Topic created successfully!',
        severity: 'success'
      });
      
      setNewTopicDialog(false);
      setNewTopicForm({ title: '', content: '', is_anonymous: false });
      fetchTopics(selectedForum.slug);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  const createPost = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE_URL}/posts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPostForm,
          topic_id: selectedTopic.id,
          session_token: sessionToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      setSnackbar({
        open: true,
        message: 'Post created successfully!',
        severity: 'success'
      });
      
      setNewPostDialog(false);
      setNewPostForm({ content: '', is_anonymous: false });
      fetchTopicDetails(selectedTopic.id);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  const handleForumSelect = (forum) => {
    fetchTopics(forum.slug);
  };

  const handleTopicSelect = (topic) => {
    fetchTopicDetails(topic.id);
  };

  const handleBackToForums = () => {
    setCurrentView('forums');
    setSelectedForum(null);
    setSelectedTopic(null);
  };


  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderBreadcrumbs = () => {
    const breadcrumbs = [
      <button
        key="forums"
        onClick={handleBackToForums}
        style={{
          background: 'none',
          border: 'none',
          color: '#dc3545',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 10px',
          borderRadius: '15px',
          transition: 'all 0.3s ease',
        }}
        onMouseOver={(e) => {
          e.target.style.background = 'rgba(220, 53, 69, 0.1)';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'none';
        }}
      >
        <HomeIcon fontSize="small" />
        Forums
      </button>
    ];

    if (selectedForum) {
      breadcrumbs.push(
        <button
          key="forum"
          onClick={currentView === 'topic' ? () => setCurrentView('topics') : undefined}
          style={{
            background: 'none',
            border: 'none',
            color: '#dc3545',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '15px',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(220, 53, 69, 0.1)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'none';
          }}
        >
          <ForumIcon fontSize="small" />
          {selectedForum.name}
        </button>
      );
    }

    if (selectedTopic) {
      breadcrumbs.push(
        <span
          key="topic"
          style={{
            color: '#212529',
            fontSize: '1rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
          }}
        >
          <MessageIcon fontSize="small" />
          {selectedTopic.title}
        </span>
      );
    }

    return (
      <div style={styles.breadcrumbContainer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={index}>
              {breadcrumb}
              {index < breadcrumbs.length - 1 && (
                <NavigateNextIcon fontSize="small" style={{ color: '#6c757d' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderForumsList = () => (
    <div style={styles.forumGrid}>
      {forums.map((forum) => (
        <div key={forum.id} style={styles.topicCard}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <ForumIcon style={{ color: '#dc3545', marginRight: '10px', fontSize: '1.5rem' }} />
            <div style={styles.topicTitle}>
              {forum.name}
            </div>
          </div>
          
          <div style={styles.topicDescription}>
            {forum.description || 'No description available'}
          </div>
          
          <div style={styles.topicMeta}>
            <div style={{...styles.metaTag, ...styles.agencyTag}}>
              {forum.topic_count} topics
            </div>
            {forum.latest_topic && (
              <div style={{...styles.metaTag, ...styles.closeDateTag}}>
                Latest: {formatTimeAgo(forum.latest_topic.last_activity)}
              </div>
            )}
          </div>
          
          <StyledButton
            fullWidth
            onClick={() => handleForumSelect(forum)}
            startIcon={<MessageIcon />}
          >
            View Topics
          </StyledButton>
        </div>
      ))}
    </div>
  );

  const renderTopicsList = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <div style={{ fontSize: '1.8rem', fontWeight: '600', color: '#212529', marginBottom: '10px' }}>
            {selectedForum?.name}
          </div>
          <div style={{ color: '#6c757d', fontSize: '1rem' }}>
            {selectedForum?.description}
          </div>
        </div>
        <StyledButton
          startIcon={<AddIcon />}
          onClick={() => setNewTopicDialog(true)}
        >
          New Topic
        </StyledButton>
      </div>
      
      {topics.length > 0 ? (
        <div>
          {topics.map((topic, index) => (
            <div key={topic.id} style={styles.topicCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flexGrow: 1 }}>
                  <div
                    style={{
                      ...styles.topicTitle,
                      cursor: 'pointer',
                      color: '#212529',
                    }}
                    onClick={() => handleTopicSelect(topic)}
                    onMouseOver={(e) => {
                      e.target.style.color = '#dc3545';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = '#212529';
                    }}
                  >
                    {topic.title}
                    {topic.is_pinned && (
                      <span style={{...styles.metaTag, ...styles.closeDateTag, marginLeft: '10px'}}>
                        Pinned
                      </span>
                    )}
                  </div>
                  
                  <div style={{ color: '#6c757d', marginBottom: '15px' }}>
                    by {topic.author_name} • {formatTimeAgo(topic.created_at)}
                  </div>
                  
                  <div style={styles.topicMeta}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <VisibilityIcon fontSize="small" style={{ color: '#6c757d' }} />
                      <span style={{...styles.metaTag, ...styles.agencyTag}}>
                        {topic.view_count} views
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <ReplyIcon fontSize="small" style={{ color: '#6c757d' }} />
                      <span style={{...styles.metaTag, ...styles.agencyTag}}>
                        {topic.reply_count} replies
                      </span>
                    </div>
                    {topic.last_post_author && (
                      <span style={{...styles.metaTag, ...styles.closeDateTag}}>
                        Last reply by {topic.last_post_author} • {formatTimeAgo(topic.last_activity)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <MessageIcon style={{ fontSize: '64px', color: '#6c757d', marginBottom: '20px' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '10px', color: '#212529' }}>
            No Topics Yet
          </div>
          <div style={{ color: '#6c757d' }}>
            Be the first to start a discussion in this forum!
          </div>
        </div>
      )}
    </div>
  );

  const renderTopicDetails = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <div style={{ fontSize: '1.8rem', fontWeight: '600', color: '#212529', marginBottom: '10px' }}>
            {selectedTopic?.title}
          </div>
          <div style={{ color: '#6c757d', fontSize: '1rem' }}>
            by {selectedTopic?.author_name} • {formatTimeAgo(selectedTopic?.created_at)}
          </div>
        </div>
        <StyledButton
          startIcon={<ReplyIcon />}
          onClick={() => setNewPostDialog(true)}
        >
          Reply
        </StyledButton>
      </div>
      
      <div style={styles.postCard}>
        <div style={styles.postContent}>
          {selectedTopic?.content}
        </div>
        <div style={styles.topicMeta}>
          <div style={{...styles.metaTag, ...styles.agencyTag}}>
            {selectedTopic?.view_count} views
          </div>
          <div style={{...styles.metaTag, ...styles.agencyTag}}>
            {selectedTopic?.reply_count} replies
          </div>
        </div>
      </div>
      
      <div style={{ fontSize: '1.3rem', fontWeight: '600', color: '#212529', marginBottom: '20px' }}>
        Replies ({selectedTopic?.posts?.length || 0})
      </div>
      
      {selectedTopic?.posts && selectedTopic.posts.length > 0 ? (
        <div>
          {selectedTopic.posts.map((post, index) => (
            <div key={post.id} style={styles.postCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {post.author_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontWeight: '600', color: '#212529' }}>
                      {post.author_name}
                    </div>
                    <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                      {formatTimeAgo(post.created_at)}
                    </div>
                  </div>
                  <div style={styles.postContent}>
                    {post.content}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6c757d',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 10px',
                        borderRadius: '15px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = 'rgba(220, 53, 69, 0.1)';
                        e.target.style.color = '#dc3545';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'none';
                        e.target.style.color = '#6c757d';
                      }}
                    >
                      <ThumbUpIcon fontSize="small" />
                      {post.like_count} likes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={{ color: '#6c757d' }}>
            No replies yet. Be the first to reply!
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (loading && currentView === 'forums') {
      return (
        <div style={styles.loadingContainer}>
          <CircularProgress size={60} style={{ color: '#dc3545' }} />
        </div>
      );
    }

    switch (currentView) {
      case 'forums':
        return renderForumsList();
      case 'topics':
        return renderTopicsList();
      case 'topic':
        return renderTopicDetails();
      default:
        return renderForumsList();
    }
  };

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)', minHeight: '100vh' }}>
      <div style={styles.forumContainer}>
        <div style={styles.forumTitle}>
          💬 Research Forum
        </div>
        
        {error && (
          <div style={styles.errorMessage}>
            ❌ {error}
          </div>
        )}

        {renderBreadcrumbs()}
        {renderContent()}
      </div>

      {/* New Topic Dialog */}
      <Dialog open={newTopicDialog} onClose={() => setNewTopicDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Topic</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Topic Title"
              value={newTopicForm.title}
              onChange={(e) => setNewTopicForm({ ...newTopicForm, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Content"
              value={newTopicForm.content}
              onChange={(e) => setNewTopicForm({ ...newTopicForm, content: e.target.value })}
              margin="normal"
              multiline
              rows={6}
              required
            />
            <Box sx={{ mt: 2 }}>
              <FormControl component="fieldset">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="checkbox"
                    checked={newTopicForm.is_anonymous}
                    onChange={(e) => setNewTopicForm({ ...newTopicForm, is_anonymous: e.target.checked })}
                  />
                  <Typography variant="body2">Post anonymously</Typography>
                </Box>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <SecondaryButton onClick={() => setNewTopicDialog(false)}>Cancel</SecondaryButton>
          <StyledButton
            onClick={createTopic}
            disabled={!newTopicForm.title || !newTopicForm.content}
          >
            Create Topic
          </StyledButton>
        </DialogActions>
      </Dialog>

      {/* New Post Dialog */}
      <Dialog open={newPostDialog} onClose={() => setNewPostDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Reply to Topic</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Your Reply"
              value={newPostForm.content}
              onChange={(e) => setNewPostForm({ ...newPostForm, content: e.target.value })}
              margin="normal"
              multiline
              rows={4}
              required
            />
            <Box sx={{ mt: 2 }}>
              <FormControl component="fieldset">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="checkbox"
                    checked={newPostForm.is_anonymous}
                    onChange={(e) => setNewPostForm({ ...newPostForm, is_anonymous: e.target.checked })}
                  />
                  <Typography variant="body2">Post anonymously</Typography>
                </Box>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <SecondaryButton onClick={() => setNewPostDialog(false)}>Cancel</SecondaryButton>
          <StyledButton
            onClick={createPost}
            disabled={!newPostForm.content}
          >
            Post Reply
          </StyledButton>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Forum;
