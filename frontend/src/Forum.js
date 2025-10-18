import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  FormControl,
  useTheme,
  Breadcrumbs,
  Link
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import ForumIcon from '@mui/icons-material/Forum';
import AddIcon from '@mui/icons-material/Add';
import MessageIcon from '@mui/icons-material/Message';
import PersonIcon from '@mui/icons-material/Person';
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

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const ForumCard = styled(Card)(({ theme }) => ({
  marginBottom: '16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

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
  
  const theme = useTheme();

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

  const handleBackToTopics = () => {
    setCurrentView('topics');
    setSelectedTopic(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderBreadcrumbs = () => {
    const breadcrumbs = [
      <Link
        key="forums"
        color="inherit"
        href="#"
        onClick={handleBackToForums}
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        Forums
      </Link>
    ];

    if (selectedForum) {
      breadcrumbs.push(
        <Link
          key="forum"
          color="inherit"
          href="#"
          onClick={currentView === 'topic' ? () => setCurrentView('topics') : undefined}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ForumIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {selectedForum.name}
        </Link>
      );
    }

    if (selectedTopic) {
      breadcrumbs.push(
        <Typography key="topic" color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <MessageIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {selectedTopic.title}
        </Typography>
      );
    }

    return (
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        {breadcrumbs}
      </Breadcrumbs>
    );
  };

  const renderForumsList = () => (
    <Grid container spacing={3}>
      {forums.map((forum) => (
        <Grid item xs={12} md={6} lg={4} key={forum.id}>
          <StyledCard elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ForumIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  {forum.name}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                {forum.description || 'No description available'}
              </Typography>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Chip
                  label={`${forum.topic_count} topics`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {forum.latest_topic && (
                  <Typography variant="caption" color="textSecondary">
                    Latest: {formatTimeAgo(forum.latest_topic.last_activity)}
                  </Typography>
                )}
              </Box>
              
              <Button
                variant="contained"
                fullWidth
                onClick={() => handleForumSelect(forum)}
                startIcon={<MessageIcon />}
              >
                View Topics
              </Button>
            </CardContent>
          </StyledCard>
        </Grid>
      ))}
    </Grid>
  );

  const renderTopicsList = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            {selectedForum?.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {selectedForum?.description}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewTopicDialog(true)}
        >
          New Topic
        </Button>
      </Box>
      
      {topics.length > 0 ? (
        <List>
          {topics.map((topic, index) => (
            <React.Fragment key={topic.id}>
              <ForumCard>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flexGrow={1}>
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { color: theme.palette.primary.main }
                        }}
                        onClick={() => handleTopicSelect(topic)}
                      >
                        {topic.title}
                        {topic.is_pinned && (
                          <Chip
                            label="Pinned"
                            size="small"
                            color="warning"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary" paragraph>
                        by {topic.author_name} • {formatTimeAgo(topic.created_at)}
                      </Typography>
                      
                      <Box display="flex" gap={2} alignItems="center">
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <VisibilityIcon fontSize="small" color="action" />
                          <Typography variant="caption">{topic.view_count}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <ReplyIcon fontSize="small" color="action" />
                          <Typography variant="caption">{topic.reply_count}</Typography>
                        </Box>
                        {topic.last_post_author && (
                          <Typography variant="caption" color="textSecondary">
                            Last reply by {topic.last_post_author} • {formatTimeAgo(topic.last_activity)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </ForumCard>
              {index < topics.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box p={4} textAlign="center">
          <MessageIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No Topics Yet
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Be the first to start a discussion in this forum!
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderTopicDetails = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            {selectedTopic?.title}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            by {selectedTopic?.author_name} • {formatTimeAgo(selectedTopic?.created_at)}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<ReplyIcon />}
          onClick={() => setNewPostDialog(true)}
        >
          Reply
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          {selectedTopic?.content}
        </Typography>
        <Box display="flex" gap={1}>
          <Chip label={`${selectedTopic?.view_count} views`} size="small" />
          <Chip label={`${selectedTopic?.reply_count} replies`} size="small" />
        </Box>
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        Replies ({selectedTopic?.posts?.length || 0})
      </Typography>
      
      {selectedTopic?.posts && selectedTopic.posts.length > 0 ? (
        <List>
          {selectedTopic.posts.map((post, index) => (
            <React.Fragment key={post.id}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2">
                        {post.author_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatTimeAgo(post.created_at)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" paragraph>
                        {post.content}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <IconButton size="small">
                          <ThumbUpIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="caption">
                          {post.like_count} likes
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < selectedTopic.posts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box p={2} textAlign="center">
          <Typography variant="body2" color="textSecondary">
            No replies yet. Be the first to reply!
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderContent = () => {
    if (loading && currentView === 'forums') {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Research Forum
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {renderBreadcrumbs()}
      {renderContent()}

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
          <Button onClick={() => setNewTopicDialog(false)}>Cancel</Button>
          <Button
            onClick={createTopic}
            variant="contained"
            disabled={!newTopicForm.title || !newTopicForm.content}
          >
            Create Topic
          </Button>
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
          <Button onClick={() => setNewPostDialog(false)}>Cancel</Button>
          <Button
            onClick={createPost}
            variant="contained"
            disabled={!newPostForm.content}
          >
            Post Reply
          </Button>
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
    </Box>
  );
};

export default Forum;
