import React from 'react';
import { Box, TextField } from '@mui/material';

const TextEditor = ({ text, onTextChange }) => {
    return (
        <Box sx={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <TextField
                multiline
                fullWidth
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                variant="outlined"
                sx={{
                    flex: 1,
                    '& .MuiInputBase-root': {
                        height: '100%',
                        padding: '8px',
                    },
                    '& .MuiInputBase-input': {
                        height: '100% !important',
                        overflowY: 'auto !important',
                        fontSize: '14px',
                        lineHeight: 1.5,
                    }
                }}
            />
        </Box>
    );
};

export default TextEditor; 