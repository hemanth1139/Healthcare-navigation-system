"""
Cloudinary and Local File Storage Manager.
Uploads medical records and returns public URLs.
Supports local static file uploads fallback when Cloudinary is not configured.
"""

import os
from typing import Tuple
from app.config import settings

# Base upload directory
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))


class FileUploadManager:
    @staticmethod
    def ensure_upload_dir():
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)

    @staticmethod
    def upload_file(file_name: str, file_content: bytes) -> str:
        """
        Uploads file content and returns the public accessibility URL.
        """
        # If Cloudinary is configured (requires CLOUDINARY_URL or keys)
        cloudinary_url = os.getenv("CLOUDINARY_URL")
        if cloudinary_url:
            print("[INFO] Cloudinary environment variable detected. Attempting Cloudinary upload...")
            import cloudinary
            import cloudinary.uploader
            
            try:
                # Cloudinary setup is handled automatically by env configuration
                upload_result = cloudinary.uploader.upload(file_content, resource_type="auto")
                return upload_result.get("secure_url")
            except Exception as e:
                print(f"[ERROR] Cloudinary upload failed: {e}. Falling back to local storage.")

        # Fallback Local Storage
        FileUploadManager.ensure_upload_dir()
        
        # Standardize name to prevent directory traversal issues
        safe_name = os.path.basename(file_name).replace(" ", "_")
        # Add random suffix or use safe unique file path
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        
        with open(file_path, "wb") as f:
            f.write(file_content)
            
        # Return local static URL pointing to FastAPI dev port
        return f"http://localhost:8000/uploads/{safe_name}"
