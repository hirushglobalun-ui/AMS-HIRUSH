/**
 * @file cloudinaryService.ts
 * @description Cloudinary file & image upload integration service for Hirush Global AMS.
 * @module services
 * @author Hirush Global AMS
 * @last_modified 2026
 */

/**
 * Uploads a file (photo or document) to Cloudinary.
 * First attempts server-side upload via Next.js API route (/api/upload).
 * Falls back to direct unsigned client upload if upload preset is configured.
 * 
 * @param file The file object (image, PDF, etc.)
 * @param folder The target Cloudinary folder (e.g. 'ams_profiles', 'ams_documents')
 * @returns Promise<string> The secure HTTPS URL of the uploaded asset
 */
export const uploadToCloudinary = async (
  file: File,
  folder: string = 'hirush_ams'
): Promise<string> => {
  // Strategy 1: Server-side API route (/api/upload)
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
    } else {
      const errorData = await res.json().catch(() => null);
      // If server route reports credentials missing, check if client preset is available
      if (errorData?.error && !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
        throw new Error(errorData.error);
      }
    }
  } catch (serverErr: any) {
    // If not a missing credential error, or if client-preset exists, try fallback
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (preset && cloudName) {
      // Strategy 2: Direct Unsigned Client-Side Upload
      const directFormData = new FormData();
      directFormData.append('file', file);
      directFormData.append('upload_preset', preset);
      directFormData.append('folder', folder);

      const directRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: 'POST',
          body: directFormData
        }
      );

      if (directRes.ok) {
        const directData = await directRes.json();
        return directData.secure_url;
      }
    }

    throw new Error(
      serverErr?.message || 'Failed to upload to Cloudinary. Please check Cloudinary credentials in .env.'
    );
  }

  throw new Error('Upload to Cloudinary failed.');
};
