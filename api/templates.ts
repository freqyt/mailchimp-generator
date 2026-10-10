import { put, list } from '@vercel/blob';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (req.method === 'GET') {
    if (!hasBlob) {
      return res.status(200).json({ cloudEnabled: false, templates: [] });
    }

    try {
      const { blobs } = await list({ prefix: 'templates.json' });
      const templateBlob = blobs.find((b: any) => b.pathname === 'templates.json');

      if (!templateBlob) {
        return res.status(200).json({ cloudEnabled: true, templates: [] });
      }

      const response = await fetch(templateBlob.url);
      const data = await response.json();
      return res.status(200).json({ cloudEnabled: true, templates: data });
    } catch (err: any) {
      console.error('Error reading templates blob:', err);
      return res.status(500).json({ error: err.message, cloudEnabled: true });
    }
  }

  if (req.method === 'POST') {
    if (!hasBlob) {
      return res.status(200).json({ 
        cloudEnabled: false, 
        message: 'BLOB_READ_WRITE_TOKEN not configured on Vercel. Saved locally in browser.' 
      });
    }

    try {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const blob = await put('templates.json', body, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
      });

      return res.status(200).json({ success: true, cloudEnabled: true, url: blob.url });
    } catch (err: any) {
      console.error('Error saving templates blob:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
