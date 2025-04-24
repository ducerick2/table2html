// This is a simple Express server to demonstrate how to create an API
// that integrates with your table2html model. In a real-world scenario,
// you would replace the mock implementation with actual calls to your model.

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/image\/(png|jpg|jpeg|gif|bmp|tiff)/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Create directory for annotations if it doesn't exist
const annotationsDir = path.join(__dirname, 'annotations');
if (!fs.existsSync(annotationsDir)) {
  fs.mkdirSync(annotationsDir);
}

// API Routes
app.post('/api/process-table', upload.single('image'), (req, res) => {
  try {
    const imageFile = req.file;
    if (!imageFile) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // In a real implementation, you would call your table2html model here
    // For now, we'll just return a mock HTML response
    
    // Simulating model processing time
    setTimeout(() => {
      const tableId = uuidv4();
      const mockHtml = `
        <table>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total</th>
          </tr>
          <tr>
            <td>Widget A</td>
            <td>$10.99</td>
            <td>5</td>
            <td>$54.95</td>
          </tr>
          <tr>
            <td>Gadget B</td>
            <td>$24.99</td>
            <td>2</td>
            <td>$49.98</td>
          </tr>
          <tr>
            <td>Tool C</td>
            <td>$15.50</td>
            <td>3</td>
            <td>$46.50</td>
          </tr>
        </table>
      `;

      res.json({
        success: true,
        tableId,
        tableHtml: mockHtml,
        message: 'Table processed successfully'
      });
    }, 1500);
  } catch (error) {
    console.error('Error processing table image:', error);
    res.status(500).json({ error: 'Error processing image', details: error.message });
  }
});

app.post('/api/save-annotations', (req, res) => {
  try {
    const { tableId, annotations } = req.body;
    
    if (!tableId || !annotations) {
      return res.status(400).json({ error: 'Missing tableId or annotations' });
    }
    
    // Save annotations to a file (in a real app, you'd use a database)
    const filename = path.join(annotationsDir, `${tableId}.json`);
    fs.writeFileSync(filename, JSON.stringify({
      tableId,
      annotations,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    res.json({
      success: true,
      message: 'Annotations saved successfully'
    });
  } catch (error) {
    console.error('Error saving annotations:', error);
    res.status(500).json({ error: 'Error saving annotations', details: error.message });
  }
});

app.get('/api/annotated-tables', (req, res) => {
  try {
    const files = fs.readdirSync(annotationsDir);
    const tables = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const content = fs.readFileSync(path.join(annotationsDir, file), 'utf8');
        const data = JSON.parse(content);
        return {
          tableId: data.tableId,
          timestamp: data.timestamp,
          annotationCount: data.annotations.length
        };
      });
    
    res.json({
      success: true,
      tables
    });
  } catch (error) {
    console.error('Error fetching annotated tables:', error);
    res.status(500).json({ error: 'Error fetching tables', details: error.message });
  }
});

app.get('/api/annotated-tables/:tableId', (req, res) => {
  try {
    const { tableId } = req.params;
    const filename = path.join(annotationsDir, `${tableId}.json`);
    
    if (!fs.existsSync(filename)) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    const content = fs.readFileSync(filename, 'utf8');
    const data = JSON.parse(content);
    
    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error(`Error fetching annotated table ${req.params.tableId}:`, error);
    res.status(500).json({ error: 'Error fetching table', details: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API endpoint: http://localhost:${port}/api`);
}); 