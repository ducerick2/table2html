import React, { useState } from 'react';
import { Box, Typography, Button, Paper, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ImageIcon from '@mui/icons-material/Image';
import { toast } from 'react-toastify';

const FolderBrowser = ({ onFolderSelected }) => {
  const [selectedFolder, setSelectedFolder] = useState(null);
  
  const handleFolderSelection = () => {
    // In a browser environment, we can't directly browse the file system
    // In an electron app, you would use electron's dialog to choose a folder
    // For demo purposes, we'll mock this with some example files
    
    // Simulate a folder selection
    const mockFolderPath = '/path/to/table/images';
    const mockFiles = [
      'table1.jpg',
      'table2.png',
      'table3.jpg',
      'complex_table.png',
      'financial_table.jpg'
    ];
    
    setSelectedFolder(mockFolderPath);
    onFolderSelected(mockFolderPath, mockFiles);
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Select Folder with Table Images and HTML Files
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Choose a folder containing your table images and corresponding HTML files.
        The HTML files should have the same base name as the image files.
      </Typography>
      
      <Box sx={{ my: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<FolderIcon />}
          onClick={handleFolderSelection}
        >
          Browse Folders
        </Button>
      </Box>
      
      {selectedFolder && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1">
            Selected Folder:
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {selectedFolder}
          </Typography>
        </Box>
      )}
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="textSecondary">
          Note: In this web demo, we're using mock data. In a desktop application,
          you would be able to browse your actual file system.
        </Typography>
      </Box>
    </Paper>
  );
};

export default FolderBrowser; 