#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess
import webbrowser
import time

def main():
    parser = argparse.ArgumentParser(description='Run the Table Annotation Tool')
    parser.add_argument('--images-dir', dest='images_dir', required=True,
                        help='Directory containing table images and HTML files')
    parser.add_argument('--port', dest='port', type=int, default=5000,
                        help='Port for the Python server (default: 5000)')
    parser.add_argument('--no-browser', dest='no_browser', action='store_true',
                        help='Do not open browser automatically')
    
    args = parser.parse_args()
    
    # Check if images directory exists
    if not os.path.isdir(args.images_dir):
        print(f"Error: Images directory not found: {args.images_dir}")
        return 1
    
    # Set environment variables
    os.environ['IMAGES_DIR'] = os.path.abspath(args.images_dir)
    os.environ['PORT'] = str(args.port)
    
    print(f"Starting server with images from: {args.images_dir}")
    print(f"Server will run on: http://localhost:{args.port}")
    
    # Start the Flask server
    server_process = subprocess.Popen([
        sys.executable, 'app.py'
    ])
    
    # Wait a bit for the server to start
    time.sleep(2)
    
    # Open browser if requested
    if not args.no_browser:
        webbrowser.open(f"http://localhost:3000")
        print("Browser opened to the application")
    
    print("\nPress Ctrl+C to stop the server...")
    
    try:
        # Keep the server running until Ctrl+C
        server_process.wait()
    except KeyboardInterrupt:
        print("\nStopping server...")
        server_process.terminate()
        print("Server stopped.")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 