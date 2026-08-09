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
_backend_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.isfile(_backend_env):
    load_dotenv(_backend_env)

def _get_config():
    endpoint = os.getenv("SUPABASE_S3_ENDPOINT", "").rstrip("/")
    region = os.getenv("SUPABASE_S3_REGION", "ap-southeast-2")
    access_key = os.getenv("SUPABASE_S3_ACCESS_KEY", "")
    secret_key = os.getenv("SUPABASE_S3_SECRET_KEY", "")
    bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "eskala-media")
    project_id = os.getenv("SUPABASE_URL", "").replace("https://", "").split(".")[0]
    public_base = f"https://{project_id}.supabase.co/storage/v1/object/public/{bucket}" if project_id else ""
    return endpoint, region, access_key, secret_key, bucket, public_base


def _get_s3_client():
    """Create and return a boto3 S3 client configured for Supabase Storage."""
    endpoint, region, access_key, secret_key, bucket, _ = _get_config()
    if not all([endpoint, access_key, secret_key]):
        raise RuntimeError(
            "Supabase S3 is not configured. "
            "Set SUPABASE_S3_ENDPOINT, SUPABASE_S3_ACCESS_KEY, and SUPABASE_S3_SECRET_KEY in .env"
        )
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
        config=Config(signature_version="s3v4"),
    )


def upload_to_supabase(content: bytes, ext: str, folder: str = "uploads") -> str:
    """
    Upload raw bytes to Supabase Storage and return the permanent public URL.

    Args:
        content: Raw file bytes
        ext:     File extension without dot, e.g. 'jpg', 'png', 'webp'
        folder:  Subfolder inside the bucket, e.g. 'news', 'receipts', 'abyip'

    Returns:
        str: Permanent public HTTPS URL of the uploaded file

    Raises:
        RuntimeError: If S3 credentials are missing or upload fails
    """
    filename = f"{folder}/{uuid.uuid4().hex}.{ext}"

    # Determine content type from extension
    mime_type, _ = mimetypes.guess_type(f"file.{ext}")
    content_type = mime_type or "application/octet-stream"

    endpoint, region, access_key, secret_key, bucket, public_base = _get_config()

    try:
        client = _get_s3_client()
        client.put_object(
            Bucket=bucket,
            Key=filename,
            Body=content,
            ContentType=content_type,
            # No ACL needed — the bucket is set to Public in Supabase dashboard
        )
    except ClientError as exc:
        raise RuntimeError(f"Supabase Storage upload failed: {exc}") from exc

    return f"{public_base}/{filename}"


def delete_from_supabase(public_url: str) -> None:
    """
    Delete a file from Supabase Storage given its public URL.
    Silently ignores errors (non-critical cleanup).

    Args:
        public_url: The full public URL returned by upload_to_supabase()
    """
    _, _, _, _, bucket, public_base = _get_config()
    if not public_url or not public_base or public_base not in public_url:
        return  # Not a Supabase Storage URL, skip

    try:
        # Extract the object key from the public URL
        key = public_url.replace(f"{public_base}/", "")
        client = _get_s3_client()
        client.delete_object(Bucket=bucket, Key=key)
    except Exception:
        pass  # Best-effort cleanup only
