import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { toast } from 'react-toastify';

const ImageUploader = ({ onImageUploaded, isProcessing }) => {
  const [imagePreview, setImagePreview] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    
    if (!file) {
      return;
    }

    // Check if the file is an image
    if (!file.type.match('image.*')) {
      toast.error('Please upload an image file');
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should not exceed 10MB');
      return;
    }

    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Pass the file to the parent component
    onImageUploaded(file);
  }, [onImageUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.tiff']
    },
    disabled: isProcessing,
    multiple: false
  });

  const handleUploadClick = () => {
    if (!imagePreview) {
      document.getElementById('file-input').click();
    }
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <div
        {...getRootProps()}
        className="dropzone"
        style={{ opacity: isProcessing ? 0.6 : 1 }}
      >
        <input {...getInputProps()} id="file-input" />
        
        {isProcessing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
            <CircularProgress size={40} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Processing your table image...
            </Typography>
          </Box>
        ) : isDragActive ? (
          <Box sx={{ py: 3 }}>
            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h6">Drop the image here</Typography>
          </Box>
        ) : (
          <Box sx={{ py: 3 }}>
            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h6">Drag & drop a table image here</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              or click to select a file
            </Typography>
          </Box>
        )}
      </div>

      {imagePreview && !isProcessing && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Image Preview:
          </Typography>
          <img
            src={imagePreview}
            alt="Table preview"
            className="image-preview"
          />
        </Box>
      )}

      {!imagePreview && !isProcessing && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudUploadIcon />}
          onClick={handleUploadClick}
          sx={{ mt: 2 }}
        >
          Upload Table Image
        </Button>
      )}
    </Box>
  );
};

export default ImageUploader; 