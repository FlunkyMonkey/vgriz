import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  IconButton,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  PhotoCamera as CameraIcon,
} from '@mui/icons-material';

// Profile validation schema
const profileValidationSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  phone: yup.string(),
  bio: yup.string(),
});

// Password change validation schema
const passwordValidationSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile = () => {
  const { currentUser, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Handle tab change
  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Dropzone configuration for avatar upload
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 2097152, // 2MB
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    },
    multiple: false,
  });

  // Profile form
  const profileFormik = useFormik({
    initialValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      bio: currentUser?.bio || '',
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError('');
        setSuccess('');
        
        // Create form data if there's an avatar file
        const profileData = values;
        
        if (avatarFile) {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          formData.append('name', values.name);
          formData.append('email', values.email);
          formData.append('phone', values.phone);
          formData.append('bio', values.bio);
          
          await updateProfile(formData);
        } else {
          await updateProfile(profileData);
        }
        
        setSuccess('Profile updated successfully');
      } catch (err) {
        setError('Failed to update profile. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  // Password change form
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setPasswordError('');
        setPasswordSuccess('');
        
        // In a real app, this would call an API to change password
        // await userAPI.updatePassword(values);
        
        // For demo purposes, simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setPasswordSuccess('Password updated successfully');
        passwordFormik.resetForm();
      } catch (err) {
        setPasswordError('Failed to update password. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    calendarReminders: true,
    documentUpdates: false,
    messageAlerts: true,
    guestBookEntries: true,
  });

  const handleNotificationChange = (event) => {
    setNotificationSettings({
      ...notificationSettings,
      [event.target.name]: event.target.checked,
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Your Profile
      </Typography>
      
      <Paper elevation={3} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleChangeTab} 
            aria-label="profile tabs"
            variant="fullWidth"
          >
            <Tab icon={<AccountIcon />} label="Profile" />
            <Tab icon={<LockIcon />} label="Security" />
            <Tab icon={<NotificationsIcon />} label="Notifications" />
          </Tabs>
        </Box>
        
        {/* Profile Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={avatarPreview}
                    alt={currentUser?.name}
                    sx={{ width: 150, height: 150, mb: 2 }}
                  />
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 0,
                      bgcolor: 'background.paper',
                      '&:hover': {
                        bgcolor: 'background.default',
                      },
                    }}
                    {...getRootProps()}
                  >
                    <input {...getInputProps()} />
                    <CameraIcon />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" align="center">
                  Click the camera icon to upload a new photo
                </Typography>
              </Box>
              
              <Card sx={{ mt: 4 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Account Type
                    </Typography>
                    <Typography variant="body1">
                      {currentUser?.role || 'Family Member'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Member Since
                    </Typography>
                    <Typography variant="body1">
                      {currentUser?.createdAt 
                        ? new Date(currentUser.createdAt).toLocaleDateString() 
                        : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Last Login
                    </Typography>
                    <Typography variant="body1">
                      {currentUser?.lastLogin 
                        ? new Date(currentUser.lastLogin).toLocaleDateString() 
                        : 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={8}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>
              )}
              
              <form onSubmit={profileFormik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Personal Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={profileFormik.values.name}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                      helperText={profileFormik.touched.name && profileFormik.errors.name}
                      disabled={loading}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={profileFormik.values.email}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                      helperText={profileFormik.touched.email && profileFormik.errors.email}
                      disabled={loading}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={profileFormik.values.phone}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.phone && Boolean(profileFormik.errors.phone)}
                      helperText={profileFormik.touched.phone && profileFormik.errors.phone}
                      disabled={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      name="bio"
                      multiline
                      rows={4}
                      value={profileFormik.values.bio}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.bio && Boolean(profileFormik.errors.bio)}
                      helperText={profileFormik.touched.bio && profileFormik.errors.bio}
                      disabled={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <EditIcon />}
                    >
                      Update Profile
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Security Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              {passwordError && (
                <Alert severity="error" sx={{ mb: 3 }}>{passwordError}</Alert>
              )}
              
              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>{passwordSuccess}</Alert>
              )}
              
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <form onSubmit={passwordFormik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={passwordFormik.values.currentPassword}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                      helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
                      disabled={loading}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={passwordFormik.values.newPassword}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                      helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
                      disabled={loading}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={passwordFormik.values.confirmPassword}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
                      helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
                      disabled={loading}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <LockIcon />}
                    >
                      Change Password
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Connected Accounts
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#DB4437', mr: 2 }}>G</Avatar>
                      <Box>
                        <Typography variant="body1">Google</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {currentUser?.googleConnected ? 'Connected' : 'Not connected'}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                    >
                      {currentUser?.googleConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
              
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#3b5998', mr: 2 }}>F</Avatar>
                      <Box>
                        <Typography variant="body1">Facebook</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {currentUser?.facebookConnected ? 'Connected' : 'Not connected'}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                    >
                      {currentUser?.facebookConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#000000', mr: 2 }}>A</Avatar>
                      <Box>
                        <Typography variant="body1">Apple</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {currentUser?.appleConnected ? 'Connected' : 'Not connected'}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                    >
                      {currentUser?.appleConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onChange={handleNotificationChange}
                    name="emailNotifications"
                  />
                }
                label="Email Notifications"
              />
              <Typography variant="body2" color="text.secondary" sx={{ pl: 7 }}>
                Receive email notifications for important updates
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.calendarReminders}
                    onChange={handleNotificationChange}
                    name="calendarReminders"
                  />
                }
                label="Calendar Reminders"
              />
              <Typography variant="body2" color="text.secondary" sx={{ pl: 7 }}>
                Receive reminders for upcoming cabin reservations
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.documentUpdates}
                    onChange={handleNotificationChange}
                    name="documentUpdates"
                  />
                }
                label="Document Updates"
              />
              <Typography variant="body2" color="text.secondary" sx={{ pl: 7 }}>
                Get notified when new documents are uploaded
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.messageAlerts}
                    onChange={handleNotificationChange}
                    name="messageAlerts"
                  />
                }
                label="Message Alerts"
              />
              <Typography variant="body2" color="text.secondary" sx={{ pl: 7 }}>
                Receive notifications for new messages on the board
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.guestBookEntries}
                    onChange={handleNotificationChange}
                    name="guestBookEntries"
                  />
                }
                label="Guest Book Entries"
              />
              <Typography variant="body2" color="text.secondary" sx={{ pl: 7 }}>
                Get notified when guests sign the guest book
              </Typography>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<NotificationsIcon />}
                onClick={() => {
                  // In a real app, this would save notification settings
                  setSuccess('Notification settings updated');
                  setTimeout(() => setSuccess(''), 3000);
                }}
              >
                Save Notification Settings
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Profile;
