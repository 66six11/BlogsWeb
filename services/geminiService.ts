import {GoogleGenAI, Chat, GenerateContentResponse} from "@google/genai";
import {getEnv} from "../constants";


const apiKey = getEnv('GEMINI_API_KEY');

// Only initialize AI if key is present to avoid errors on init
let ai: GoogleGenAI | null = null;
if (apiKey) {
    ai = new GoogleGenAI({apiKey: apiKey});
} else {
    console.warn("Gemini API Key is missing. MagicChat will not function.");
}
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

// 会话状态管理
let chatSession: Chat | null = null;

export const getChatSession = (): Chat | null => {
    if (!ai) return null;
    if (!chatSession) {
        chatSession = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            },
        });
    }
    return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
    try {
        const chat = getChatSession();
        if (!chat) {
            return "我现在无法说话。（缺少 API 密钥）";
        }
        const result: GenerateContentResponse = await chat.sendMessage({ message });
        return result.text || "嗯，我的魔法似乎在波动...（没有响应）";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "抱歉，魔法干扰阻止了我回答。（API 错误）";
    }
};
