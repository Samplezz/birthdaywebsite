import { put, del } from '@vercel/blob';

// Strict server-enforced limits
export const STORAGE_LIMITS = {
  photos: {
    allowedTypes: ['image/webp', 'image/jpeg', 'image/png'],
    maxBytes: 1.5 * 1024 * 1024, // 1.5 MB hard cap (strictly within 4.5 MB serverless limit)
    maxCount: 12, // At most 12 photos
  },
  audio: {
    allowedTypes: ['audio/mpeg', 'audio/mp3'],
    maxBytes: 4.0 * 1024 * 1024, // 4.0 MB hard cap (strictly within 4.5 MB serverless limit)
  },
};

function requireBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      'CRITICAL STORAGE ERROR: BLOB_READ_WRITE_TOKEN is not configured. ' +
      'Connect your private Vercel Blob store in the Vercel dashboard.'
    );
  }
  return token;
}

/**
 * Uploads media to Vercel Blob in PRIVATE mode (access: 'private').
 * No public URL is ever exposed. Files can only be downloaded with the token.
 */
export async function uploadPrivateBlob(
  pathname: string,
  buffer: Buffer | Blob,
  contentType: string
): Promise<{ url: string; pathname: string; size: number }> {
  const token = requireBlobToken();

  const blob = await put(pathname, buffer, {
    access: 'private',
    addRandomSuffix: true,
    contentType,
    token,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    size: buffer instanceof Buffer ? buffer.length : buffer.size,
  };
}

/**
 * Deletes a private blob by URL or pathname.
 */
export async function deletePrivateBlob(urlOrPath: string): Promise<void> {
  if (!urlOrPath) return;
  const token = requireBlobToken();
  try {
    await del(urlOrPath, { token });
  } catch (err) {
    console.warn('Failed to delete blob:', err);
  }
}

/**
 * Fetches a private blob from Vercel Blob using the authenticated token.
 * Returns a standard Response that can be streamed to the client.
 */
export async function fetchPrivateBlob(blobUrl: string): Promise<Response> {
  const token = requireBlobToken();

  const resp = await fetch(blobUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch blob: ${resp.status} ${resp.statusText}`);
  }

  return resp;
}

/**
 * Validates an upload request against storage limits.
 * Throws a descriptive error if validation fails.
 */
export function validateUpload(
  type: 'photos' | 'audio',
  contentType: string,
  sizeBytes: number,
  currentPhotoCount?: number
): void {
  const limits = STORAGE_LIMITS[type];

  if (!limits.allowedTypes.includes(contentType)) {
    throw new Error(
      `Invalid content type "${contentType}". Allowed: ${limits.allowedTypes.join(', ')}`
    );
  }

  if (sizeBytes > limits.maxBytes) {
    const maxMB = (limits.maxBytes / (1024 * 1024)).toFixed(1);
    const actualMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    throw new Error(
      `File too large (${actualMB} MB). Maximum allowed: ${maxMB} MB`
    );
  }

  if (type === 'photos' && currentPhotoCount !== undefined) {
    if (currentPhotoCount >= STORAGE_LIMITS.photos.maxCount) {
      throw new Error(
        `Maximum of ${STORAGE_LIMITS.photos.maxCount} photos reached. Delete an existing photo first.`
      );
    }
  }
}
