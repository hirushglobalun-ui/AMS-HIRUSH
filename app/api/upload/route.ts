import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary server-side SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'hirush_ams';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Security: Maximum file size limit (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit of 10MB' },
        { status: 400 }
      );
    }

    // Security: Whitelist allowed MIME types (images and business documents)
    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain'
    ];

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only standard images (JPEG, PNG, WebP) and documents (PDF, DOCX, XLSX, CSV) are permitted.' },
        { status: 400 }
      );
    }

    // Security: Sanitize folder name against directory traversal
    const safeFolder = (formData.get('folder') as string || 'hirush_ams').replace(/[^a-zA-Z0-9_-]/g, '_');

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { 
          error: 'Cloudinary server credentials missing in environment' 
        },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine resource_type: 'image' for photos, 'raw' for PDFs and docs
    const isImage = file.type.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: safeFolder,
          resource_type: resourceType,
          public_id: `${Date.now()}_${cleanFileName}`
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error || new Error('Upload to Cloudinary failed'));
          } else {
            resolve(uploadResult);
          }
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url
    });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error uploading to Cloudinary' },
      { status: 500 }
    );
  }
}
