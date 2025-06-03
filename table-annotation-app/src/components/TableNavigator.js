import React from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

const TableNavigator = ({ currentTable, totalTables, onNavigate }) => {
    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 1,
            borderBottom: '1px solid #e0e0e0'
        }}>
            <Tooltip title="Previous table">
                <span>
                    <IconButton 
                        onClick={() => onNavigate('prev')}
                        disabled={currentTable <= 0}
                    >
                        <NavigateBeforeIcon />
                    </IconButton>
                </span>
            </Tooltip>
            
            <Typography variant="body1">
                Table {currentTable + 1} of {totalTables}
            </Typography>
            
            <Tooltip title="Next table">
                <span>
                    <IconButton 
                        onClick={() => onNavigate('next')}
                        disabled={currentTable >= totalTables - 1}
                    >
                        <NavigateNextIcon />
                    </IconButton>
                </span>
            </Tooltip>
        </Box>
    );
};

export default TableNavigator; 