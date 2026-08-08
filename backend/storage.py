"""
eSKala — Supabase Storage Service (S3-compatible)
Handles all file uploads to Supabase Storage buckets.

Credentials are loaded from environment variables — never hardcoded.
The bucket must be set to PUBLIC in the Supabase dashboard so images
are accessible without authentication headers.
"""

import os
import uuid
import mimetypes
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

# ─── Supabase S3 Configuration ────────────────────────────────────────────────
_ENDPOINT   = os.getenv("SUPABASE_S3_ENDPOINT", "").rstrip("/")
_REGION     = os.getenv("SUPABASE_S3_REGION", "ap-southeast-2")
_ACCESS_KEY = os.getenv("SUPABASE_S3_ACCESS_KEY", "")
_SECRET_KEY = os.getenv("SUPABASE_S3_SECRET_KEY", "")
_BUCKET     = os.getenv("SUPABASE_STORAGE_BUCKET", "eskala-media")

# Public base URL for objects in the bucket
# Pattern: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
_PROJECT_ID = os.getenv("SUPABASE_URL", "").replace("https://", "").split(".")[0]
_PUBLIC_BASE = f"https://{_PROJECT_ID}.supabase.co/storage/v1/object/public/{_BUCKET}"


def _get_s3_client():
    """Create and return a boto3 S3 client configured for Supabase Storage."""
    if not all([_ENDPOINT, _ACCESS_KEY, _SECRET_KEY]):
        raise RuntimeError(
            "Supabase S3 is not configured. "
            "Set SUPABASE_S3_ENDPOINT, SUPABASE_S3_ACCESS_KEY, and SUPABASE_S3_SECRET_KEY in .env"
        )
    return boto3.client(
        "s3",
        endpoint_url=_ENDPOINT,
        aws_access_key_id=_ACCESS_KEY,
        aws_secret_access_key=_SECRET_KEY,
        region_name=_REGION,
        config=Config(signature_version="s3v4"),
    )


def upload_to_supabase(content: bytes, ext: str, folder: str = "uploads") -> str:
    """
    Upload raw bytes to Supabase Storage and return the permanent public URL.

    Args:
        content: Raw file bytes
        ext:     File extension without dot, e.g. 'jpg', 'png', 'webp'
        folder:  Subfolder inside the bucket, e.g. 'news', 'receipts'

    Returns:
        str: Permanent public HTTPS URL of the uploaded file

    Raises:
        RuntimeError: If S3 credentials are missing or upload fails
    """
    filename = f"{folder}/{uuid.uuid4().hex}.{ext}"

    # Determine content type from extension
    mime_type, _ = mimetypes.guess_type(f"file.{ext}")
    content_type = mime_type or "application/octet-stream"

    try:
        client = _get_s3_client()
        client.put_object(
            Bucket=_BUCKET,
            Key=filename,
            Body=content,
            ContentType=content_type,
            # No ACL needed — the bucket is set to Public in Supabase dashboard
        )
    except ClientError as exc:
        raise RuntimeError(f"Supabase Storage upload failed: {exc}") from exc

    return f"{_PUBLIC_BASE}/{filename}"


def delete_from_supabase(public_url: str) -> None:
    """
    Delete a file from Supabase Storage given its public URL.
    Silently ignores errors (non-critical cleanup).

    Args:
        public_url: The full public URL returned by upload_to_supabase()
    """
    if not public_url or _PUBLIC_BASE not in public_url:
        return  # Not a Supabase Storage URL, skip

    try:
        # Extract the object key from the public URL
        key = public_url.replace(f"{_PUBLIC_BASE}/", "")
        client = _get_s3_client()
        client.delete_object(Bucket=_BUCKET, Key=key)
    except Exception:
        pass  # Best-effort cleanup only
