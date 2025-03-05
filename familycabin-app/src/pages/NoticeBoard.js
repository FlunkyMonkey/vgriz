import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { noticeAPI } from '../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Stack,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonOutline as PersonIcon,
  AccessTime as TimeIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

// Validation schema
const noticeValidationSchema = yup.object({
  title: yup.string().required('Title is required'),
  content: yup.string().required('Content is required'),
  priority: yup.string().oneOf(['low', 'medium', 'high']).required('Priority is required'),
});

const NoticeBoard = () => {
  const { currentUser, hasPermission } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'low', 'medium', 'high'

  // Fetch notices
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const response = await noticeAPI.getNotices();
        setNotices(response.data);
      } catch (err) {
        setError('Failed to load notices. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  // Handle opening dialog for creating a new notice
  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setSelectedNotice(null);
    
    // Reset form
    formik.resetForm();
    formik.setValues({
      title: '',
      content: '',
      priority: 'medium',
    });
    
    setOpenDialog(true);
  };

  // Handle opening dialog for editing a notice
  const handleOpenEditDialog = (notice) => {
    setDialogMode('edit');
    setSelectedNotice(notice);
    
    // Set form values
    formik.resetForm();
    formik.setValues({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
    });
    
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Form handling with Formik
  const formik = useFormik({
    initialValues: {
      title: '',
      content: '',
      priority: 'medium',
    },
    validationSchema: noticeValidationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitLoading(true);
        
        if (dialogMode === 'create') {
          // Create new notice
          const response = await noticeAPI.createNotice(values);
          setNotices([response.data, ...notices]);
        } else if (dialogMode === 'edit' && selectedNotice) {
          // Update existing notice
          const response = await noticeAPI.updateNotice(selectedNotice._id, values);
          setNotices(notices.map(notice => 
            notice._id === selectedNotice._id ? response.data : notice
          ));
        }
        
        setOpenDialog(false);
      } catch (err) {
        setError(dialogMode === 'create' 
          ? 'Failed to create notice. Please try again.' 
          : 'Failed to update notice. Please try again.');
      } finally {
        setSubmitLoading(false);
      }
    },
  });

  // Handle notice deletion
  const handleDeleteNotice = async (notice) => {
    if (!hasPermission('notices.delete')) return;
    
    try {
      await noticeAPI.deleteNotice(notice._id);
      setNotices(notices.filter(n => n._id !== notice._id));
    } catch (err) {
      setError('Failed to delete notice. Please try again.');
    }
  };

  // Handle filter change
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  // Filter notices based on priority
  const filteredNotices = filter === 'all' 
    ? notices 
    : notices.filter(notice => notice.priority === filter);

  // Get priority chip color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Notice Board
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">
            Important announcements and notices for all family members.
          </Typography>
          
          {hasPermission('notices.create') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              New Notice
            </Button>
          )}
        </Box>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="priority-filter-label">Filter by Priority</InputLabel>
            <Select
              labelId="priority-filter-label"
              id="priority-filter"
              value={filter}
              label="Filter by Priority"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Notices</MenuItem>
              <MenuItem value="high">High Priority</MenuItem>
              <MenuItem value="medium">Medium Priority</MenuItem>
              <MenuItem value="low">Low Priority</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredNotices.length === 0 ? (
          <Typography variant="body1" align="center" sx={{ py: 4 }}>
            No notices found.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredNotices.map((notice) => (
              <Grid item xs={12} key={notice._id}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    borderLeft: `5px solid ${
                      notice.priority === 'high' ? '#f44336' :
                      notice.priority === 'medium' ? '#ff9800' : '#4caf50'
                    }` 
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6">{notice.title}</Typography>
                      <Chip 
                        icon={<FlagIcon />}
                        label={notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)}
                        color={getPriorityColor(notice.priority)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body1" paragraph>
                      {notice.content}
                    </Typography>
                    
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Chip 
                        icon={<PersonIcon />}
                        label={`Posted by ${notice.author?.name || 'Unknown'}`}
                        variant="outlined"
                        size="small"
                      />
                      <Chip 
                        icon={<TimeIcon />}
                        label={format(new Date(notice.createdAt), 'MMM d, yyyy')}
                        variant="outlined"
                        size="small"
                      />
                    </Stack>
                  </CardContent>
                  
                  {(currentUser?.id === notice.author?._id || hasPermission('notices.edit')) && (
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenEditDialog(notice)}
                        aria-label="edit"
                      >
                        <EditIcon />
                      </IconButton>
                      
                      {hasPermission('notices.delete') && (
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => handleDeleteNotice(notice)}
                          aria-label="delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      {/* Notice Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Notice' : 'Edit Notice'}
        </DialogTitle>
        
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Stack spacing={3}>
              <TextField
                label="Title"
                name="title"
                fullWidth
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
                disabled={submitLoading}
                required
              />
              
              <FormControl fullWidth>
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  name="priority"
                  value={formik.values.priority}
                  label="Priority"
                  onChange={formik.handleChange}
                  disabled={submitLoading}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Content"
                name="content"
                fullWidth
                multiline
                rows={6}
                value={formik.values.content}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.content && Boolean(formik.errors.content)}
                helperText={formik.touched.content && formik.errors.content}
                disabled={submitLoading}
                required
              />
            </Stack>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={submitLoading}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={submitLoading}
            >
              {submitLoading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default NoticeBoard;
