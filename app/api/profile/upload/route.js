import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(req) {
  try {
    const { image, folder = 'profiles' } = await req.json();

    if (!image) return NextResponse.json({ error: 'Image is required' }, { status: 400 });

    const url = await uploadImage(image, `savemate/${folder}`);
    return NextResponse.json({ success: true, url });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
