import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { messageAPI } from '../services/api';
import { useDropzone } from 'react-dropzone';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Avatar,
  IconButton,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

// Validation schema
const messageValidationSchema = yup.object({
  content: yup.string().required('Message content is required'),
});

const MessageBoard = () => {
  const { currentUser, hasPermission } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [sending, setSending] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editMessageId, setEditMessageId] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [dialogImage, setDialogImage] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await messageAPI.getMessages();
        setMessages(response.data);
      } catch (err) {
        setError('Failed to load messages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Dropzone configuration
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    onDrop: (acceptedFiles) => {
      setSelectedImage(acceptedFiles[0]);
      setImagePreview(URL.createObjectURL(acceptedFiles[0]));
    },
    multiple: false,
  });

  // Clear image selection
  const clearImageSelection = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  // Handle open full image dialog
  const handleOpenImageDialog = (imageUrl) => {
    setDialogImage(imageUrl);
    setImageDialogOpen(true);
  };

  // Form handling with Formik
  const formik = useFormik({
    initialValues: {
      content: '',
    },
    validationSchema: messageValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setSending(true);
        
        const formData = new FormData();
        formData.append('content', values.content);
        
        if (selectedImage) {
          formData.append('image', selectedImage);
        }
        
        if (editMode && editMessageId) {
          // Update existing message
          const response = await messageAPI.updateMessage(editMessageId, formData);
          setMessages(messages.map(message => 
            message._id === editMessageId ? response.data : message
          ));
          setEditMode(false);
          setEditMessageId(null);
        } else {
          // Create new message
          const response = await messageAPI.createMessage(formData);
          setMessages([...messages, response.data]);
        }
        
        // Clear form
        resetForm();
        clearImageSelection();
      } catch (err) {
        setError('Failed to send message. Please try again.');
      } finally {
        setSending(false);
      }
    },
  });

  // Handle message edit
  const handleEditMessage = (message) => {
    setEditMode(true);
    setEditMessageId(message._id);
    formik.setValues({
      content: message.content,
    });
    if (message.image) {
      setImagePreview(message.image);
    } else {
      clearImageSelection();
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditMessageId(null);
    formik.resetForm();
    clearImageSelection();
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    try {
      await messageAPI.deleteMessage(messageId);
      setMessages(messages.filter(message => message._id !== messageId));
      
      // If deleting the message being edited, cancel edit mode
      if (editMessageId === messageId) {
        handleCancelEdit();
      }
    } catch (err) {
      setError('Failed to delete message. Please try again.');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Family Message Board
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1">
          Share updates, photos, and messages with family members.
        </Typography>
      </Paper>
      
      <Grid container spacing={3}>
        {/* Messages Column */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              mb: 3, 
              maxHeight: { xs: '400px', md: '600px' }, 
              overflow: 'auto' 
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : messages.length === 0 ? (
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                No messages yet. Be the first to start a conversation!
              </Typography>
            ) : (
              <Box>
                {messages.map((message) => (
                  <Card 
                    key={message._id} 
                    sx={{ 
                      mb: 2,
                      bgcolor: message.author?._id === currentUser?.id ? '#e3f2fd' : 'white',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar 
                          src={message.author?.avatar}
                          alt={message.author?.name}
                          sx={{ mr: 1 }}
                        >
                          {message.author?.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" component="div">
                            {message.author?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body1" sx={{ mt: 2, mb: 2, whiteSpace: 'pre-line' }}>
                        {message.content}
                      </Typography>
                      
                      {message.image && (
                        <Box sx={{ mt: 2, mb: 1 }}>
                          <CardMedia
                            component="img"
                            image={message.image}
                            alt="Message attachment"
                            sx={{ 
                              height: 200, 
                              objectFit: 'cover', 
                              borderRadius: 1,
                              cursor: 'pointer',
                            }}
                            onClick={() => handleOpenImageDialog(message.image)}
                          />
                        </Box>
                      )}
                    </CardContent>
                    
                    {(currentUser?.id === message.author?._id || hasPermission('messages.manage')) && (
                      <CardActions sx={{ justifyContent: 'flex-end' }}>
                        <IconButton 
                          size="small"
                          onClick={() => handleEditMessage(message)}
                          disabled={editMode && editMessageId !== message._id}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => handleDeleteMessage(message._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </CardActions>
                    )}
                  </Card>
                ))}
                <div ref={messagesEndRef} />
              </Box>
            )}
          </Paper>
          
          {/* Message Input Form */}
          <Paper elevation={3} sx={{ p: 2 }}>
            <form onSubmit={formik.handleSubmit}>
              <Typography variant="subtitle1" gutterBottom>
                {editMode ? 'Edit Message' : 'Post a New Message'}
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="What's on your mind?"
                name="content"
                value={formik.values.content}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.content && Boolean(formik.errors.content)}
                helperText={formik.touched.content && formik.errors.content}
                disabled={sending}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Paper
                  {...getRootProps()}
                  sx={{
                    border: '1px dashed #ccc',
                    borderRadius: 1,
                    p: 1,
                    mr: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <input {...getInputProps()} />
                  <ImageIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Add Photo
                  </Typography>
                </Paper>
                
                {editMode && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancelEdit}
                    sx={{ mr: 1 }}
                  >
                    Cancel Edit
                  </Button>
                )}
                
                <Button
                  type="submit"
                  variant="contained"
                  endIcon={<SendIcon />}
                  disabled={sending || !formik.values.content}
                >
                  {sending ? <CircularProgress size={24} /> : (editMode ? 'Update' : 'Send')}
                </Button>
              </Box>
              
              {imagePreview && (
                <Box sx={{ position: 'relative', width: 'fit-content', mb: 2 }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: 200, 
                      borderRadius: 4,
                    }}
                  />
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                      },
                    }}
                    onClick={clearImageSelection}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </form>
          </Paper>
        </Grid>
        
        {/* Members Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Message Board Guidelines
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" paragraph>
              • Keep conversations friendly and respectful
            </Typography>
            <Typography variant="body2" paragraph>
              • Share cabin updates, family news, and photos
            </Typography>
            <Typography variant="body2" paragraph>
              • Notify everyone of maintenance needs or issues
            </Typography>
            <Typography variant="body2" paragraph>
              • Coordinate supplies and shared expenses
            </Typography>
            <Typography variant="body2" paragraph>
              • Photos should be family-friendly
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Full Image Dialog */}
      <Dialog 
        open={imageDialogOpen} 
        onClose={() => setImageDialogOpen(false)}
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 1 }}>
          <img
            src={dialogImage}
            alt="Full size"
            style={{ 
              maxWidth: '100%', 
              maxHeight: '80vh',
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageBoard;
