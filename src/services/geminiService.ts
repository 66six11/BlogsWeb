export const sendMessageToGemini = async (message: string, sessionId?: string): Promise<string> => {
  try {
    // 检查是否在开发环境且API端点不可用
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         import.meta.env?.MODE === 'development';
    
    if (isDevelopment) {
      // 在开发环境，尝试调用后端API
      // 如果失败，返回一个友好的开发模式响应
      try {
        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, sessionId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.response) {
            return data.response;
          }
        }
      } catch (apiError) {
        console.log('开发模式：后端API不可用，使用模拟响应');
        // 继续执行下面的模拟响应
      }
      
      // 开发环境模拟响应
      return `[开发模式] 伊蕾娜说："${message}"？嗯...让我想想。作为灰之魔女，我认为这个问题很有趣。不过现在我的魔法正在调试中，请稍后再试。\n\n（提示：在本地开发时，需要设置GEMINI_API_KEY环境变量并启动后端服务器）`;
    }


    // 生产环境：调用真实API
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, sessionId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend API error:', response.status, errorData);
      return `抱歉，魔法干扰阻止了我回答。（服务器错误: ${response.status}）`;
    }

    const data = await response.json();
    
    if (data.success && data.response) {
      return data.response;
    } else {
      return "(伊蕾娜旅游中~)[无响应]";
    }
  } catch (error) {
    console.error('Network error:', error);
    return "(魔法次元连接中断)[网络连接错误]";
  }
};
