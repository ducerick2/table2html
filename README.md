# Table Annotation Tool

A web-based annotation tool for Image2Text tasks that handles both regular text and HTML tables. This tool allows users to view images alongside their corresponding text content, edit text, and annotate tables in a user-friendly interface.


## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- pip (Python package installer)

## Installation

### Backend Setup

1. Install Python dependencies:
   ```bash
   pip install flask flask-cors
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd table-annotation-app
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Set up the images directory:
   - Create a directory for your images and text files
   - The directory should contain:
     - Image files (.jpg, .jpeg, .png)
     - Corresponding text files with the same base name (.txt)


## Running the Application

1. Start the backend server:
   ```bash
   cd file_server
   python run.py --images-dir /path/to/your/images [--port 5000]
   ```
   The server will start on http://localhost:5000 (or the specified port)
   
   Arguments:
   - `--images-dir`: Path to your images directory (required)
   - `--port`: Port number to run the server on (optional, default: 5000)

2. In a new terminal, start the frontend development server:
   ```bash
   cd table-annotation-app
   npm start
   ```
   The application will open in your default browser at http://localhost:3000

## Usage

1. **File Browser**
   - Browse through available files
   - Click on a file to open it in the editor
   - Use pagination to navigate through files
   - Click "Refresh" to update the file list

2. **Image Viewing**
   - View the current image on the left side
   - Zoom and pan functionality available

3. **Text Editing**
   - Edit text content in the top right editor
   - Changes are auto-saved
   - Tables are marked with <TABLE></TABLE> tags

4. **Table Editing**
   - Click on table cells to edit content
   - Navigate between multiple tables using the table navigator
   - Changes are auto-saved

5. **File Navigation**
   - Use "Previous" and "Next" buttons to navigate between files
   - Click "Back to Files" to return to the file browser
   - Use "Exclude" to move files to the excluded directory

## File Format

The application expects:
- Image files in common formats (jpg, jpeg, png)
- Text files (.txt) containing:
  - Regular text
  - HTML tables marked with <table> tags
  - The application will automatically parse and separate tables from text

## Notes

- Auto-save is enabled by default
- External file modifications are detected
- The excluded files are moved to a subdirectory named 'excluded' in your images directory
- The application maintains file order and pagination state when navigating

## Troubleshooting

1. If the backend fails to start:
   - Check if the IMAGES_DIR environment variable is set correctly
   - Ensure the Python virtual environment is activated
   - Verify port 5000 is not in use

2. If the frontend fails to connect:
   - Verify the backend is running
   - Check the REACT_APP_API_BASE_URL in .env
   - Ensure there are no CORS issues

3. If files are not displaying:
   - Verify the images directory contains valid files
   - Check file permissions
   - Ensure file names match between images and text files 