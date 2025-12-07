import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 从环境变量或请求头获取token
  let token = process.env.GITHUB_TOKEN;
  
  // 如果请求头中有Authorization，优先使用（来自Vite代理）
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid username parameter' });
  }

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'BlogsWeb-API'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers
    });

    const data = await response.json();

    // Forward the status code from GitHub API
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('GitHub API error:', error);
    return res.status(500).json({ error: 'Failed to fetch user data from GitHub' });
  }
}
