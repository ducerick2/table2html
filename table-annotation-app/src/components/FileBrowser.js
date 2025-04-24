import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, 
  Pagination, CircularProgress, Button
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { green } from '@mui/material/colors';
import { getTableFiles } from '../services/ApiService';
import { toast } from 'react-toastify';

const FileBrowser = ({ onFileSelected }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchFiles();
  }, [page, refreshKey]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const result = await getTableFiles(page, 50);
      setFiles(result.files || []);
      setTotalPages(result.totalPages || 1);
      setTotalFiles(result.totalFiles || 0);
    } catch (error) {
      toast.error(`Error loading files: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Table Files
        </Typography>

        <Button 
          variant="outlined" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      <Typography variant="body2" color="textSecondary" paragraph>
        Select a table image file to annotate. 
        {totalFiles > 0 && ` Showing ${files.length} of ${totalFiles} total files.`}
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : files.length > 0 ? (
        <>
          <List sx={{ 
            maxHeight: '400px', 
            overflow: 'auto', 
            bgcolor: '#f5f5f5', 
            borderRadius: 1 
          }}>
            {files.map((file) => (
              <ListItem
                key={file.id}
                button
                onClick={() => onFileSelected(file.id)}
                sx={{ 
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: file.hasHtml ? 'rgba(25, 118, 210, 0.05)' : 'transparent'
                }}
              >
                <ListItemIcon>
                  <ImageIcon color={file.hasHtml ? 'primary' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary={file.name} 
                  secondary={file.hasHtml ? 'HTML available' : 'No HTML file yet'}
                />
              </ListItem>
            ))}
          </List>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        </>
      ) : (
        <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
          No files found. Make sure your images directory contains table image files.
        </Typography>
      )}
    </Paper>
  );
};

export default FileBrowser; 