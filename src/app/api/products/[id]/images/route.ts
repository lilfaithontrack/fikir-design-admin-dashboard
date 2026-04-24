import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/session-user';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Process and save image with sharp
async function processImage(buffer: Buffer, filename: string): Promise<{
  originalPath: string;
  thumbnailPath: string;
  webpPath: string;
  metadata: { width: number; height: number; size: number };
}> {
  await ensureUploadDir();

  const timestamp = Date.now();
  const name = path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9]/g, '-');
  
  // Paths
  const originalPath = path.join(UPLOAD_DIR, `${name}-${timestamp}-original.jpg`);
  const thumbnailPath = path.join(UPLOAD_DIR, `${name}-${timestamp}-thumb.jpg`);
  const webpPath = path.join(UPLOAD_DIR, `${name}-${timestamp}.webp`);

  // Process with sharp
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Save optimized JPEG (max 1920px width)
  await image
    .resize(1920, null, { withoutEnlargement: true, fit: 'inside' })
    .jpeg({ quality: 85, progressive: true })
    .toFile(originalPath);

  // Save thumbnail (300x300)
  await sharp(buffer)
    .resize(300, 300, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 80, progressive: true })
    .toFile(thumbnailPath);

  // Save WebP version for modern browsers
  await sharp(buffer)
    .resize(1920, null, { withoutEnlargement: true, fit: 'inside' })
    .webp({ quality: 85 })
    .toFile(webpPath);

  // Get file sizes
  const fs = await import('fs/promises');
  const originalStat = await fs.stat(originalPath);

  return {
    originalPath: `/uploads/products/${path.basename(originalPath)}`,
    thumbnailPath: `/uploads/products/${path.basename(thumbnailPath)}`,
    webpPath: `/uploads/products/${path.basename(webpPath)}`,
    metadata: {
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: originalStat.size,
    },
  };
}

// GET /api/products/[id]/images - List product images
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const images = await (prisma as any).productImage.findMany({
      where: { productId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching product images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

// POST /api/products/[id]/images - Upload product images
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Check if product exists
    const product = await (prisma as any).product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const files = formData.getAll('images') as File[];
    const altText = formData.get('alt') as string || '';
    const isPrimary = formData.get('isPrimary') === 'true';

    if (files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    // Check existing image count
    const existingCount = product.images?.length || 0;
    if (existingCount + files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 images per product' }, { status: 400 });
    }

    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: `File ${file.name} is not an image` }, { status: 400 });
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${file.name} exceeds 5MB limit` }, { status: 400 });
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Process image with sharp
      const processed = await processImage(buffer, file.name);

      // If this is set as primary, unset existing primary
      if (isPrimary && i === 0) {
        await (prisma as any).productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Save to database
      const imageRecord = await (prisma as any).productImage.create({
        data: {
          productId,
          url: processed.webpPath, // Use WebP as default for better compression
          alt: altText || file.name.replace(/\.[^/.]+$/, ''),
          isPrimary: isPrimary && i === 0,
          sortOrder: existingCount + i,
          width: processed.metadata.width,
          height: processed.metadata.height,
          fileSize: processed.metadata.size,
        },
      });

      uploadedImages.push({
        ...imageRecord,
        urls: {
          original: processed.originalPath,
          thumbnail: processed.thumbnailPath,
          webp: processed.webpPath,
        },
      });
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
    });
  } catch (error) {
    console.error('Error uploading product images:', error);
    return NextResponse.json(
      { error: 'Failed to upload images', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/images?imageId=X - Delete a product image
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = parseInt(params.id);
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // Find the image
    const image = await (prisma as any).productImage.findFirst({
      where: { id: parseInt(imageId), productId },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete from database
    await (prisma as any).productImage.delete({
      where: { id: parseInt(imageId) },
    });

    // Try to delete physical files (best effort)
    try {
      const fs = await import('fs/promises');
      const basePath = path.join(process.cwd(), 'public');
      const fileName = path.basename(image.url, '.webp');
      const dirPath = path.join(basePath, 'uploads', 'products');

      // Delete all variants
      const variants = ['.webp', '-original.jpg', '-thumb.jpg'];
      for (const variant of variants) {
        const filePath = path.join(dirPath, `${fileName}${variant}`);
        if (existsSync(filePath)) {
          await fs.unlink(filePath);
        }
      }
    } catch (fileError) {
      console.warn('Could not delete physical image files:', fileError);
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id]/images - Update image (set primary, update alt)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = parseInt(params.id);
    const body = await req.json();
    const { imageId, isPrimary, alt, sortOrder } = body;

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // If setting as primary, unset existing primary first
    if (isPrimary) {
      await (prisma as any).productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const updateData: any = {};
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;
    if (alt !== undefined) updateData.alt = alt;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updated = await (prisma as any).productImage.update({
      where: { id: parseInt(imageId) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      image: updated,
    });
  } catch (error) {
    console.error('Error updating product image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}
