"""
Cloudinary and Local File Storage Manager.
Uploads scheme documents and medical records and returns public URLs.
Supports local static file uploads fallback when Cloudinary is not configured.
"""

import os
import uuid
from typing import Tuple, Optional
from app.config import settings

# Base upload directory
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))


class FileUploadManager:
    @staticmethod
    def ensure_upload_dir():
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR, exist_ok=True)

    @staticmethod
    def upload_file(file_name: str, file_content: bytes) -> Tuple[str, Optional[str]]:
        """
        Uploads file content and returns (public_url, public_id).
        """
        # If Cloudinary is configured (requires CLOUDINARY_URL or CLOUDINARY_API_KEY)
        cloudinary_url = os.getenv("CLOUDINARY_URL") or getattr(settings, "CLOUDINARY_URL", None)
        if cloudinary_url:
            print("[INFO] Cloudinary configuration detected. Attempting Cloudinary upload...")
            try:
                import cloudinary
                import cloudinary.uploader

                upload_result = cloudinary.uploader.upload(
                    file_content,
                    resource_type="auto",
                    folder="healthcare_scheme_documents"
                )
                secure_url = upload_result.get("secure_url")
                public_id = upload_result.get("public_id")
                return secure_url, public_id
            except Exception as e:
                print(f"[ERROR] Cloudinary upload failed: {e}. Falling back to local storage.")

        # Fallback Local Storage
        FileUploadManager.ensure_upload_dir()

        safe_name = os.path.basename(file_name).replace(" ", "_")
        unique_prefix = uuid.uuid4().hex[:8]
        stored_file_name = f"{unique_prefix}_{safe_name}"
        file_path = os.path.join(UPLOAD_DIR, stored_file_name)

        with open(file_path, "wb") as f:
            f.write(file_content)

        # Return local static URL pointing to FastAPI dev port
        local_url = f"http://localhost:8000/uploads/{stored_file_name}"
        return local_url, stored_file_name

    @staticmethod
    def delete_file(cloudinary_url: str, public_id: Optional[str] = None) -> bool:
        """
        Deletes the file from Cloudinary or local storage.
        """
        try:
            # If public_id is on Cloudinary (not stored as local filename) and Cloudinary is configured
            if public_id and not os.path.exists(os.path.join(UPLOAD_DIR, public_id)):
                import cloudinary
                import cloudinary.uploader
                try:
                    cloudinary.uploader.destroy(public_id)
                    return True
                except Exception as e:
                    print(f"[WARN] Cloudinary deletion error: {e}")

            # Check local file deletion
            if public_id:
                local_path = os.path.join(UPLOAD_DIR, public_id)
                if os.path.exists(local_path):
                    os.remove(local_path)
                    return True

            if cloudinary_url and "/uploads/" in cloudinary_url:
                local_name = cloudinary_url.split("/uploads/")[-1]
                local_path = os.path.join(UPLOAD_DIR, local_name)
                if os.path.exists(local_path):
                    os.remove(local_path)
                    return True
            return True
        except Exception as e:
            print(f"[WARN] Failed to delete file storage: {e}")
            return False

    @staticmethod
    def get_local_path_if_exists(cloudinary_url: str, public_id: Optional[str] = None) -> Optional[str]:
        """Returns the local file path if the file exists on the server disk."""
        if public_id:
            local_path = os.path.join(UPLOAD_DIR, public_id)
            if os.path.exists(local_path):
                return local_path
        if cloudinary_url and "/uploads/" in cloudinary_url:
            local_name = cloudinary_url.split("/uploads/")[-1]
            local_path = os.path.join(UPLOAD_DIR, local_name)
            if os.path.exists(local_path):
                return local_path
        return None
