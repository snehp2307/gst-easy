"""
S3/Cloudflare R2 file storage service.
"""
import uuid
from typing import Optional
import boto3
from botocore.config import Config as BotoConfig

from app.config import settings


def get_s3_client():
    """Get boto3 S3 client configured for R2 or S3."""
    config = BotoConfig(
        region_name=settings.S3_REGION,
        signature_version="s3v4",
    )
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL or None,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        config=config,
    )


async def upload_file(
    file_bytes: bytes,
    filename: str,
    content_type: str = "image/jpeg",
    folder: str = "bills",
) -> str:
    """Upload file to S3/R2 and return the public URL."""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
    key = f"{folder}/{uuid.uuid4().hex}.{ext}"

    client = get_s3_client()
    client.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )

    # Construct URL
    if settings.S3_ENDPOINT_URL:
        url = f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET_NAME}/{key}"
    else:
        url = f"https://{settings.S3_BUCKET_NAME}.s3.amazonaws.com/{key}"

    return url


async def delete_file(url: str) -> bool:
    """Delete file from S3/R2 by URL."""
    try:
        # Extract key from URL
        key = url.split(f"{settings.S3_BUCKET_NAME}/")[-1]
        client = get_s3_client()
        client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
        return True
    except Exception:
        return False
