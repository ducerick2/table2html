# Table Annotation Tool

A web application for annotating and correcting OCR errors in table structures extracted from images. This tool is designed to work with your existing table2html model outputs.

## Features

- Browse and annotate thousands of table images
- View and edit table cells with incorrect OCR text
- Automatically save corrections as annotations
- Export annotations for later use
- Visual indicators for corrected cells
- Modern, responsive UI with Material Design

## Technology Stack

- React.js for the frontend UI
- Python Flask for the backend server
- RESTful API for communication

## Requirements

- Python 3.6 or higher
- Node.js 14 or higher
- npm or yarn package manager

## Getting Started

### 1. Setup the Python Backend

```bash
# Install required Python packages
pip install -r requirements.txt

# Start the server
python run.py --images-dir /path/to/your/images
```

### 2. Setup the React Frontend

```bash
# In another terminal, navigate to the project directory
cd table-annotation-app

# Install dependencies
npm install

# Start the development server
npm start
```

### 3. Using the Application

1. Open your browser to `http://localhost:3000`
2. Browse through the table images
3. Edit any cell by clicking on it
4. Press Enter to save your changes
5. Use the navigation buttons to move between files
6. Export corrected HTML or annotations as needed

## Usage Tips

- For best performance, make sure your images and HTML files have matching filenames
- Large directories will be paginated for better performance
- Annotations are saved automatically when you edit a cell

## File Structure

- Images and HTML files should be in the same directory
- HTML files should have the same name as the image (e.g., image1.jpg → image1.html)
- Annotations will be saved as JSON files (e.g., image1_annotations.json)
- Corrected HTML will be saved with a "_corrected" suffix (e.g., image1_corrected.html)

## Handling Large Datasets

This application is optimized to handle thousands of images through:
- Server-side pagination
- Efficient file indexing
- Loading only what's needed, when needed 