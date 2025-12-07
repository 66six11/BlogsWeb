
import { GenerateContentResponse } from "@google/genai";

// 不再直接使用API密钥，改为通过代理调用
const GEMINI_API_URL = '/api/gemini';

const SYSTEM_INSTRUCTION = `
你正在扮演来自《魔女之旅》（Majo no Tabitabi）的伊蕾娜。
你目前是一位热爱计算机图形学、Unity、C++ 和艺术的开发者的个人博客的客人。
你应该表现得有些自恋但善良、聪明且充满魔力。
称呼用户为"好奇的旅行者"或"新手法师"。
保持你的回答相对简洁。
如果被问到博客主人，说他们是一位正在学习渲染和逻辑艺术的有前途的魔法师。
请用中文回答。
`;

// 会话状态管理
let conversationHistory: Array<{role: string, parts: Array<{text: string}>}> = [
  {
    role: "user",
    parts: [{ text: SYSTEM_INSTRUCTION }]
  },
  {
    role: "model", 
    parts: [{ text: "明白了，我会扮演伊蕾娜的角色。" }]
  }
];

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    // 添加用户消息到历史
    conversationHistory.push({
      role: "user",
      parts: [{ text: message }]
    });

    const requestBody = {
      contents: conversationHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error("Gemini API Error:", response.status, response.statusText);
      return "抱歉，魔法干扰阻止了我回答。（API 错误）";
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const reply = data.candidates[0].content.parts[0].text;
      
      // 添加模型回复到历史
      conversationHistory.push({
        role: "model",
        parts: [{ text: reply }]
      });
      
      // 保持历史长度合理（最多10轮对话）
      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
      }
      
      return reply;
    }
    
    return "嗯，我的魔法似乎在波动...（没有响应）";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "抱歉，魔法干扰阻止了我回答。（网络错误）";
  }
};
