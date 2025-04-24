import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, IconButton, Tooltip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';

const TableEditor = React.forwardRef(({ tableHtml, onAnnotationSaved, existingAnnotations = [], onExportHtml, autoSave = true, onEditingStateChange = () => {} }, ref) => {
  const [tableData, setTableData] = useState({ rows: [], headers: [] });
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [corrections, setCorrections] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const editInputRef = useRef(null);

  // Parse the HTML table into a structured format
  useEffect(() => {
    if (!tableHtml) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(tableHtml, 'text/html');
    const table = doc.querySelector('table');
    
    if (!table) {
      console.error('Invalid table structure received');
      return;
    }

    const rows = [];
    const headers = [];
    
    // Process table rows
    const allRows = table.querySelectorAll('tr');
    
    // Check if the first row contains th elements (header cells)
    const firstRow = allRows[0];
    const hasHeaderRow = firstRow && firstRow.querySelector('th');
    
    allRows.forEach((tr, rowIndex) => {
      // If first row has headers and this is the first row, treat as headers
      if (hasHeaderRow && rowIndex === 0) {
        tr.querySelectorAll('th').forEach((th) => {
          headers.push(th.textContent.trim());
        });
      } else {
        const rowData = [];
        // Check for both th and td elements in case the structure is inconsistent
        const cells = tr.querySelectorAll('td, th');
        cells.forEach((cell, colIndex) => {
          rowData.push({
            id: `cell-${rowIndex}-${colIndex}`,
            content: cell.textContent.trim(),
            row: rows.length, // Store the actual index in our rows array, not the HTML row index
            col: colIndex,
            isHeader: cell.tagName.toLowerCase() === 'th'
          });
        });
        
        if (rowData.length > 0) {
          rows.push(rowData);
        }
      }
    });

    // If we didn't find any headers but have rows, create default headers
    if (headers.length === 0 && rows.length > 0) {
      const firstRowLength = rows[0].length;
      for (let i = 0; i < firstRowLength; i++) {
        headers.push(`Column ${i+1}`);
      }
    }

    setTableData({ rows, headers });
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
              content: correction.corrected
            };
            break;
          }
        }
      });
      
      setTableData({ ...tableData, rows: updatedRows });
    }
  }, [tableData.headers, corrections]);

  // Handle cell click to start editing
  const handleCellClick = (cell) => {
    setEditingCell(cell);
    setEditValue(cell.content);
    
    // Focus on the input after it's rendered
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    }, 0);
  };

  // Save the edited cell value
  const handleSaveEdit = () => {
    if (!editingCell) return;

    try {
      // Update the table data
      const newRows = [...tableData.rows];
      
      // Find the row and cell by row and column indices instead of relying on row - 1
      // This avoids issues with how rows are parsed
      const rowIndex = editingCell.row;
      let cellRow;
      
      // Find the appropriate row
      if (rowIndex < 0 || rowIndex >= newRows.length) {
        // If row index is out of bounds, try using array index directly
        cellRow = newRows.find((_, index) => index === Math.max(0, Math.min(rowIndex, newRows.length - 1)));
      } else {
        // Normal case - the row index is directly usable
        cellRow = newRows[rowIndex];
      }
      
      // If we still don't have a valid row, try finding by matching cell ID pattern
      if (!cellRow) {
        // Extract row number from cell ID (format: "cell-{row}-{col}")
        const idMatch = editingCell.id.match(/cell-(\d+)-(\d+)/);
        if (idMatch && idMatch[1]) {
          const rowNum = parseInt(idMatch[1], 10);
          // Look for row with cells that have this row number in their ID
          for (let i = 0; i < newRows.length; i++) {
            if (newRows[i].some(cell => cell.id.includes(`cell-${rowNum}-`))) {
              cellRow = newRows[i];
              break;
            }
          }
        }
      }
      
      // If we still don't have a valid row, find the cell directly in all rows
      if (!cellRow) {
        for (let i = 0; i < newRows.length; i++) {
          const foundCellIndex = newRows[i].findIndex(c => c.id === editingCell.id);
          if (foundCellIndex !== -1) {
            cellRow = newRows[i];
            break;
          }
        }
      }
      
      // If we found a valid row, proceed with the update
      if (cellRow) {
        const cellIndex = cellRow.findIndex(c => c.id === editingCell.id);
        
        if (cellIndex !== -1) {
          const originalContent = cellRow[cellIndex].content;
          
          // Only save if content was changed
          if (originalContent !== editValue) {
            // Update the cell content
            cellRow[cellIndex] = {
              ...cellRow[cellIndex],
              content: editValue
            };
            
            // Store the correction
            setCorrections({
              ...corrections,
              [editingCell.id]: {
                original: originalContent,
                corrected: editValue,
                timestamp: new Date().toISOString()
              }
            });
            
            // Update hasChanges flag
            setHasChanges(true);
            
            // Save the annotation
            onAnnotationSaved({
              id: editingCell.id,
              originalText: originalContent,
              correctedText: editValue,
              position: {
                row: editingCell.row,
                col: editingCell.col
              },
              timestamp: new Date().toISOString()
            });
            
            console.log('Cell correction saved');
          }
        } else {
          console.error('Could not find cell with ID:', editingCell.id);
          console.error('Error saving correction: Cell not found');
        }
      } else {
        console.error('Could not find row for cell:', editingCell);
        console.error('Error saving correction: Row not found');
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      console.error('Error saving correction:', error);
    } finally {
      // Always clear editing state
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Handle key press in the edit input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // If shift key is pressed with Enter, allow normal behavior (line break)
      if (e.shiftKey) {
        return; // Let the default behavior occur (new line)
      } else {
        // No shift key, so save the edit
        e.preventDefault();
        handleSaveEdit();
      }
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Generate corrected HTML
  const generateCorrectedHtml = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(tableHtml, 'text/html');
    const table = doc.querySelector('table');
    
    if (!table) {
      console.error('Cannot generate corrected HTML: invalid table structure');
      return '';
    }
    
    // Get all rows from the table
    const allRows = table.querySelectorAll('tr');
    const hasHeaderRow = allRows[0] && allRows[0].querySelector('th');
    
    // Apply corrections to the HTML
    tableData.rows.forEach((row, dataRowIndex) => {
      // Calculate the actual row index in the HTML table
      // If there's a header row, we need to offset by 1
      const htmlRowIndex = hasHeaderRow ? dataRowIndex + 1 : dataRowIndex;
      
      // Make sure the row exists in the HTML
      if (htmlRowIndex < allRows.length) {
        row.forEach((cell) => {
          if (isCellCorrected(cell.id)) {
            const tr = allRows[htmlRowIndex];
            // Use the appropriate selector based on cell type
            const cellSelector = cell.isHeader ? 'th' : 'td';
            const cells = tr.querySelectorAll(cellSelector);
            
            if (cell.col < cells.length) {
              // Update the cell content with the corrected text
              cells[cell.col].textContent = cell.content;
            }
          }
        });
      }
    });
    
    // Return the corrected HTML
    return table.outerHTML;
  };

  // Export HTML directly back to the original file
  const handleExportHtml = () => {
    if (Object.keys(corrections).length === 0) {
      console.log('No corrections to export');
      return;
    }
    
    // Generate HTML with corrected text
    const correctedHtml = generateCorrectedHtml();
    
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
      return generateCorrectedHtml();
    }
  }));

  // Render the table editor
  return (
    <Box className="table-editor" sx={{ p: 0 }}>
      <Box className="annotation-header" sx={{ 
        mb: 1, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1,
        borderBottom: '1px solid #eaeaea'
      }}>
        <Typography variant="subtitle1" sx={{ fontSize: '1rem' }}>
          Editor
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            Click cells to edit. Press Enter to save. Use Shift+Enter for line breaks. Press ESC to cancel.
          </Typography>
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<CodeIcon />}
          onClick={handleExportHtml}
          size="small"
        >
          Save HTML
        </Button>
      </Box>

      <Box className="table-container" sx={{ 
        maxHeight: { xs: 'auto', md: 'calc(100vh - 200px)' },
        overflow: 'auto'
      }}>
        {tableData.rows.length > 0 ? (
          <table className="table-view">
            <thead>
              <tr>
                {tableData.headers.map((header, index) => (
                  <th key={`header-${index}`}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell) => (
                    <td 
                      key={cell.id} 
                      className={`editable-cell ${isCellCorrected(cell.id) ? 'corrected-cell' : ''}`}
                      onClick={() => handleCellClick(cell)}
                    >
                      {editingCell && editingCell.id === cell.id ? (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column'
                        }}>
                          <TextField
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            variant="outlined"
                            size="small"
                            fullWidth
                            autoFocus
                            multiline
                            minRows={2}
                            maxRows={8}
                            sx={{
                              width: '100%',
                              '& .MuiOutlinedInput-root': {
                                padding: '8px',
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                          <Typography variant="caption" sx={{ mt: 0.5, mb: 0.5, fontSize: '0.7rem', color: 'text.secondary' }}>
                            Shift+Enter for new line, Enter to save
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, gap: 1 }}>
                            <Tooltip title="Cancel (ESC)">
                              <IconButton 
                                size="small" 
                                color="secondary"
                                onClick={handleCancelEdit}
                              >
                                <UndoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Save (Enter)">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={handleSaveEdit}
                              >
                                <SaveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      ) : (
                        <Tooltip 
                          title={isCellCorrected(cell.id) ? `Original: ${corrections[cell.id].original}` : "Click to edit"}
                          placement="top"
                        >
                          <Box 
                            sx={{ 
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              minHeight: '20px'
                            }}
                          >
                            {cell.content}
                          </Box>
                        </Tooltip>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
            Loading table data...
          </Typography>
        )}
      </Box>
    </Box>
  );
});

export default TableEditor; 