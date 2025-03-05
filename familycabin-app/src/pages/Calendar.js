import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { calendarAPI } from '../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Box,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Stack,
  Grid,
} from '@mui/material';
import { format, parseISO } from 'date-fns';

// Validation schema
const eventValidationSchema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string(),
  start: yup.date().required('Start date is required'),
  end: yup.date().required('End date is required')
    .min(yup.ref('start'), 'End date must be after start date'),
  allDay: yup.boolean(),
});

const Calendar = () => {
  const { currentUser, hasPermission } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch calendar events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await calendarAPI.getEvents();
        setEvents(response.data);
      } catch (err) {
        setError('Failed to load calendar events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Handle date click to create a new event
  const handleDateClick = (arg) => {
    if (!hasPermission('calendar.create')) return;
    
    setDialogMode('create');
    setSelectedEvent(null);
    
    // Set initial values for the form
    formik.resetForm();
    formik.setValues({
      title: '',
      description: '',
      start: arg.dateStr,
      end: arg.dateStr,
      allDay: true,
    });
    
    setOpenDialog(true);
  };

  // Handle event click to edit or view an event
  const handleEventClick = (arg) => {
    const event = events.find(e => e._id === arg.event.id);
    if (!event) return;
    
    setSelectedEvent(event);
    setDialogMode(hasPermission('calendar.edit') ? 'edit' : 'view');
    
    // Set values for the form
    formik.resetForm();
    formik.setValues({
      title: event.title,
      description: event.description || '',
      start: format(new Date(event.start), 'yyyy-MM-dd'),
      end: format(new Date(event.end), 'yyyy-MM-dd'),
      allDay: event.allDay,
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
      description: '',
      start: '',
      end: '',
      allDay: true,
    },
    validationSchema: eventValidationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitLoading(true);
        
        if (dialogMode === 'create') {
          // Create new event
          const response = await calendarAPI.createEvent(values);
          setEvents([...events, response.data]);
        } else if (dialogMode === 'edit' && selectedEvent) {
          // Update existing event
          const response = await calendarAPI.updateEvent(selectedEvent._id, values);
          setEvents(events.map(event => 
            event._id === selectedEvent._id ? response.data : event
          ));
        }
        
        setOpenDialog(false);
      } catch (err) {
        setError(dialogMode === 'create' 
          ? 'Failed to create event. Please try again.' 
          : 'Failed to update event. Please try again.');
      } finally {
        setSubmitLoading(false);
      }
    },
  });

  // Handle event deletion
  const handleDeleteEvent = async () => {
    if (!selectedEvent || !hasPermission('calendar.delete')) return;
    
    try {
      setSubmitLoading(true);
      await calendarAPI.deleteEvent(selectedEvent._id);
      setEvents(events.filter(event => event._id !== selectedEvent._id));
      setOpenDialog(false);
    } catch (err) {
      setError('Failed to delete event. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Format events for FullCalendar
  const formattedEvents = events.map(event => ({
    id: event._id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    backgroundColor: event.createdBy === currentUser?.id ? '#1976d2' : '#9c27b0',
    borderColor: event.createdBy === currentUser?.id ? '#1976d2' : '#9c27b0',
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cabin Calendar
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1" paragraph>
          View and manage cabin reservations. Click on a date to add a new booking or click on an existing booking to view details.
        </Typography>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            selectable={hasPermission('calendar.create')}
            editable={hasPermission('calendar.edit')}
            events={formattedEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek'
            }}
            height="auto"
          />
        )}
      </Paper>
      
      {/* Event Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Add New Booking' : 
           dialogMode === 'edit' ? 'Edit Booking' : 'Booking Details'}
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
                disabled={dialogMode === 'view' || submitLoading}
                required
              />
              
              <TextField
                label="Description"
                name="description"
                fullWidth
                multiline
                rows={3}
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
                disabled={dialogMode === 'view' || submitLoading}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Date"
                    name="start"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formik.values.start}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.start && Boolean(formik.errors.start)}
                    helperText={formik.touched.start && formik.errors.start}
                    disabled={dialogMode === 'view' || submitLoading}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Date"
                    name="end"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formik.values.end}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.end && Boolean(formik.errors.end)}
                    helperText={formik.touched.end && formik.errors.end}
                    disabled={dialogMode === 'view' || submitLoading}
                    required
                  />
                </Grid>
              </Grid>
              
              <FormControlLabel
                control={
                  <Checkbox
                    name="allDay"
                    checked={formik.values.allDay}
                    onChange={formik.handleChange}
                    disabled={dialogMode === 'view' || submitLoading}
                  />
                }
                label="All Day"
              />
              
              {selectedEvent && dialogMode === 'view' && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created by: {selectedEvent.createdBy === currentUser?.id ? 'You' : selectedEvent.createdByName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created on: {format(new Date(selectedEvent.createdAt), 'MMM d, yyyy')}
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>
          
          <DialogActions>
            {dialogMode === 'view' ? (
              <Button onClick={handleCloseDialog}>Close</Button>
            ) : (
              <>
                <Button onClick={handleCloseDialog} disabled={submitLoading}>Cancel</Button>
                
                {dialogMode === 'edit' && hasPermission('calendar.delete') && (
                  <Button 
                    onClick={handleDeleteEvent} 
                    color="error" 
                    disabled={submitLoading}
                  >
                    Delete
                  </Button>
                )}
                
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={submitLoading}
                >
                  {submitLoading ? <CircularProgress size={24} /> : 'Save'}
                </Button>
              </>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Calendar;
