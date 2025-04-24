# app.py
import os
import json
import base64
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import mimetypes
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
IMAGES_DIR = os.environ.get('IMAGES_DIR', '/path/to/your/images')  # Set this to your images directory
PORT = int(os.environ.get('PORT', 5000))

# File index cache
file_index = None
index_last_updated = 0
INDEX_CACHE_DURATION = 300  # seconds (5 minutes)

def build_file_index():
    """Build or refresh the file index"""
    global file_index, index_last_updated
    
    # Only rebuild if it's been more than 5 minutes since last update
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
    
    for filename in os.listdir(IMAGES_DIR):
        # Only process image files
        if not any(filename.lower().endswith(ext) for ext in image_extensions):
            continue
        
        file_path = os.path.join(IMAGES_DIR, filename)
        if not os.path.isfile(file_path):
            continue
            
        # Get base name without extension
        base_name = os.path.splitext(filename)[0]
        html_file = f"{base_name}.html"
        html_path = os.path.join(IMAGES_DIR, html_file)
        
        annotation_file = f"{base_name}_annotations.json"
        annotation_path = os.path.join(IMAGES_DIR, annotation_file)
        
        # Get file stats
        stats = os.stat(file_path)
        
        index.append({
            "id": base_name,
            "name": filename,
            "path": file_path,
            "htmlPath": html_path if os.path.exists(html_path) else None,
            "hasHtml": os.path.exists(html_path),
            "annotationPath": annotation_path if os.path.exists(annotation_path) else None,
            "hasAnnotation": os.path.exists(annotation_path),
            "size": stats.st_size,
            "lastModified": stats.st_mtime
        })
    
    # Sort by name
    index.sort(key=lambda x: x["name"])
    
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
            "hasHtml": file["hasHtml"],
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
        
        return jsonify({
            "success": True,
            "file": file_info
        })
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

@app.route('/api/files/<file_id>/html', methods=['GET'])
def get_html(file_id):
    """Get HTML content"""
    try:
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info or not file_info["hasHtml"]:
            return jsonify({"error": "HTML file not found"}), 404
        
        # Read HTML file
        with open(file_info["htmlPath"], 'r', encoding='utf-8') as html_file:
            html_content = html_file.read()
        
        return jsonify({
            "success": True,
            "html": html_content
        })
    except Exception as e:
        print(f"Error serving HTML: {str(e)}")
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

@app.route('/api/files/<file_id>/export-html', methods=['POST'])
def export_html(file_id):
    """Export corrected HTML"""
    try:
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info:
            return jsonify({"error": "File not found"}), 404
        
        # Get HTML content from request
        html_content = request.json.get("html")
        if not html_content:
            return jsonify({"error": "No HTML content provided"}), 400
        
        # Set the export path
        export_path = os.path.join(IMAGES_DIR, f"{file_id}_corrected.html")
        
        # Save HTML to file
        with open(export_path, 'w', encoding='utf-8') as html_file:
            html_file.write(html_content)
        
        return jsonify({
            "success": True,
            "message": "HTML exported successfully",
            "path": export_path
        })
    except Exception as e:
        print(f"Error exporting HTML: {str(e)}")
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
@app.route('/api/files/<file_id>/update-html', methods=['POST'])
def update_html(file_id):
    """Update the original HTML file"""
    try:
        index = build_file_index()
        
        # Find file in index
        file_info = next((file for file in index if file["id"] == file_id), None)
        if not file_info:
            return jsonify({"error": "File not found"}), 404
        
        # Get HTML content from request
        html_content = request.json.get("html")
        if not html_content:
            return jsonify({"error": "No HTML content provided"}), 400
        
        # Check if HTML file exists
        html_path = file_info.get("htmlPath")
        if not html_path:
            # Create a new HTML file if it doesn't exist
            base_name = file_id
            html_path = os.path.join(IMAGES_DIR, f"{base_name}.html")
        
        # Save HTML to the file
        with open(html_path, 'w', encoding='utf-8') as html_file:
            html_file.write(html_content)
        
        # Update the file index
        file_info["hasHtml"] = True
        file_info["htmlPath"] = html_path
        
        return jsonify({
            "success": True,
            "message": "HTML file updated successfully",
            "path": html_path
        })
    except Exception as e:
        print(f"Error updating HTML file: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

if __name__ == '__main__':
    # Initialize mimetypes
    mimetypes.init()
    
    # Start the server
    print(f"Starting server on port {PORT}")
    print(f"Serving images from {IMAGES_DIR}")
    app.run(host='0.0.0.0', port=PORT, debug=True)