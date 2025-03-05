import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { guestBookAPI } from '../services/api';
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
  CardActions,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Rating,
  Chip,
  Container,
  InputAdornment,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Star as StarIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

// Validation schemas
const guestEntryValidationSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  message: yup.string().required('Message is required'),
  rating: yup.number().min(1, 'Rating is required').max(5).required('Rating is required'),
  visitDate: yup.date().required('Visit date is required'),
});

const guestPinValidationSchema = yup.object({
  pinCode: yup.string().required('PIN code is required').length(4, 'PIN must be 4 digits'),
});

const GuestBook = ({ mode = 'owner' }) => {
  const { currentUser, hasPermission } = useAuth();
  const { pinCode } = useParams();
  const navigate = useNavigate();
  
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(mode === 'guest' && !pinVerified);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editEntryId, setEditEntryId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [guestPin, setGuestPin] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  // Fetch guest book entries
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        if (mode === 'owner' || pinVerified) {
          setLoading(true);
          const response = await guestBookAPI.getEntries();
          setEntries(response.data);
        }
      } catch (err) {
        setError('Failed to load guest book entries. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Verify PIN code from URL if in guest mode
    const verifyPinFromUrl = async () => {
      if (mode === 'guest' && pinCode) {
        try {
          setLoading(true);
          await guestBookAPI.verifyPin(pinCode);
          setPinVerified(true);
          setPinDialogOpen(false);
        } catch (err) {
          setError('Invalid PIN code. Please try again.');
          navigate('/');
        } finally {
          setLoading(false);
        }
      }
    };

    // Get guest PIN for sharing if in owner mode
    const getGuestPin = async () => {
      if (mode === 'owner') {
        try {
          const response = await guestBookAPI.getPin();
          setGuestPin(response.data.pin);
        } catch (err) {
          console.error('Failed to load guest PIN');
        }
      }
    };

    if (mode === 'guest' && pinCode) {
      verifyPinFromUrl();
    }

    if (mode === 'owner' || pinVerified) {
      fetchEntries();
    }

    if (mode === 'owner') {
      getGuestPin();
    }
  }, [mode, pinCode, pinVerified, navigate]);

  // Form handling for PIN verification
  const pinFormik = useFormik({
    initialValues: {
      pinCode: '',
    },
    validationSchema: guestPinValidationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitLoading(true);
        await guestBookAPI.verifyPin(values.pinCode);
        setPinVerified(true);
        setPinDialogOpen(false);
        navigate(`/guest/${values.pinCode}`);
      } catch (err) {
        setError('Invalid PIN code. Please try again.');
      } finally {
        setSubmitLoading(false);
      }
    },
  });

  // Form handling for guest entry
  const entryFormik = useFormik({
    initialValues: {
      name: '',
      email: '',
      message: '',
      rating: 5,
      visitDate: format(new Date(), 'yyyy-MM-dd'),
    },
    validationSchema: guestEntryValidationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitLoading(true);
        
        if (editMode && editEntryId) {
          // Update entry
          const response = await guestBookAPI.updateEntry(editEntryId, values);
          setEntries(entries.map(entry => 
            entry._id === editEntryId ? response.data : entry
          ));
        } else if (mode === 'guest' && pinVerified) {
          // Create guest entry with PIN
          const response = await guestBookAPI.createGuestEntry(pinCode, values);
          setEntries([...entries, response.data]);
        } else {
          // Create entry as owner
          const response = await guestBookAPI.createEntry(values);
          setEntries([...entries, response.data]);
        }
        
        setEntryDialogOpen(false);
        setEditMode(false);
        setEditEntryId(null);
      } catch (err) {
        setError('Failed to save entry. Please try again.');
      } finally {
        setSubmitLoading(false);
      }
    },
  });

  // Handle opening the entry dialog
  const handleOpenEntryDialog = () => {
    setEditMode(false);
    setEditEntryId(null);
    
    entryFormik.resetForm();
    entryFormik.setValues({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      message: '',
      rating: 5,
      visitDate: format(new Date(), 'yyyy-MM-dd'),
    });
    
    setEntryDialogOpen(true);
  };

  // Handle opening the edit dialog
  const handleOpenEditDialog = (entry) => {
    setEditMode(true);
    setEditEntryId(entry._id);
    
    entryFormik.resetForm();
    entryFormik.setValues({
      name: entry.name,
      email: entry.email,
      message: entry.message,
      rating: entry.rating,
      visitDate: format(new Date(entry.visitDate), 'yyyy-MM-dd'),
    });
    
    setEntryDialogOpen(true);
  };

  // Handle entry deletion
  const handleDeleteEntry = async (entryId) => {
    try {
      await guestBookAPI.deleteEntry(entryId);
      setEntries(entries.filter(entry => entry._id !== entryId));
    } catch (err) {
      setError('Failed to delete entry. Please try again.');
    }
  };

  // Handle copying guest link
  const handleCopyGuestLink = () => {
    const guestLink = `${window.location.origin}/guest/${guestPin}`;
    navigator.clipboard.writeText(guestLink)
      .then(() => {
        setCopySuccess('Link copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 3000);
      })
      .catch(() => {
        setCopySuccess('Failed to copy link');
      });
  };

  return (
    <Container maxWidth="lg">
      <Box>
        <Typography variant="h4" gutterBottom>
          {mode === 'guest' ? 'Cabin Guest Book' : 'Family Guest Book'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {copySuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>{copySuccess}</Alert>
        )}
        
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1">
              {mode === 'guest' 
                ? 'Share your experience and memories of your stay at our cabin!'
                : 'View and manage guest book entries from cabin visitors.'}
            </Typography>
            
            {mode === 'owner' ? (
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={() => setShareDialogOpen(true)}
                  sx={{ mr: 1 }}
                >
                  Share Guest Link
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenEntryDialog}
                >
                  Add Entry
                </Button>
              </Box>
            ) : pinVerified && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenEntryDialog}
              >
                Sign Guest Book
              </Button>
            )}
          </Box>
        </Paper>
        
        {/* Entries Display */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : !pinVerified && mode === 'guest' ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LockIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              PIN Required
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please enter the PIN to access the guest book.
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => setPinDialogOpen(true)}
            >
              Enter PIN
            </Button>
          </Box>
        ) : entries.length === 0 ? (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No Entries Yet
            </Typography>
            <Typography variant="body1" paragraph>
              Be the first to sign our guest book!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenEntryDialog}
            >
              {mode === 'guest' ? 'Sign Guest Book' : 'Add Entry'}
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {entries.map((entry) => (
              <Grid item xs={12} md={6} key={entry._id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6">{entry.name}</Typography>
                      <Rating value={entry.rating} readOnly precision={0.5} />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Visited on: {format(new Date(entry.visitDate), 'MMM d, yyyy')}
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                      {entry.message}
                    </Typography>
                    
                    {entry.approved ? (
                      <Chip 
                        icon={<LockOpenIcon />}
                        label="Approved"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip 
                        icon={<LockIcon />}
                        label="Pending Approval"
                        color="warning"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </CardContent>
                  
                  {mode === 'owner' && (
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                      {!entry.approved && (
                        <Button 
                          size="small" 
                          color="success"
                          onClick={() => handleApproveEntry(entry._id)}
                        >
                          Approve
                        </Button>
                      )}
                      
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenEditDialog(entry)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton 
                        size="small"
                        color="error"
                        onClick={() => handleDeleteEntry(entry._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
      {/* PIN Verification Dialog */}
      <Dialog open={pinDialogOpen} onClose={() => mode !== 'guest' && setPinDialogOpen(false)}>
        <DialogTitle>Enter Guest Book PIN</DialogTitle>
        
        <form onSubmit={pinFormik.handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="PIN Code"
              name="pinCode"
              type="password"
              inputProps={{ maxLength: 4 }}
              value={pinFormik.values.pinCode}
              onChange={pinFormik.handleChange}
              onBlur={pinFormik.handleBlur}
              error={pinFormik.touched.pinCode && Boolean(pinFormik.errors.pinCode)}
              helperText={pinFormik.touched.pinCode && pinFormik.errors.pinCode}
              disabled={submitLoading}
              sx={{ mt: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          
          <DialogActions>
            {mode !== 'guest' && (
              <Button onClick={() => setPinDialogOpen(false)}>
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              variant="contained" 
              disabled={submitLoading || !pinFormik.values.pinCode}
            >
              {submitLoading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Entry Dialog */}
      <Dialog open={entryDialogOpen} onClose={() => setEntryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Guest Book Entry' : 'Sign the Guest Book'}
        </DialogTitle>
        
        <form onSubmit={entryFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={entryFormik.values.name}
                  onChange={entryFormik.handleChange}
                  onBlur={entryFormik.handleBlur}
                  error={entryFormik.touched.name && Boolean(entryFormik.errors.name)}
                  helperText={entryFormik.touched.name && entryFormik.errors.name}
                  disabled={submitLoading}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={entryFormik.values.email}
                  onChange={entryFormik.handleChange}
                  onBlur={entryFormik.handleBlur}
                  error={entryFormik.touched.email && Boolean(entryFormik.errors.email)}
                  helperText={entryFormik.touched.email && entryFormik.errors.email}
                  disabled={submitLoading}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Visit Date"
                  name="visitDate"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={entryFormik.values.visitDate}
                  onChange={entryFormik.handleChange}
                  onBlur={entryFormik.handleBlur}
                  error={entryFormik.touched.visitDate && Boolean(entryFormik.errors.visitDate)}
                  helperText={entryFormik.touched.visitDate && entryFormik.errors.visitDate}
                  disabled={submitLoading}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    Rating
                  </Typography>
                  <Rating
                    name="rating"
                    value={Number(entryFormik.values.rating)}
                    onChange={(event, newValue) => {
                      entryFormik.setFieldValue('rating', newValue);
                    }}
                    size="large"
                    precision={0.5}
                    disabled={submitLoading}
                  />
                  {entryFormik.touched.rating && entryFormik.errors.rating && (
                    <Typography variant="caption" color="error">
                      {entryFormik.errors.rating}
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  name="message"
                  multiline
                  rows={4}
                  value={entryFormik.values.message}
                  onChange={entryFormik.handleChange}
                  onBlur={entryFormik.handleBlur}
                  error={entryFormik.touched.message && Boolean(entryFormik.errors.message)}
                  helperText={entryFormik.touched.message && entryFormik.errors.message}
                  disabled={submitLoading}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setEntryDialogOpen(false)} disabled={submitLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={submitLoading || !entryFormik.isValid}
            >
              {submitLoading ? <CircularProgress size={24} /> : (editMode ? 'Update' : 'Submit')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Share Guest Link Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Guest Book Link</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Share this link with your guests to allow them to sign the guest book.
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            margin="normal"
            value={`${window.location.origin}/guest/${guestPin}`}
            InputProps={{
              readOnly: true,
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            The PIN for this guest book is: <strong>{guestPin}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            Close
          </Button>
          <Button 
            variant="contained"
            startIcon={<ShareIcon />}
            onClick={handleCopyGuestLink}
          >
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </Container>
  );
};

export default GuestBook;
