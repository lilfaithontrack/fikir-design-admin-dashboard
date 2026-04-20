import { NextRequest, NextResponse } from 'next/server';
import upload from '@/lib/multer-config';
import { getCurrentUserFromRequest } from '@/lib/session-user';
import fs from 'fs';
import path from 'path';

// Disable body parsing for multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to run middleware
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// POST /api/upload - Upload files
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert NextRequest to a format multer can handle
    const formData = await req.formData();
    
    // Create a mock request/response for multer
    const mockReq: any = {
      body: {},
      files: [],
    };
    
    // Convert FormData to regular object
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Handle file
        const buffer = await value.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);
        
        mockReq.files.push({
          fieldname: key,
          originalname: value.name,
          mimetype: value.type,
          size: value.size,
          buffer: fileBuffer,
        });
      } else {
        // Handle regular form field
        mockReq.body[key] = value;
      }
    }

    // Process files with multer
    const uploadedFiles: any[] = [];
    
    for (const file of mockReq.files) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      
      // Determine upload path
      const subfolder = mockReq.body.folder || 'general';
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder);
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filename = `${name}-${uniqueSuffix}${ext}`;
      const filepath = path.join(uploadDir, filename);
      
      // Write file
      fs.writeFileSync(filepath, file.buffer);
      
      // Generate URL
      const url = `/uploads/${subfolder}/${filename}`;
      
      uploadedFiles.push({
        fieldname: file.fieldname,
        originalname: file.originalname,
        filename,
        mimetype: file.mimetype,
        size: file.size,
        url,
        path: filepath,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

// DELETE /api/upload - Delete uploaded file
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Security check - ensure path is within uploads directory
    const fullPath = path.join(process.cwd(), 'public', filePath);
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fullPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete file
    fs.unlinkSync(fullPath);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
