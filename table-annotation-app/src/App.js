import React, { useState, useEffect, useRef } from 'react';
import { Container, AppBar, Toolbar, Typography, Box, Paper, Button, CircularProgress, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import TableEditor from './components/TableEditor';
import FileBrowser from './components/FileBrowser';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { toast } from 'react-toastify';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  getFileDetails,
  getImageUrl,
  getImageBase64,
  getHtmlContent,
  getAnnotations,
  saveAnnotations,
  exportHtml,
  updateHtml,
  downloadAllAnnotations,
  getServerStatus,
  getTableFiles,
  excludeFile
} from './services/ApiService';
import ZoomableImage from './components/ZoomableImage';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [filesList, setFilesList] = useState([]);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [tableHtml, setTableHtml] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [currentAnnotations, setCurrentAnnotations] = useState([]);
  const [serverStatus, setServerStatus] = useState(null);
  const [serverConnected, setServerConnected] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [mobileView, setMobileView] = useState('both');
  const [confirmExcludeOpen, setConfirmExcludeOpen] = useState(false);

  // Check server status on mount
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const status = await getServerStatus();
      setServerStatus(status);
      setServerConnected(true);
    } catch (error) {
      console.error('Server connection error:', error);
      setServerConnected(false);
    }
  };

  // Add ref to access TableEditor methods
  const tableEditor = useRef(null);

  // Load a file by ID
  const loadFile = async (fileId) => {
    // We'll skip auto-saving here since the navigation functions already handle it
    // This avoids double-saving and potential race conditions
    
    setIsLoading(true);
    setLoadingStatus(`Loading file...`);
    setCurrentImage(null);
    setTableHtml(null);
    setCurrentAnnotations([]);

    try {
      // Get file details
      const fileDetails = await getFileDetails(fileId);
      if (!fileDetails.success) {
        console.error('Error loading file details');
        setIsLoading(false);
        return;
      }

      setCurrentFile(fileDetails.file);
      setCurrentFileId(fileId);

      // Get image (either direct URL or base64)
      try {
        const imageResult = await getImageBase64(fileId);
        if (imageResult.success) {
          setCurrentImage(imageResult.imageData);
        }
      } catch (error) {
        console.error('Error loading image, falling back to URL:', error);
        // Fallback to direct URL
        setCurrentImage(getImageUrl(fileId));
      }

      // Load HTML if available
      if (fileDetails.file.hasHtml) {
        try {
          const htmlResult = await getHtmlContent(fileId);
          if (htmlResult.success) {
            setTableHtml(htmlResult.html);
          } else {
            toast.error('Error loading HTML content');
          }
        } catch (error) {
          console.error('Error loading HTML:', error);
          toast.error(`Error loading HTML: ${error.message}`);
        }
      } else {
        toast.warning('No HTML file available for this image');
      }

      // Load annotations if available
      try {
        const annotationsResult = await getAnnotations(fileId);
        if (annotationsResult.success) {
          setCurrentAnnotations(annotationsResult.annotations.corrections || []);
        }
      } catch (error) {
        console.error('Error loading annotations:', error);
        toast.error(`Error loading annotations: ${error.message}`);
      }
    } catch (error) {
      console.error('Error loading file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add auto-save function
  const handleAutoSave = async () => {
    try {
      if (currentFileId && tableEditor.current && tableEditor.current.generateCorrectedHtml) {
        const correctedHtml = tableEditor.current.generateCorrectedHtml();
        if (correctedHtml) {
          await exportHtml(currentFileId, correctedHtml);
        }
      }
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  };

  // Handle file selection from FileBrowser
  const handleFileSelected = (fileId) => {
    loadFile(fileId);
  };

  // Navigate to next file
  const handleNextFile = async () => {
    if (!currentFile) return;
    
    try {
      // Ensure we auto-save before navigating
      if (autoSave && currentFileId && tableHtml) {
        setIsLoading(true);
        setLoadingStatus('Saving changes...');
        
        // Make sure we get the latest HTML
        if (tableEditor.current && tableEditor.current.generateCorrectedHtml) {
          const correctedHtml = tableEditor.current.generateCorrectedHtml();
          if (correctedHtml) {
            // Wait for the HTML update to complete
            await updateHtml(currentFileId, correctedHtml);
            console.log('Auto-saved HTML before navigation');
          }
        }
      }
      
      setIsLoading(true);
      setLoadingStatus('Loading next file...');
      
      // Get files to find the next one
      const result = await getTableFiles(1, 1000);
      if (result.success && result.files && result.files.length > 0) {
        const currentIndex = result.files.findIndex(f => f.id === currentFileId);
        if (currentIndex >= 0 && currentIndex < result.files.length - 1) {
          const nextFile = result.files[currentIndex + 1];
          await loadFile(nextFile.id);
        } else {
          console.log('This is the last file');
          setIsLoading(false);
        }
      } else {
        console.error('Error fetching files list');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error navigating to next file:', error);
      setIsLoading(false);
    }
  };

  // Navigate to previous file
  const handlePrevFile = async () => {
    if (!currentFile) return;
    
    try {
      // Ensure we auto-save before navigating
      if (autoSave && currentFileId && tableHtml) {
        setIsLoading(true);
        setLoadingStatus('Saving changes...');
        
        // Make sure we get the latest HTML
        if (tableEditor.current && tableEditor.current.generateCorrectedHtml) {
          const correctedHtml = tableEditor.current.generateCorrectedHtml();
          if (correctedHtml) {
            // Wait for the HTML update to complete
            await updateHtml(currentFileId, correctedHtml);
            console.log('Auto-saved HTML before navigation');
          }
        }
      }
      
      setIsLoading(true);
      setLoadingStatus('Loading previous file...');
      
      // Get files to find the previous one
      const result = await getTableFiles(1, 1000);
      if (result.success && result.files && result.files.length > 0) {
        const currentIndex = result.files.findIndex(f => f.id === currentFileId);
        if (currentIndex > 0) {
          const prevFile = result.files[currentIndex - 1];
          await loadFile(prevFile.id);
        } else {
          console.log('This is the first file');
          setIsLoading(false);
        }
      } else {
        console.error('Error fetching files list');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error navigating to previous file:', error);
      setIsLoading(false);
    }
  };

  // Simplify handleAnnotationSaved to just trigger HTML save
  const handleAnnotationSaved = async (updatedAnnotation) => {
    if (!currentFileId) return;
    
    try {
      // We'll keep track of annotations in memory
      let updatedAnnotations = [...currentAnnotations];
      const existingIndex = updatedAnnotations.findIndex(a => a.id === updatedAnnotation.id);
      
      if (existingIndex >= 0) {
        updatedAnnotations[existingIndex] = updatedAnnotation;
      } else {
        updatedAnnotations.push(updatedAnnotation);
      }
      
      setCurrentAnnotations(updatedAnnotations);
      
      // No need to save annotations to JSON - just trigger the HTML save
      if (tableEditor.current && tableEditor.current.generateCorrectedHtml) {
        const correctedHtml = tableEditor.current.generateCorrectedHtml();
        if (correctedHtml) {
          await updateHtml(currentFileId, correctedHtml);
        }
      }
    } catch (error) {
      console.error('Error handling annotation:', error);
    }
  };

  // Update handleExportHtml to save directly back to the original file
  const handleExportHtml = async (htmlContent) => {
    if (!currentFileId) return;
    
    try {
      // Get the current file's details
      const fileDetails = await getFileDetails(currentFileId);
      if (!fileDetails.success || !fileDetails.file) {
        console.error('Could not get file details for HTML export');
        return;
      }
      
      // Check if this file has an HTML file
      if (fileDetails.file.hasHtml) {
        // Update the original HTML file
        const result = await updateHtml(currentFileId, htmlContent);
        if (!result.success) {
          console.error(`Error updating HTML: ${result.error || 'Unknown error'}`);
        }
      } else {
        // If no original HTML, create a new one with exportHtml
        const result = await exportHtml(currentFileId, htmlContent);
        if (!result.success) {
          console.error(`Error exporting HTML: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error handling HTML export:', error);
    }
  };

  // Export all annotations
  const handleExportAllAnnotations = () => {
    try {
      downloadAllAnnotations();
      toast.info('Downloading all annotations...');
    } catch (error) {
      console.error('Error exporting all annotations:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Update handleBackToFiles to auto-save before returning to file list
  const handleBackToFiles = async () => {
    // Auto-save before navigating away
    if (autoSave && currentFileId) {
      await handleAutoSave();
    }
    
    setCurrentFile(null);
    setCurrentFileId(null);
    setCurrentImage(null);
    setTableHtml(null);
    setCurrentAnnotations([]);
  };

  // Add a dedicated auto-save function
  const saveCurrentHtml = async () => {
    if (!currentFileId || !tableHtml) return false;
    
    try {
      // Get the current corrected HTML
      if (tableEditor.current && tableEditor.current.generateCorrectedHtml) {
        const correctedHtml = tableEditor.current.generateCorrectedHtml();
        if (correctedHtml) {
          // Save the HTML
          const result = await updateHtml(currentFileId, correctedHtml);
          return result.success;
        }
      }
      return false;
    } catch (error) {
      console.error('Error saving HTML:', error);
      return false;
    }
  };

  // Make sure our keyboard navigation also uses the auto-save function
  useEffect(() => {
    // Function to handle keyboard events
    const handleKeyDown = async (event) => {
      // Skip keyboard navigation if loading or editing a cell
      if (!currentFile || isLoading || isEditing) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          // Auto-save before navigating
          if (autoSave) {
            setIsLoading(true);
            setLoadingStatus('Saving changes...');
            await saveCurrentHtml();
          }
          handlePrevFile();
          break;
        case 'ArrowRight':
          // Auto-save before navigating
          if (autoSave) {
            setIsLoading(true);
            setLoadingStatus('Saving changes...');
            await saveCurrentHtml();
          }
          handleNextFile();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentFile, isLoading, isEditing, autoSave]);

  // Add a beforeunload handler to save changes when closing the browser
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (autoSave && currentFileId && tableHtml) {
        // Attempt to save changes
        await saveCurrentHtml();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentFileId, tableHtml, autoSave]);

  // Handle excluding (removing) the current file
  const handleOpenExcludeDialog = () => {
    setConfirmExcludeOpen(true);
  };
  
  const handleCloseExcludeDialog = () => {
    setConfirmExcludeOpen(false);
  };
  
  const handleExcludeFile = async () => {
    if (!currentFileId) return;
    
    try {
      setIsLoading(true);
      setLoadingStatus('Moving file to excluded directory...');
      setConfirmExcludeOpen(false);
      
      // First get the files list and find the current index before excluding
      let nextFileId = null;
      
      try {
        const filesList = await getTableFiles(1, 1000);
        if (filesList.success && filesList.files && filesList.files.length > 0) {
          const currentIndex = filesList.files.findIndex(f => f.id === currentFileId);
          if (currentIndex >= 0) {
            // Determine the next file to load (either next or previous if at the end)
            if (currentIndex < filesList.files.length - 1) {
              // There's a next file
              nextFileId = filesList.files[currentIndex + 1].id;
            } else if (currentIndex > 0) {
              // This is the last file, go to previous
              nextFileId = filesList.files[currentIndex - 1].id;
            }
          }
        }
      } catch (error) {
        console.error('Error determining next file:', error);
      }
      
      // Now exclude the current file
      const result = await excludeFile(currentFileId);
      
      if (result.success) {
        console.log(`File ${currentFileId} excluded successfully`);
        
        // Navigate to the next file if we found one
        if (nextFileId) {
          console.log(`Loading next file: ${nextFileId}`);
          // Directly call loadFile with the pre-determined next file ID
          await loadFile(nextFileId);
        } else {
          // No files left or couldn't determine next file, go back to file browser
          console.log('No more files to navigate to, returning to file browser');
          setCurrentFile(null);
          setCurrentFileId(null);
          setCurrentImage(null);
          setTableHtml(null);
          setCurrentAnnotations([]);
        }
      } else {
        console.error('Error excluding file:', result.error);
      }
    } catch (error) {
      console.error('Error excluding file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1.1rem' }}>
            Table HTML Editor
          </Typography>
          
          {currentFile ? (
            <Button
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToFiles}
              size="small"
            >
              Back
            </Button>
          ) : null}
        </Toolbar>
      </AppBar>
      
      <Box sx={{ 
        width: '100%',
        px: 1, // Just 8px padding on left and right
        py: 0.5, // Minimal top/bottom padding
        boxSizing: 'border-box'
      }}>
        {!serverConnected ? (
          <Paper elevation={3} sx={{ p: 3, mt: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              Cannot Connect to Server
            </Typography>
            <Typography variant="body1" paragraph>
              The application cannot connect to the Python server. Please make sure:
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'left', maxWidth: '500px', mx: 'auto' }}>
              1. The Python server is running on http://localhost:5000
              2. You have installed all the required Python dependencies
              3. The server has correct permissions to access the images directory
              4. There are no network issues or firewall restrictions
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={checkServerStatus}
              sx={{ mt: 2 }}
            >
              Retry Connection
            </Button>
          </Paper>
        ) : !currentFile ? (
          <Box sx={{ my: 4 }}>
            <FileBrowser onFileSelected={handleFileSelected} />
            
            {serverStatus && (
              <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Server Status: Running | 
                  Images Directory: {serverStatus.imagesDirectory} | 
                  Files Available: {serverStatus.fileCount}
                </Typography>
              </Paper>
            )}
          </Box>
        ) : (
          <Box sx={{ my: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 1, sm: 2 } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 1,
                pb: 1,
                borderBottom: '1px solid #eaeaea'
              }}>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                    {currentFile.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                    {currentFile.hasHtml ? 'HTML Available' : 'No HTML File'} 
                  </Typography>
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<NavigateBeforeIcon />}
                      onClick={handlePrevFile}
                      disabled={isLoading}
                      size="small"
                    >
                      Previous
                    </Button>
                    
                    <Button
                      variant="outlined"
                      endIcon={<NavigateNextIcon />}
                      onClick={handleNextFile}
                      disabled={isLoading}
                      size="small"
                    >
                      Next
                    </Button>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.75rem', textAlign: 'right' }}>
                    Keyboard: ← Previous | → Next
                  </Typography>
                </Box>
              </Box>

              {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 8 }}>
                  <CircularProgress />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    {loadingStatus || 'Loading...'}
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {currentImage && tableHtml ? (
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      {/* Left side - Image panel */}
                      <Box sx={{ 
                        width: { xs: '100%', md: '40%' }, 
                        position: { md: 'sticky' },
                        top: { md: '8px' },
                        alignSelf: { md: 'flex-start' }
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ pl: 1 }}>
                            Table Image:
                          </Typography>
                          
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleOpenExcludeDialog}
                            size="small"
                            sx={{ 
                              minWidth: 'auto', 
                              py: 0.5, 
                              fontSize: '0.75rem', 
                              height: 'fit-content'
                            }}
                          >
                            Remove
                          </Button>
                        </Box>
                        <ZoomableImage 
                          src={currentImage} 
                          alt="Table" 
                        />
                      </Box>

                      {/* Right side - HTML editor */}
                      <Box sx={{ 
                        width: { xs: '100%', md: '55%' },
                        display: { 
                          xs: (mobileView === 'editor' || mobileView === 'both') ? 'block' : 'none',
                          md: 'block'
                        }
                      }}>
                        <TableEditor
                          ref={tableEditor}
                          tableHtml={tableHtml}
                          onAnnotationSaved={handleAnnotationSaved}
                          existingAnnotations={currentAnnotations}
                          onExportHtml={handleExportHtml}
                          autoSave={autoSave}
                          onEditingStateChange={setIsEditing}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      {currentImage ? 'No HTML content available for this image.' : 
                        'No image available. Select a file from the browser.'}
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Box>
      
      {/* Confirmation Dialog for Excluding a File */}
      <Dialog
        open={confirmExcludeOpen}
        onClose={handleCloseExcludeDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Remove this file?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This will move the image file and its corresponding HTML file to the excluded directory.
            This action cannot be undone from the application.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExcludeDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleExcludeFile} color="error" autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;