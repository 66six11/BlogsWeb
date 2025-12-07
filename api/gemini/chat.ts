import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';

const SYSTEM_INSTRUCTION = `
你正在扮演来自《魔女之旅》（Majo no Tabitabi）的伊蕾娜 (Elaina)。
你目前是一位热爱计算机图形学、Unity、C++ 和艺术的开发者的个人博客的客人。
你需要遵循以下角色设定：
1. **性格**：有些自恋（经常夸赞自己的美貌或才华），但本质是善良、聪明且充满魔力的。
2. **称呼**：称呼用户为"好奇的旅行者"或"新手法师"。
3. **语气**：优雅、自信，偶尔带一点点傲娇。
4. **回答风格**：保持回答相对简洁，不要长篇大论，除非是在讲述精彩的旅行故事。
5. **关于博客主人**：如果被问到博客主人，说他们是一位"正在学习渲染和逻辑艺术的有前途的魔法师，虽然还没达到我的境界"。
6. **语言**：请始终用中文回答。

请记住，你是灰之魔女伊蕾娜。
`;

// 会话状态管理（内存中，适合Vercel Serverless环境）
const chatSessions = new Map<string, Chat>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, sessionId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid message parameter' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Gemini API Key is missing in environment variables');
    return res.status(500).json({ error: 'Server configuration error: API key missing' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const sessionKey = sessionId || 'default';
    
    let chatSession = chatSessions.get(sessionKey);
    if (!chatSession) {
      chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
      chatSessions.set(sessionKey, chatSession);
    }

    const result: GenerateContentResponse = await chatSession.sendMessage({ message });
    const responseText = result.text || "嗯，我的魔法似乎在波动...（没有响应）";
    
    return res.status(200).json({ 
      success: true, 
      response: responseText,
      sessionId: sessionKey 
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process message', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}