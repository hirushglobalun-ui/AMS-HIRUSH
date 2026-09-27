/**
 * @file blobService.ts
 * @description Provides logic and utilities for blobService.
 * @module services
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import { put } from '@vercel/blob';

const BLOB_READ_WRITE_TOKEN = 
    process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN || 
    process.env.BLOB_READ_WRITE_TOKEN || 
    process.env.VITE_BLOB_READ_WRITE_TOKEN;

/**
 * Uploads a file to Vercel Blob storage.
 * NOTE: This uses the token directly on the client side, which is not recommended for production
 * due to security risks (exposing the RW token). It may also encounter CORS issues depending on
 * the Vercel Blob configuration.
 * 
 * @param file The file object to upload
 * @param filename Optional filename (default: file.name)
 * @returns The URL of the uploaded blob
 */
export const uploadToBlob = async (file: File, filename?: string): Promise<string> => {
    if (!BLOB_READ_WRITE_TOKEN) {
        throw new Error("Vercel Blob Token not found in environment variables.");
    }

    try {
        const newBlob = await put(filename || file.name, file, {
            access: 'public',
            token: BLOB_READ_WRITE_TOKEN,
            // Add contentType to ensure correct MIME type handling
            contentType: file.type
        });

        return newBlob.url;
    } catch (error) {
        console.error("Error uploading to Vercel Blob:", error);
        throw error;
    }
};
