import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.GITHUB_TOKEN;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'BlogsWeb-API'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Fetch the last commit for the specific file
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?path=${encodeURIComponent(path)}&per_page=1`,
      { headers }
    );

    const data = await response.json();

    // Forward the status code from GitHub API
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('GitHub API error:', error);
    return res.status(500).json({ error: 'Failed to fetch commit data from GitHub' });
  }
}
