# app.py
import os
import json
import base64
import shutil
import re
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import mimetypes
import time
import pdb
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
IMAGES_DIR = os.environ.get('IMAGES_DIR', '/path/to/your/images')  # Set this to your images directory
EXCLUDED_DIR = os.environ.get('EXCLUDED_DIR', os.path.join(IMAGES_DIR, 'excluded'))  # Default to a subdirectory of images
PORT = int(os.environ.get('PORT', 5000))

# File index cache
file_index = None
index_last_updated = 0
INDEX_CACHE_DURATION = 300  # increased to 5 minutes
file_stats_cache = {}  # Cache for file stats

def sanitize_table_html(table_html):
    """
    Clean up malformed table HTML by handling multiple opening tags
    """
    # Remove bare <table> if followed by <table border="1">
    cleaned = re.sub(r'<table>\s*<table\s+[^>]*>', r'<table border="1">', table_html)
    
    # Count opening and closing tags
    open_tags = len(re.findall(r'<table[^>]*>', cleaned))
    close_tags = len(re.findall(r'</table>', cleaned))
    
    # Add missing closing tags
    if open_tags > close_tags:
        cleaned += '</table>' * (open_tags - close_tags)
    
    return cleaned

def parse_tables_from_text(text):
    """
    Parse text content and extract tables, replacing them with <TABLE></TABLE> markers
    Returns:
    - outside_text: Text with tables replaced by markers
    - tables: List of table HTML strings
    """
    # Regular expression to find table tags and their content
    table_pattern = re.compile(r'<table[^>]*>.*?</table>', re.DOTALL | re.IGNORECASE)
    
    # Find all tables
    tables = table_pattern.findall(text)
    
    # Clean up each table
    cleaned_tables = [sanitize_table_html(table) for table in tables]
    
    # Replace each table with a marker
    outside_text = text
    for table in tables:
        outside_text = outside_text.replace(table, '<TABLE></TABLE>')
    
    return {
        'outside_text': outside_text,
        'tables': cleaned_tables
    }

def read_text_file(file_path):
    """Read and parse a text file containing tables"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return parse_tables_from_text(content)
    except Exception as e:
        print(f"Error reading text file: {str(e)}")
        return None

# Create the excluded directory if it doesn't exist
def ensure_excluded_dir():
    if not os.path.exists(EXCLUDED_DIR):
        os.makedirs(EXCLUDED_DIR, exist_ok=True)
        print(f"Created excluded directory: {EXCLUDED_DIR}")

def get_cached_file_stats(file_path):
    """Get file stats with caching to reduce file system calls"""
    global file_stats_cache
    
    current_time = time.time()
    if file_path in file_stats_cache:
        stats, timestamp = file_stats_cache[file_path]
        if current_time - timestamp < INDEX_CACHE_DURATION:
            return stats
    
    try:
        stats = os.stat(file_path)
        file_stats_cache[file_path] = (stats, current_time)
        return stats
    except:
        return None

def get_file_content(file_path):
    """Read current content directly from disk with caching"""
    global file_stats_cache
    
    # Check if we have cached stats and if file was modified
    current_time = time.time()
    if file_path in file_stats_cache:
        stats, timestamp = file_stats_cache[file_path]
        if current_time - timestamp < INDEX_CACHE_DURATION:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    return content
            except Exception:
                pass
    
    # If cache miss or error, update cache and try again
    try:
        stats = os.stat(file_path)
        file_stats_cache[file_path] = (stats, current_time)
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {str(e)}")
        return None

def get_parsed_content(file_path):
    """Read and parse current content from disk"""
    content = get_file_content(file_path)
    if content is not None:
        return parse_tables_from_text(content)
    return None

def build_file_index():
    """Build or refresh the file index"""
    global file_index, index_last_updated
    
    # Only rebuild if it's been more than cache duration since last update
    now = time.time()
    if file_index is not None and (now - index_last_updated < INDEX_CACHE_DURATION):
        return file_index
    
    print("Building file index...")
    index = []
    
    # Make sure the directory exists
    if not os.path.exists(IMAGES_DIR):
        print(f"Warning: Images directory not found: {IMAGES_DIR}")
        return []
    
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff']
    
    # Get all files at once to reduce directory access
    try:
        all_files = set(os.listdir(IMAGES_DIR))
    except Exception as e:
        print(f"Error listing directory: {str(e)}")
        return []
    
    # Process image files
    image_files = [f for f in all_files if any(f.lower().endswith(ext) for ext in image_extensions)]
    
    for filename in sorted(image_files):
        file_path = os.path.join(IMAGES_DIR, filename)
        if not os.path.isfile(file_path):
            continue
            
        # Get base name without extension
        base_name = os.path.splitext(filename)[0]
        txt_file = f"{base_name}.txt"
        annotation_file = f"{base_name}_annotations.json"
        
        # Use cached stats
        stats = get_cached_file_stats(file_path)
        if not stats:
            continue
        
        index.append({
            "id": base_name,
            "name": filename,
            "path": file_path,
            "txtPath": os.path.join(IMAGES_DIR, txt_file) if txt_file in all_files else None,
            "hasTxt": txt_file in all_files,
            "annotationPath": os.path.join(IMAGES_DIR, annotation_file) if annotation_file in all_files else None,
            "hasAnnotation": annotation_file in all_files,
            "size": stats.st_size,
            "lastModified": stats.st_mtime
        })
    
    file_index = index
    index_last_updated = now
    return index

def get_mime_type(file_path):
    """Get the MIME type of a file"""
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type or 'application/octet-stream'

@app.route('/api/files', methods=['GET'])
def list_files():
    """Get list of files (paginated)"""
    try:
        # Parse query parameters
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=50, type=int)
        
        # Get file index
        index = build_file_index()
        total_files = len(index)
        total_pages = (total_files + limit - 1) // limit  # Ceiling division
        
        # Calculate start and end indices
        start_index = (page - 1) * limit
        end_index = min(start_index + limit, total_files)
        
        # Get paginated files
        paginated_files = index[start_index:end_index]
        
        # Return only necessary information for listing
        files_data = [{
            "id": file["id"],
            "name": file["name"],
            "hasTxt": file["hasTxt"],
            "hasAnnotation": file["hasAnnotation"],
            "lastModified": file["lastModified"]
        } for file in paginated_files]
        
        return jsonify({
            "success": True,
            "page": page,
            "limit": limit,
            "totalFiles": total_files,
            "totalPages": total_pages,
            "files": files_data
        })
    except Exception as e:
        print(f"Error listing files: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<file_id>', methods=['GET'])
def get_file_details(file_id):
    """Get file details by ID"""
    try:
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info:
            return jsonify({"error": "File not found"}), 404
        
        # Calculate pagination info
        total_files = len(index)
        file_index = next(i for i, f in enumerate(index) if f["id"] == file_id)
        page_size = int(request.args.get('page_size', 50))  # Default page size
        current_page = (file_index // page_size) + 1
        file_index_in_page = file_index % page_size
        
        # Add pagination info to response
        response = {
            "success": True,
            "file": file_info,
            "pagination": {
                "totalFiles": total_files,
                "currentPage": current_page,
                "pageSize": page_size,
                "fileIndex": file_index + 1,  # 1-based index for display
                "fileIndexInPage": file_index_in_page + 1,  # 1-based index for display
            }
        }
        
        return jsonify(response)
    except Exception as e:
        print(f"Error getting file details: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<file_id>/image', methods=['GET'])
def get_image(file_id):
    """Get image file"""
    try:
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info:
            return jsonify({"error": "File not found"}), 404
        
        # Return the image file
        return send_file(
            file_info["path"],
            mimetype=get_mime_type(file_info["path"]),
            as_attachment=False
        )
    except Exception as e:
        print(f"Error serving image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<file_id>/base64image', methods=['GET'])
def get_base64_image(file_id):
    """Get image as base64 string"""
    try:
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info:
            return jsonify({"error": "File not found"}), 404
        
        # Read image file and convert to base64
        with open(file_info["path"], 'rb') as img_file:
            encoded_image = base64.b64encode(img_file.read()).decode('utf-8')
        
        mime_type = get_mime_type(file_info["path"])
        data_url = f"data:{mime_type};base64,{encoded_image}"
        
        return jsonify({
            "success": True,
            "imageData": data_url
        })
    except Exception as e:
        print(f"Error serving base64 image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<file_id>/txt', methods=['GET'])
def get_txt(file_id):
    """Get text content"""
    try:
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info or not file_info["hasTxt"]:
            return jsonify({"error": "Text file not found"}), 404
        
        # Read text file
        with open(file_info["txtPath"], 'r', encoding='utf-8') as txt_file:
            txt_content = txt_file.read()
        
        return jsonify({
            "success": True,
            "text": txt_content
        })
    except Exception as e:
        print(f"Error serving text: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<file_id>/annotations', methods=['GET'])
def get_annotations(file_id):
    """Get annotations"""
    try:
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info:
            return jsonify({"error": "File not found"}), 404
        
        # If no annotations exist yet, return empty
        if not file_info["hasAnnotation"]:
            return jsonify({
                "success": True,
                "annotations": {
                    "tableId": file_id,
                    "timestamp": datetime.now().isoformat(),
                    "corrections": []
                }
            })
        
        # Read annotation file
        with open(file_info["annotationPath"], 'r', encoding='utf-8') as annotation_file:
            annotations = json.load(annotation_file)
        
        return jsonify({
            "success": True,
            "annotations": annotations
        })
    except Exception as e:
        print(f"Error serving annotations: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<file_id>/annotations', methods=['POST'])
def save_annotations(file_id):
    """Save annotations"""
    try:
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info:
            return jsonify({"error": "File not found"}), 404
        
        # Get annotation data from request
        annotation_data = request.json
        
        # Set the annotation path
        annotation_path = file_info["annotationPath"] or os.path.join(IMAGES_DIR, f"{file_id}_annotations.json")
        
        # Save annotation to file
        with open(annotation_path, 'w', encoding='utf-8') as annotation_file:
            json.dump(annotation_data, annotation_file, indent=2)
        
        # Update file index to show this file now has annotations
        file_info["hasAnnotation"] = True
        file_info["annotationPath"] = annotation_path
        
        return jsonify({
            "success": True,
            "message": "Annotations saved successfully"
        })
    except Exception as e:
        print(f"Error saving annotations: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<file_id>/export-txt', methods=['POST'])
def export_txt(file_id):
    """Export corrected text"""
    try:
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info:
            return jsonify({"error": "File not found"}), 404
        
        # Get text content from request
        txt_content = request.json.get("text")
        txt_content = "\n".join(re.sub(r'\s+', ' ', line.strip()) for line in txt_content.splitlines() if line.strip())
        if not txt_content:
            return jsonify({"error": "No text content provided"}), 400
        
        # Set the export path
        export_path = os.path.join(IMAGES_DIR, f"{file_id}_corrected.txt")
        
        # Save text to file
        with open(export_path, 'w', encoding='utf-8') as txt_file:
            txt_file.write(txt_content)
        
        return jsonify({
            "success": True,
            "message": "Text exported successfully",
            "path": export_path
        })
    except Exception as e:
        print(f"Error exporting text: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/export-all-annotations', methods=['GET'])
def export_all_annotations():
    """Export all annotations"""
    try:
        index = build_file_index()
        
        # Filter files that have annotations
        annotated_files = [file for file in index if file["hasAnnotation"]]
        
        if not annotated_files:
            return jsonify({"error": "No annotated files found"}), 404
        
        # Collect all annotations
        annotations = []
        for file in annotated_files:
            try:
                with open(file["annotationPath"], 'r', encoding='utf-8') as annotation_file:
                    annotation_data = json.load(annotation_file)
                    annotations.append(annotation_data)
            except Exception as e:
                print(f"Error reading annotation file {file['annotationPath']}: {str(e)}")
        
        # Create export data
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        export_data = {
            "timestamp": datetime.now().isoformat(),
            "files": annotations
        }
        
        # Create export file
        export_filename = f"annotations_export_{timestamp}.json"
        export_path = os.path.join(IMAGES_DIR, export_filename)
        
        with open(export_path, 'w', encoding='utf-8') as export_file:
            json.dump(export_data, export_file, indent=2)
        
        # Send the file to the client
        return send_file(
            export_path,
            mimetype='application/json',
            as_attachment=True,
            download_name=export_filename
        )
    except Exception as e:
        print(f"Error exporting all annotations: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get server status"""
    return jsonify({
        "status": "running",
        "imagesDirectory": IMAGES_DIR,
        "fileCount": len(build_file_index()),
        "serverTime": datetime.now().isoformat()
    })

# The only endpoint we really need for HTML editing is:
@app.route('/api/files/<file_id>/update-txt', methods=['POST'])
def update_txt(file_id):
    """Update the original text file"""
    try:
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info:
            return jsonify({"error": "File not found"}), 404
        
        # Get text content from request
        txt_content = request.json.get("text")
        txt_content = "\n".join(re.sub(r'\s+', ' ', line.strip()) for line in txt_content.splitlines() if line.strip())
        if not txt_content:
            return jsonify({"error": "No text content provided"}), 400
        
        # Check if text file exists
        txt_path = file_info.get("txtPath")
        if not txt_path:
            # Create a new text file if it doesn't exist
            base_name = file_id
            txt_path = os.path.join(IMAGES_DIR, f"{base_name}.txt")
        
        # Save text to the file
        with open(txt_path, 'w', encoding='utf-8') as txt_file:
            txt_file.write(txt_content)
        
        # Update the file index
        file_info["hasTxt"] = True
        file_info["txtPath"] = txt_path
        
        return jsonify({
            "success": True,
            "message": "Text file updated successfully",
            "path": txt_path
        })
    except Exception as e:
        print(f"Error updating text file: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<file_id>/exclude', methods=['POST'])
def exclude_file(file_id):
    """Move a file and its text to the excluded directory"""
    try:
        # Make sure the excluded directory exists
        ensure_excluded_dir()
        
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info:
            return jsonify({"error": "File not found"}), 404
        
        image_path = file_info["path"]
        image_filename = os.path.basename(image_path)
        
        # Get text path if it exists
        txt_path = file_info.get("txtPath")
        txt_filename = os.path.basename(txt_path) if txt_path else None
        
        # Get annotation path if it exists
        annotation_path = file_info.get("annotationPath")
        annotation_filename = os.path.basename(annotation_path) if annotation_path else None
        
        # Move image file
        excluded_image_path = os.path.join(EXCLUDED_DIR, image_filename)
        shutil.move(image_path, excluded_image_path)
        
        moved_files = [image_filename]
        
        # Move text file if it exists
        if txt_path and os.path.exists(txt_path):
            excluded_txt_path = os.path.join(EXCLUDED_DIR, txt_filename)
            shutil.move(txt_path, excluded_txt_path)
            moved_files.append(txt_filename)
        
        # Move annotation file if it exists
        if annotation_path and os.path.exists(annotation_path):
            excluded_annotation_path = os.path.join(EXCLUDED_DIR, annotation_filename)
            shutil.move(annotation_path, excluded_annotation_path)
            moved_files.append(annotation_filename)
        
        # Force rebuild of the file index
        global file_index, index_last_updated
        file_index = None
        index_last_updated = 0
        
        return jsonify({
            "success": True,
            "message": f"File moved to excluded directory: {EXCLUDED_DIR}",
            "excludedDir": EXCLUDED_DIR,
            "movedFiles": moved_files
        })
    except Exception as e:
        print(f"Error excluding file: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<file_id>/parsed-txt', methods=['GET'])
def get_parsed_txt(file_id):
    """Get parsed text content"""
    try:
        # Get latest file info
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info:
            return jsonify({"error": "File not found"}), 404
        
        # Check if text file exists
        txt_path = file_info.get("txtPath")
        if not txt_path or not os.path.exists(txt_path):
            return jsonify({"error": "Text file not found"}), 404
        
        # Read and parse the current content
        parsed = get_parsed_content(txt_path)
        if not parsed:
            return jsonify({"error": "Error parsing text file"}), 500
        
        return jsonify({
            "success": True,
            "outside_text": parsed["outside_text"],
            "tables": parsed["tables"]
        })
    except Exception as e:
        print(f"Error getting parsed text: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/<file_id>/update-parsed-txt', methods=['POST'])
def update_parsed_txt(file_id):
    """Update text file from parsed content"""
    try:
        # Get latest file info
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info:
            return jsonify({"error": "File not found"}), 404
        
        # Get content from request
        data = request.json
        outside_text = data.get("outside_text")
        tables = data.get("tables", [])
        
        if outside_text is None:
            return jsonify({"error": "No outside text provided"}), 400
        
        # Check if text file exists or create new one
        txt_path = file_info.get("txtPath")
        if not txt_path:
            base_name = file_id
            txt_path = os.path.join(IMAGES_DIR, f"{base_name}.txt")
        
        # # Count the number of table markers in the text
        # marker_count = outside_text.count('<TABLE></TABLE>')
        
        # # Verify we have the right number of tables
        # if marker_count != len(tables):
        #     return jsonify({
        #         "success": False,
        #         "error": f"Mismatch between number of table markers ({marker_count}) and tables provided ({len(tables)})"
        #     }), 400
        
        # # Reconstruct the full text by inserting tables back in their positions
        full_text = outside_text
        # for table in tables:
        #     # Replace only the first occurrence of the marker
        #     # This ensures tables are inserted in the correct order
        #     full_text = full_text.replace('<TABLE></TABLE>', table, 1)

        full_text = "\n".join(re.sub(r'\s+', ' ', line.strip()) for line in full_text.splitlines() if line.strip())
        
        # Save text to the file
        with open(txt_path, 'w', encoding='utf-8') as txt_file:
            txt_file.write(full_text)
        
        # Force index refresh to update metadata
        force_index_refresh()
        
        return jsonify({
            "success": True,
            "message": "Text file updated successfully",
            "path": txt_path
        })
    except Exception as e:
        print(f"Error updating text file: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_file_timestamp(file_path):
    """Get the last modification time of a file"""
    try:
        return os.path.getmtime(file_path)
    except:
        return 0

def is_file_modified(current_time, last_read_time, tolerance_seconds=1):
    """
    Check if a file has been modified, with a tolerance window to account for
    small timestamp differences
    """
    return current_time - last_read_time > tolerance_seconds

def force_index_refresh():
    """Force a refresh of the file index"""
    global file_index, index_last_updated
    file_index = None
    index_last_updated = 0

if __name__ == '__main__':
    # Initialize mimetypes
    mimetypes.init()
    
    # Create excluded directory if it doesn't exist
    ensure_excluded_dir()
    
    # Start the server
    print(f"Starting server on port {PORT}")
    print(f"Serving images from {IMAGES_DIR}")
    print(f"Excluded files will be moved to {EXCLUDED_DIR}")
    app.run(host='0.0.0.0', port=PORT, debug=True)