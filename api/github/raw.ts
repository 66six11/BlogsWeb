import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.GITHUB_TOKEN;

  // Set CORS headers - allow same origin in production, or configured origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://blogsweb.vercel.app'];
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { owner, repo, path } = req.query;

  if (!owner || typeof owner !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid owner parameter' });
  }

  if (!repo || typeof repo !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid repo parameter' });
  }

  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid path parameter' });
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'BlogsWeb-API'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Fetch raw content from GitHub - encode path to prevent traversal attacks
    const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/main/${encodeURIComponent(path)}`;
    const response = await fetch(rawUrl, { headers });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch raw content from GitHub' });
    }

    // Get the content type from GitHub's response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Stream the response
    const buffer = await response.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('GitHub raw content fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch raw content from GitHub' });
  }
}
