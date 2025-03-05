import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { documentAPI } from '../services/api';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  UploadFile as UploadIcon,
  Folder as FolderIcon,
  Description as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  TextSnippet as TextIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

const DocumentRepository = () => {
  const { hasPermission } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentCategory, setDocumentCategory] = useState('general');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await documentAPI.getDocuments();
        setDocuments(response.data);
      } catch (err) {
        setError('Failed to load documents. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Dropzone configuration
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setSelectedFiles(acceptedFiles);
      // Auto-fill document name with the filename if not already set
      if (!documentName && acceptedFiles.length === 1) {
        setDocumentName(acceptedFiles[0].name.split('.')[0]);
      }
    },
    multiple: false,
  });

  // Handle upload dialog
  const handleOpenUploadDialog = () => {
    setUploadOpen(true);
    setDocumentName('');
    setDocumentCategory('general');
    setSelectedFiles([]);
    setUploadError('');
  };

  const handleCloseUploadDialog = () => {
    setUploadOpen(false);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadError('Please select a file to upload');
      return;
    }

    if (!documentName) {
      setUploadError('Please enter a document name');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFiles[0]);
    formData.append('name', documentName);
    formData.append('category', documentCategory);

    try {
      setUploading(true);
      setUploadError('');
      
      // In a real implementation, you would use axios with upload progress
      // For this example, we'll simulate progress
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 100) clearInterval(interval);
        }, 300);
        return interval;
      };
      
      const interval = simulateProgress();
      
      const response = await documentAPI.uploadDocument(formData);
      clearInterval(interval);
      setUploadProgress(100);
      
      // Add new document to the state
      setDocuments([response.data, ...documents]);
      
      // Close dialog after a short delay
      setTimeout(() => {
        setUploadOpen(false);
        setUploadProgress(0);
        setUploading(false);
      }, 500);
    } catch (err) {
      setUploadError('Failed to upload document. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle document download
  const handleDownload = async (document) => {
    try {
      const response = await documentAPI.downloadDocument(document._id);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.name + '.' + document.fileType);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download document. Please try again.');
    }
  };

  // Handle document deletion
  const handleDelete = async (documentId) => {
    try {
      await documentAPI.deleteDocument(documentId);
      setDocuments(documents.filter(doc => doc._id !== documentId));
    } catch (err) {
      setError('Failed to delete document. Please try again.');
    }
  };

  // Get icon based on file type
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <PdfIcon color="error" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon color="primary" />;
      case 'doc':
      case 'docx':
      case 'txt':
        return <TextIcon color="info" />;
      default:
        return <FileIcon />;
    }
  };

  // Filter documents by category
  const filteredDocuments = categoryFilter === 'all'
    ? documents
    : documents.filter(doc => doc.category === categoryFilter);

  // Unique categories from documents
  const categories = ['general', ...new Set(documents.map(doc => doc.category))];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Document Repository
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">
            Access important cabin documents, manuals, and files.
          </Typography>
          
          {hasPermission('documents.upload') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenUploadDialog}
            >
              Upload Document
            </Button>
          )}
        </Box>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="category-filter-label">Filter by Category</InputLabel>
            <Select
              labelId="category-filter-label"
              id="category-filter"
              value={categoryFilter}
              label="Filter by Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredDocuments.length === 0 ? (
          <Typography variant="body1" align="center" sx={{ py: 4 }}>
            No documents found. Upload some documents to get started.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredDocuments.map((document) => (
              <Grid item xs={12} sm={6} md={4} key={document._id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getFileIcon(document.fileType)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {document.name}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Category: {document.category.charAt(0).toUpperCase() + document.category.slice(1)}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Uploaded by: {document.uploadedBy.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Uploaded on: {format(new Date(document.uploadedAt), 'MMM d, yyyy')}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(document)}
                    >
                      Download
                    </Button>
                    
                    {hasPermission('documents.delete') && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(document._id)}
                      >
                        Delete
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        
        <DialogContent>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>
          )}
          
          <Box sx={{ mb: 3, mt: 1 }}>
            <Paper
              {...getRootProps()}
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                mb: 2,
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                Drag & drop a file here, or click to select a file
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported file types: PDF, Word, Text, Images
              </Typography>
            </Paper>
            
            {selectedFiles.length > 0 && (
              <List dense>
                {selectedFiles.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {getFileIcon(file.name.split('.').pop())}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
          
          <TextField
            label="Document Name"
            fullWidth
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            margin="normal"
            required
            disabled={uploading}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              value={documentCategory}
              label="Category"
              onChange={(e) => setDocumentCategory(e.target.value)}
              disabled={uploading}
            >
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="manual">Manual</MenuItem>
              <MenuItem value="procedure">Procedure</MenuItem>
              <MenuItem value="contract">Contract</MenuItem>
              <MenuItem value="receipt">Receipt</MenuItem>
              <MenuItem value="photo">Photo</MenuItem>
            </Select>
          </FormControl>
          
          {uploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Uploading: {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0 || !documentName}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentRepository;
