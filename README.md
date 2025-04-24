# Table Annotation Tool

A web application for annotating and correcting OCR errors in table structures extracted from images. This tool works with HTML tables generated from a table2html model, allowing you to view images alongside the extracted HTML and make corrections to cell contents.

## Features

- Browse and edit table images and their HTML representations
- Side-by-side view of original image and HTML table
- Auto-save corrections when navigating between files
- Keyboard shortcuts for navigation (left/right arrow keys)
- Export corrected HTML

## Running the Application with Docker (Recommended)

### Linux/macOS Users

1. **Using Pre-built Docker Images** (Recommended):
   ```bash
   # Pull pre-built images
   docker pull fioresxcat/table2html-annotation:frontend
   docker pull fioresxcat/table2html-annotation:backend
   
   # Setup using helper script
   ./use_docker_hub_images.sh
   
   # Run the application (after images are pulled)
   ./run.sh --no-build
   ```

2. **Building Images Locally** (If pre-built images don't work):
   ```bash
   # Clone the repository
   git clone https://github.com/fioresxcat/table2html-annotation.git
   cd table2html-annotation
   
   # Run the application (this will build images locally)
   ./run.sh
   ```

### Windows Users

1. **Using Pre-built Docker Images** (Recommended):
   ```cmd
   :: Pull pre-built images
   docker pull fioresxcat/table2html-annotation:frontend
   docker pull fioresxcat/table2html-annotation:backend
   
   :: Setup using helper script
   use_docker_hub_images.bat
   
   :: Run the application (after images are pulled)
   run.bat --no-build
   ```

2. **Building Images Locally** (If pre-built images don't work):
   ```cmd
   :: Clone the repository
   git clone https://github.com/fioresxcat/table2html-annotation.git
   cd table2html-annotation
   
   :: Run the application (this will build images locally)
   run.bat
   ```

When using the application with Docker:
- You'll be prompted to enter the path to your images directory
- The application will be available at http://localhost
- Use the `--detach` or `-d` flag to run in the background
- Use the `--help` flag to see all available options

## Manual Setup (Without Docker)

If you prefer not to use Docker, you can set up the application manually:

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd file_server

# Install dependencies
pip install -r requirements.txt

# Start the server
python run.py --images-dir /path/to/your/images
```

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd table-annotation-app

# Install dependencies
npm install

# Start the development server
npm start
```

The application will be available at http://localhost:3000

## Usage Tips

- Make sure your images and corresponding HTML files have matching filenames
- Edit any cell by clicking on it and pressing Enter to save changes
- Use keyboard arrow keys (← and →) to navigate between images

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