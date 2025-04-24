import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, Slider, Tooltip, Modal, Fade } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

const ZoomableImage = ({ src, alt = 'Image' }) => {
  const [scale, setScale] = useState(1);
  const [mouseDown, setMouseDown] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef(null);
  const fullscreenContainerRef = useRef(null);

  // Handle zoom in
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.25, 5)); // Max zoom 5x
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.25, 0.5)); // Min zoom 0.5x
  };

  // Handle zoom reset
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Handle slider change
  const handleSliderChange = (event, newValue) => {
    setScale(newValue);
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    if (scale > 1) {
      e.preventDefault(); // Prevent any default behavior
      setMouseDown(true);
      setLastPosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (mouseDown && scale > 1) {
      e.preventDefault(); // Prevent any default behavior
      
      // Calculate the movement delta
      const deltaX = e.clientX - lastPosition.x;
      const deltaY = e.clientY - lastPosition.y;
      
      // Update position based on the delta
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      // Update last position for next move
      setLastPosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setMouseDown(false);
  };

  // Handle mouse leave to stop dragging
  const handleMouseLeave = () => {
    setMouseDown(false);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = (e) => {
    e.stopPropagation(); // Prevent triggering drag
    setFullscreen(!fullscreen);
  };

  // Setup wheel event listeners - unified version
  useEffect(() => {
    // Create a single wheel handler that can be reused
    const wheelHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Zoom in or out based on wheel direction
      if (e.deltaY < 0) {
        // Zoom in
        setScale(prevScale => Math.min(prevScale + 0.25, 5));
      } else {
        // Zoom out
        setScale(prevScale => Math.max(prevScale - 0.25, 0.5));
      }
    };
    
    // Get current refs to avoid closure issues
    const container = containerRef.current;
    const fullscreenContainer = fullscreenContainerRef.current;
    
    // Add event listeners to both containers if they exist
    if (container) {
      container.addEventListener('wheel', wheelHandler, { passive: false });
    }
    
    if (fullscreen && fullscreenContainer) {
      // For fullscreen, we need a small delay to ensure the modal is fully rendered
      const timer = setTimeout(() => {
        if (fullscreenContainerRef.current) {
          fullscreenContainerRef.current.addEventListener('wheel', wheelHandler, { passive: false });
        }
      }, 50);
      
      // Clean up function for the effect
      return () => {
        clearTimeout(timer);
        if (container) {
          container.removeEventListener('wheel', wheelHandler);
        }
        if (fullscreenContainerRef.current) {
          fullscreenContainerRef.current.removeEventListener('wheel', wheelHandler);
        }
      };
    }
    
    // Clean up for non-fullscreen mode
    return () => {
      if (container) {
        container.removeEventListener('wheel', wheelHandler);
      }
    };
  }, [fullscreen]); // Re-apply when fullscreen changes

  // Add keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only apply shortcuts when this component is in focus or in fullscreen
      if (containerRef.current && (containerRef.current.contains(document.activeElement) || fullscreen)) {
        switch (e.key) {
          case '+':
          case '=': // Common keyboard shortcut for zoom in
            handleZoomIn();
            e.preventDefault();
            break;
          case '-':
          case '_': // Common keyboard shortcut for zoom out
            handleZoomOut();
            e.preventDefault();
            break;
          case '0': // Reset zoom
            handleResetZoom();
            e.preventDefault();
            break;
          case 'Escape':
            if (fullscreen) {
              setFullscreen(false);
              e.preventDefault();
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scale, fullscreen]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      width: '100%',
      border: '1px solid #e0e0e0',
      borderRadius: 1,
      overflow: 'hidden',
      backgroundColor: '#f9f9f9'
    }}>
      {/* Zoom controls */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 0.5,
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ pl: 1 }}>
            Zoom: {Math.round(scale * 100)}%
          </Typography>
          <Tooltip title="Keyboard shortcuts: + to zoom in, - to zoom out, 0 to reset">
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
              (+ / -)
            </Typography>
          </Tooltip>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={handleZoomOut} disabled={scale <= 0.5}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Slider
            value={scale}
            min={0.5}
            max={5}
            step={0.25}
            onChange={handleSliderChange}
            aria-labelledby="zoom-slider"
            sx={{ width: '100px', mx: 1 }}
          />
          
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={handleZoomIn} disabled={scale >= 5}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Reset Zoom">
            <IconButton size="small" onClick={handleResetZoom}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="View Fullscreen">
            <IconButton size="small" onClick={toggleFullscreen}>
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Image container */}
      <Box 
        ref={containerRef}
        sx={{ 
          position: 'relative',
          overflow: 'hidden',
          height: { xs: '300px', md: 'calc(100vh - 180px)' },
          width: '100%',
          cursor: scale > 1 ? (mouseDown ? 'grabbing' : 'grab') : 'default',
          backgroundColor: '#f0f0f0'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <Box 
          component="img"
          src={src}
          alt={alt}
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
            transformOrigin: 'center center',
            transition: mouseDown ? 'none' : 'transform 0.15s ease',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            imageRendering: scale > 2.5 ? 'pixelated' : 'auto'
          }}
        />
        
        {scale > 1 && (
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: '10px', 
              right: '10px',
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: '50%',
              padding: '4px'
            }}
          >
            <Tooltip title="Drag to move">
              <OpenWithIcon fontSize="small" color="action" />
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Fullscreen modal */}
      <Modal
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        closeAfterTransition
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.85)'
          }
        }}
      >
        <Fade in={fullscreen}>
          <Box sx={{ 
            width: '90vw', 
            height: '90vh', 
            outline: 'none',
            position: 'relative'
          }}>
            {/* Fullscreen controls */}
            <Box sx={{ 
              position: 'absolute', 
              top: 10, 
              right: 10, 
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 1,
              padding: '4px 8px'
            }}>
              <Typography variant="caption" sx={{ mr: 1 }}>
                Zoom: {Math.round(scale * 100)}%
              </Typography>
              
              <Tooltip title="Zoom Out">
                <IconButton size="small" onClick={handleZoomOut} disabled={scale <= 0.5}>
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Slider
                value={scale}
                min={0.5}
                max={5}
                step={0.25}
                onChange={handleSliderChange}
                aria-labelledby="zoom-slider"
                sx={{ width: '100px', mx: 1 }}
              />
              
              <Tooltip title="Zoom In">
                <IconButton size="small" onClick={handleZoomIn} disabled={scale >= 5}>
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Reset">
                <IconButton size="small" onClick={handleResetZoom}>
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Exit Fullscreen">
                <IconButton size="small" onClick={toggleFullscreen} sx={{ ml: 1 }}>
                  <FullscreenExitIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Fullscreen image container */}
            <Box 
              ref={fullscreenContainerRef}
              sx={{ 
                width: '100%', 
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: scale > 1 ? (mouseDown ? 'grabbing' : 'grab') : 'default',
                backgroundColor: '#000'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Zoom in or out based on wheel direction
                if (e.deltaY < 0) {
                  // Zoom in
                  setScale(prevScale => Math.min(prevScale + 0.25, 5));
                } else {
                  // Zoom out
                  setScale(prevScale => Math.max(prevScale - 0.25, 0.5));
                }
              }}
            >
              <Box 
                component="img"
                src={src}
                alt={alt}
                sx={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: mouseDown ? 'none' : 'transform 0.15s ease',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              />
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default ZoomableImage; 