import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Event as CalendarIcon,
  Announcement as NoticeIcon,
  Description as DocumentIcon,
  Forum as MessageIcon,
  Book as GuestbookIcon,
} from '@mui/icons-material';
import { calendarAPI, noticeAPI, documentAPI, messageAPI, guestBookAPI } from '../services/api';
import { format } from 'date-fns';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [recentGuestEntries, setRecentGuestEntries] = useState([]);
  
  const [loading, setLoading] = useState({
    events: true,
    notices: true,
    documents: true,
    messages: true,
    guestEntries: true,
  });
  
  const [error, setError] = useState({
    events: '',
    notices: '',
    documents: '',
    messages: '',
    guestEntries: '',
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Fetch upcoming events
      try {
        const eventsResponse = await calendarAPI.getEvents();
        // Sort and get only future events or today's events
        const now = new Date();
        const futureEvents = eventsResponse.data
          .filter(event => new Date(event.start) >= new Date(now.setHours(0, 0, 0, 0)))
          .sort((a, b) => new Date(a.start) - new Date(b.start))
          .slice(0, 3);
        setUpcomingEvents(futureEvents);
      } catch (err) {
        setError(prev => ({ ...prev, events: 'Failed to load events' }));
      } finally {
        setLoading(prev => ({ ...prev, events: false }));
      }

      // Fetch recent notices
      try {
        const noticesResponse = await noticeAPI.getNotices();
        // Sort by date and get most recent
        const sortedNotices = noticesResponse.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
        setRecentNotices(sortedNotices);
      } catch (err) {
        setError(prev => ({ ...prev, notices: 'Failed to load notices' }));
      } finally {
        setLoading(prev => ({ ...prev, notices: false }));
      }

      // Fetch recent documents
      try {
        const documentsResponse = await documentAPI.getDocuments();
        // Sort by date and get most recent
        const sortedDocuments = documentsResponse.data
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
          .slice(0, 3);
        setRecentDocuments(sortedDocuments);
      } catch (err) {
        setError(prev => ({ ...prev, documents: 'Failed to load documents' }));
      } finally {
        setLoading(prev => ({ ...prev, documents: false }));
      }

      // Fetch recent messages
      try {
        const messagesResponse = await messageAPI.getMessages();
        // Sort by date and get most recent
        const sortedMessages = messagesResponse.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
        setRecentMessages(sortedMessages);
      } catch (err) {
        setError(prev => ({ ...prev, messages: 'Failed to load messages' }));
      } finally {
        setLoading(prev => ({ ...prev, messages: false }));
      }

      // Fetch recent guest book entries
      try {
        const guestEntriesResponse = await guestBookAPI.getEntries();
        // Sort by date and get most recent
        const sortedEntries = guestEntriesResponse.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
        setRecentGuestEntries(sortedEntries);
      } catch (err) {
        setError(prev => ({ ...prev, guestEntries: 'Failed to load guest book entries' }));
      } finally {
        setLoading(prev => ({ ...prev, guestEntries: false }));
      }
    };

    fetchDashboardData();
  }, []);

  const renderDashboardCard = (title, icon, data, loading, error, emptyMessage, renderItem, onClick) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" component="div" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : data.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        ) : (
          <List dense>
            {data.map(renderItem)}
          </List>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onClick}>View All</Button>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {currentUser?.name || 'User'}
      </Typography>
      
      <Typography variant="body1" paragraph>
        Here's what's happening at the cabin...
      </Typography>
      
      <Grid container spacing={3}>
        {/* Upcoming Events */}
        <Grid item xs={12} md={6} lg={4}>
          {renderDashboardCard(
            'Upcoming Events',
            <CalendarIcon color="primary" />,
            upcomingEvents,
            loading.events,
            error.events,
            'No upcoming events',
            (event) => (
              <ListItem key={event._id}>
                <ListItemText
                  primary={event.title}
                  secondary={`${format(new Date(event.start), 'MMM d, yyyy')} - ${format(new Date(event.end), 'MMM d, yyyy')}`}
                />
              </ListItem>
            ),
            () => navigate('/calendar')
          )}
        </Grid>
        
        {/* Recent Notices */}
        <Grid item xs={12} md={6} lg={4}>
          {renderDashboardCard(
            'Recent Notices',
            <NoticeIcon color="secondary" />,
            recentNotices,
            loading.notices,
            error.notices,
            'No recent notices',
            (notice) => (
              <ListItem key={notice._id}>
                <ListItemText
                  primary={notice.title}
                  secondary={`Posted by ${notice.author.name} on ${format(new Date(notice.createdAt), 'MMM d, yyyy')}`}
                />
              </ListItem>
            ),
            () => navigate('/notices')
          )}
        </Grid>
        
        {/* Recent Documents */}
        <Grid item xs={12} md={6} lg={4}>
          {renderDashboardCard(
            'Recent Documents',
            <DocumentIcon color="info" />,
            recentDocuments,
            loading.documents,
            error.documents,
            'No recent documents',
            (document) => (
              <ListItem key={document._id}>
                <ListItemText
                  primary={document.name}
                  secondary={`Uploaded by ${document.uploadedBy.name} on ${format(new Date(document.uploadedAt), 'MMM d, yyyy')}`}
                />
              </ListItem>
            ),
            () => navigate('/documents')
          )}
        </Grid>
        
        {/* Recent Messages */}
        <Grid item xs={12} md={6} lg={6}>
          {renderDashboardCard(
            'Recent Messages',
            <MessageIcon color="success" />,
            recentMessages,
            loading.messages,
            error.messages,
            'No recent messages',
            (message) => (
              <ListItem key={message._id}>
                <ListItemText
                  primary={message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')}
                  secondary={`From ${message.author.name} on ${format(new Date(message.createdAt), 'MMM d, yyyy')}`}
                />
              </ListItem>
            ),
            () => navigate('/messages')
          )}
        </Grid>
        
        {/* Recent Guest Book Entries */}
        <Grid item xs={12} md={6} lg={6}>
          {renderDashboardCard(
            'Recent Guest Book Entries',
            <GuestbookIcon color="warning" />,
            recentGuestEntries,
            loading.guestEntries,
            error.guestEntries,
            'No recent guest book entries',
            (entry) => (
              <ListItem key={entry._id}>
                <ListItemText
                  primary={entry.name}
                  secondary={`Visited on ${format(new Date(entry.visitDate), 'MMM d, yyyy')}`}
                />
              </ListItem>
            ),
            () => navigate('/guestbook')
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
