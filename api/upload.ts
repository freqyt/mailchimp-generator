import { put } from '@vercel/blob';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(200).json({ 
      error: 'Vercel Blob storage not connected. Falling back to local preview.',
      cloudEnabled: false 
    });
  }

  try {
    const { filename, base64, contentType } = req.body;
    if (!base64 || !filename) {
      return res.status(400).json({ error: 'Missing base64 or filename' });
    }

    const buffer = Buffer.from(base64, 'base64');
    const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blob = await put(`media/${Date.now()}-${cleanName}`, buffer, {
      access: 'public',
      contentType: contentType || 'image/png',
    });

    return res.status(200).json({ success: true, url: blob.url });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
