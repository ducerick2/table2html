import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, IconButton, Tooltip, TableContainer, Table, TableBody, TableRow, TableCell, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import EditIcon from '@mui/icons-material/Edit';
import clsx from 'clsx';
import { styled } from '@mui/material/styles';

const CustomDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiBackdrop-root': {
    backgroundColor: 'transparent',
  },
  '& .MuiDialog-paper': {
    position: 'absolute',
    right: 0,
    top: '20%',
    margin: 0,
    width: '45%',
    maxWidth: '500px',
    overflow: 'visible',
    boxShadow: theme.shadows[4],
  },
}));

const TableEditor = React.forwardRef(({ 
  tableHtml, 
  onAnnotationSaved, 
  existingAnnotations = [], 
  onExportHtml, 
  autoSave = true, 
  onEditingStateChange = () => {},
  hideInstructions = false
}, ref) => {
  const [tableData, setTableData] = useState({ rows: [], headers: [] });
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [corrections, setCorrections] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const editInputRef = useRef(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Updated parseHtmlTable function to handle colspan and rowspan
  const parseHtmlTable = (tableHtml) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(tableHtml, 'text/html');
    const tableElement = doc.querySelector('table');
    
    if (!tableElement) {
      console.error('No table found in HTML');
      return { rows: [], originalTable: null };
    }
    
    const rows = [];
    const rowElements = tableElement.querySelectorAll('tr');
    
    // Create a grid to track which cells are occupied by rowspan/colspan
    const grid = [];
    
    rowElements.forEach((rowElement, rowIndex) => {
      const row = [];
      const cells = rowElement.querySelectorAll('th, td');
      
      // Initialize this row in the grid if it doesn't exist
      if (!grid[rowIndex]) {
        grid[rowIndex] = [];
      }
      
      let colIndex = 0;
      cells.forEach((cell) => {
        // Skip cells that are already occupied by rowspan from above
        while (grid[rowIndex][colIndex]) {
          colIndex++;
        }
        
        const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;
        const colspan = parseInt(cell.getAttribute('colspan')) || 1;
        const isHeader = cell.tagName.toLowerCase() === 'th';
        const cellText = cell.innerHTML.trim();
        
        row.push({
          text: cellText,
          isHeader,
          rowspan,
          colspan,
          originalCell: cell,
          rowIndex,
          colIndex
        });
        
        // Mark the grid as occupied for this cell and any cells it spans
        for (let r = 0; r < rowspan; r++) {
          if (!grid[rowIndex + r]) {
            grid[rowIndex + r] = [];
          }
          for (let c = 0; c < colspan; c++) {
            grid[rowIndex + r][colIndex + c] = { spannedBy: { row: rowIndex, col: colIndex } };
          }
        }
        
        colIndex += colspan;
      });
      
      rows.push(row);
    });
    
    return { rows, originalTable: tableElement };
  };

  // Parse the HTML table into a structured format
  useEffect(() => {
    if (!tableHtml) return;

    const parsedTable = parseHtmlTable(tableHtml);
    setTableData(parsedTable);
  }, [tableHtml]);

  // Load existing annotations when they change
  useEffect(() => {
    if (existingAnnotations && existingAnnotations.length > 0) {
      const newCorrections = {};
      
      existingAnnotations.forEach(annotation => {
        newCorrections[annotation.id] = {
          original: annotation.originalText,
          corrected: annotation.correctedText,
          timestamp: annotation.timestamp
        };
      });
      
      setCorrections(newCorrections);
    }
  }, [existingAnnotations]);

  // Apply corrections to tableData when it's loaded and corrections exist
  useEffect(() => {
    if (tableData.rows.length > 0 && Object.keys(corrections).length > 0) {
      const updatedRows = [...tableData.rows];
      
      // Apply each correction to the table data
      Object.entries(corrections).forEach(([cellId, correction]) => {
        // Find the cell in the table data
        for (let rowIndex = 0; rowIndex < updatedRows.length; rowIndex++) {
          const cellIndex = updatedRows[rowIndex].findIndex(cell => cell.id === cellId);
          
          if (cellIndex !== -1) {
            // Update the cell content with the corrected value
            updatedRows[rowIndex][cellIndex] = {
              ...updatedRows[rowIndex][cellIndex],
              text: correction.corrected
            };
            break;
          }
        }
      });
      
      setTableData({ ...tableData, rows: updatedRows });
    }
  }, [tableData.headers, corrections]);

  // Modify handleCellClick to open the dialog
  const handleCellClick = (rowIndex, cellIndex) => {
    const cell = tableData.rows[rowIndex][cellIndex];
    setEditingCell({ rowIndex, cellIndex });
    setEditValue(cell.text);
    setDialogOpen(true);
  };

  // Add functions to handle dialog close and save
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCell(null);
    setEditValue('');
  };

  const handleSaveDialog = () => {
    if (editingCell) {
      const { rowIndex, cellIndex } = editingCell;
      
      // Update the text in our data structure
      const updatedRows = [...tableData.rows];
      if (updatedRows[rowIndex] && updatedRows[rowIndex][cellIndex]) {
        updatedRows[rowIndex][cellIndex].text = editValue;
        setTableData({
          ...tableData,
          rows: updatedRows
        });
        
        // If auto-save is enabled, save the HTML immediately
        if (autoSave && onExportHtml) {
          const correctedHtml = generateFinalHtml();
          onExportHtml(correctedHtml);
          console.log('Auto-saved edited cell');
          setHasChanges(false);
        }
      }
      
      setDialogOpen(false);
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Updated function to generate corrected HTML
  const generateCorrectedHtml = () => {
    if (!tableData || !tableData.originalTable) {
      console.error('No table data available');
      return '';
    }
    
    // Create a deep clone of the original table to preserve structure
    const clonedTable = tableData.originalTable.cloneNode(true);
    
    // Process each row in the cloned table
    const rows = clonedTable.querySelectorAll('tr');
    rows.forEach((row, rowIdx) => {
      // Get all cells in this row (both th and td)
      const cells = Array.from(row.querySelectorAll('th, td'));
      cells.forEach((cell, colIdx) => {
        // Update the cell content if we have edited data for this position
        if (tableData.rows[rowIdx] && tableData.rows[rowIdx][colIdx]) {
          cell.innerHTML = tableData.rows[rowIdx][colIdx].text;
        }
      });
    });
    
    return clonedTable.outerHTML;
  };

  // Alternative implementation using a matrix-based approach
  // This might be more reliable for complex tables
  const generateCorrectedHtmlMatrix = () => {
    if (!tableData || !tableData.originalTable) {
      console.error('No table data available');
      return '';
    }
    
    // Clone the original table
    const clonedTable = tableData.originalTable.cloneNode(true);
    
    // Create a virtual matrix of the same size as our parsed data
    // to map positions in the original table
    const matrix = [];
    const rows = clonedTable.querySelectorAll('tr');
    
    // Initialize the matrix
    for (let i = 0; i < rows.length; i++) {
      matrix[i] = [];
    }
    
    // Fill the matrix with references to DOM cells
    // This accounts for colspan and rowspan
    let rowIndex = 0;
    rows.forEach(row => {
      let colIndex = 0;
      const cells = row.querySelectorAll('th, td');
      
      cells.forEach(cell => {
        // Find the next available position in the matrix
        while (matrix[rowIndex][colIndex]) {
          colIndex++;
        }
        
        // Get spans
        const colspan = parseInt(cell.getAttribute('colspan')) || 1;
        const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;
        
        // Fill the matrix with references to this cell
        for (let r = 0; r < rowspan; r++) {
          for (let c = 0; c < colspan; c++) {
            if (!matrix[rowIndex + r]) matrix[rowIndex + r] = [];
            matrix[rowIndex + r][colIndex + c] = { 
              cell, 
              mainCell: r === 0 && c === 0,
              originalRow: rowIndex,
              originalCol: colIndex
            };
          }
        }
        
        colIndex += colspan;
      });
      
      rowIndex++;
    });
    
    // Now update each cell's content from our edited data
    for (let rowIdx = 0; rowIdx < matrix.length; rowIdx++) {
      for (let colIdx = 0; colIdx < matrix[rowIdx].length; colIdx++) {
        const matrixCell = matrix[rowIdx][colIdx];
        if (matrixCell && matrixCell.mainCell) {
          // Find the corresponding cell in our edited data
          if (tableData.rows[rowIdx] && tableData.rows[rowIdx][colIdx]) {
            matrixCell.cell.innerHTML = tableData.rows[rowIdx][colIdx].text;
          }
        }
      }
    }
    
    return clonedTable.outerHTML;
  };

  // Use the matrix-based version as it's more reliable
  const generateFinalHtml = () => {
    return generateCorrectedHtmlMatrix();
  };

  // Export HTML directly back to the original file
  const handleExportHtml = () => {
    if (Object.keys(corrections).length === 0) {
      console.log('No corrections to export');
      return;
    }
    
    // Generate HTML with corrected text
    const correctedHtml = generateFinalHtml();
    
    // Save directly back to the original file
    if (onExportHtml) {
      onExportHtml(correctedHtml);
      // Reset changes flag after saving
      setHasChanges(false);
    }
  };

  // Check if a cell has been corrected
  const isCellCorrected = (cellId) => {
    return Object.keys(corrections).includes(cellId);
  };

  // Notify parent when editing state changes
  useEffect(() => {
    onEditingStateChange(editingCell !== null);
  }, [editingCell, onEditingStateChange]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    generateCorrectedHtml: () => {
      return generateFinalHtml();
    }
  }));

  // Render the table editor
  return (
    <Box sx={{ height: '100%', overflow: 'hidden' }}>
      {!hideInstructions && (
        <Typography variant="body2" sx={{ p: 1, color: 'text.secondary' }}>
          Click on any cell to edit its content.
        </Typography>
      )}
      
      <TableContainer 
        component={Paper} 
        sx={{ 
          height: hideInstructions ? '100%' : 'calc(100% - 40px)',
          overflow: 'auto',
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
          },
          '& td, & th': {
            border: '1px solid #e0e0e0',
            padding: '8px',
            position: 'relative',
          }
        }}
      >
        <Table>
          <TableBody>
            {tableData.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={`${rowIndex}-${cellIndex}`}
                    onClick={() => handleCellClick(rowIndex, cellIndex)}
                    rowSpan={cell.rowspan}
                    colSpan={cell.colspan}
                    component={cell.isHeader ? 'th' : 'td'}
                    align="left"
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: cell.isHeader ? '#f5f5f5' : 'inherit',
                      '&:hover': {
                        backgroundColor: '#f0f7ff',
                      },
                    }}
                  >
                    {cell.text}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CustomDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
      >
        <DialogTitle>Edit Cell Content</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            fullWidth
            minRows={3}
            maxRows={10}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveDialog} color="primary">
            Save
          </Button>
        </DialogActions>
      </CustomDialog>
    </Box>
  );
});

export default TableEditor; 