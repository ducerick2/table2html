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

### 1. Using Docker (Recommended)

The easiest way to get started is using Docker:

```bash
# Set up the environment and start the application
./run.sh
```

The script will prompt you for the location of your images directory and start the application.

#### Additional options for run.sh:

```bash
# Skip rebuilding Docker images (uses existing images)
./run.sh --no-build

# Run containers in detached mode (background)
./run.sh --detach
# or
./run.sh -d

# Display help information
./run.sh --help
```

#### Using Pre-built Docker Images

If you or your team have pushed pre-built Docker images to Docker Hub:

1. Pull the images from Docker Hub:
   ```bash
   docker pull your-username/table-annotation-frontend:latest
   docker pull your-username/table-annotation-backend:latest
   ```

2. Update your docker-compose.yml to use these images instead of building locally:
   ```yaml
   services:
     frontend:
       image: your-username/table-annotation-frontend:latest
       # ...other settings remain the same
     
     backend:
       image: your-username/table-annotation-backend:latest
       # ...other settings remain the same
   ```

3. Run the application with the `--no-build` flag:
   ```bash
   ./run.sh --no-build
   ```

This approach allows team members to use the same pre-built images without having to rebuild them locally.

### 2. Setup the Python Backend Manually

```bash
# Install required Python packages
pip install -r requirements.txt

# Start the server
python run.py --images-dir /path/to/your/images
```

### 3. Setup the React Frontend

```bash
# In another terminal, navigate to the project directory
cd table-annotation-app

# Install dependencies
npm install

# Start the development server
npm start
```

### 4. Using the Application

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

## Docker Hub Integration

### Pushing Images to Docker Hub

To share your Docker images with team members via Docker Hub:

1. **Login to Docker Hub**
   ```bash
   docker login
   ```

2. **Tag your local images with your Docker Hub repository name**
   ```bash
   # Tag the frontend image
   docker-compose build frontend
   docker tag table-annotation_frontend fioresxcat/table2html-annotation:frontend

   # Tag the backend image
   docker-compose build backend
   docker tag table-annotation_backend fioresxcat/table2html-annotation:backend
   ```

3. **Push the images to Docker Hub**
   ```bash
   # Push frontend image
   docker push fioresxcat/table2html-annotation:frontend

   # Push backend image
   docker push fioresxcat/table2html-annotation:backend
   ```

### Pulling Images from Docker Hub

Team members can pull and use these images without rebuilding:

1. **Pull the images**
   ```bash
   docker pull fioresxcat/table2html-annotation:frontend
   docker pull fioresxcat/table2html-annotation:backend
   ```

2. **Update docker-compose.yml** to use the pulled images:
   ```yaml
   services:
     frontend:
       image: fioresxcat/table2html-annotation:frontend
       # Remove the build section
       ports:
         - "80:80"
       # Other settings remain the same
     
     backend:
       image: fioresxcat/table2html-annotation:backend
       # Remove the build section
       # Other settings remain the same
   ```

3. **Run with --no-build flag**
   ```bash
   ./run.sh --no-build
   ```

## Windows Support

For Windows users, we provide equivalent batch scripts for all operations.

### Using the Application on Windows

1. **Run the application**
   ```cmd
   run.bat
   ```

2. **Additional options for run.bat:**
   ```cmd
   REM Skip rebuilding Docker images (uses existing images)
   run.bat --no-build

   REM Run containers in detached mode (background)
   run.bat --detach
   REM or
   run.bat -d

   REM Display help information
   run.bat --help
   ```

### Working with Docker Hub on Windows

#### Pushing Images to Docker Hub

To share your Docker images with team members via Docker Hub on Windows:

1. **Run the provided script**
   ```cmd
   push_to_docker_hub.bat
   ```

   This script will:
   - Check your Docker Hub login status
   - Build the Docker images
   - Tag them with your repository name
   - Push them to Docker Hub

#### Using Pre-built Images on Windows

Team members on Windows can use pre-built images from Docker Hub:

1. **Run the provided script**
   ```cmd
   use_docker_hub_images.bat
   ```

   This script will:
   - Pull the latest images from Docker Hub
   - Configure docker-compose.yml to use these images
   - Provide instructions for running the application

2. **Run the application with pre-built images**
   ```cmd
   run.bat --no-build
   ```

### Windows Path Format Notes

When using this application on Windows, remember:

- Use Windows-style paths: `C:\path\to\images` (not `/path/to/images`)
- Avoid paths with spaces or use quotation marks: `"C:\My Images"`
- If you're using WSL, you may need to adjust volume paths in docker-compose.yml 