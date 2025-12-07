import React, {useState, useRef, useEffect} from 'react';
import {sendMessageToGemini} from '../services/geminiService';
import {ChatMessage} from '../types';
import {CustomSparkleIcon} from './CustomIcons';
import {LayeredCharacterIcon} from './LayeredCharacterIcon';
import {X, Send} from 'lucide-react';

const MagicChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {id: '0', role: 'model', text: "你好。我是伊蕾娜。请随意询问关于这个博客主人或魔法的问题。"}
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 生成或获取会话ID
    useEffect(() => {
        const storedSessionId = localStorage.getItem('magicChatSessionId');
        if (storedSessionId) {
            setSessionId(storedSessionId);
        } else {
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('magicChatSessionId', newSessionId);
            setSessionId(newSessionId);
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = {id: Date.now().toString(), role: 'user', text: input};
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const responseText = await sendMessageToGemini(input, sessionId);
            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (

        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="relative mb-4">
                    {/* 突破窗口的角色图标 - 绝对定位在窗口外部 */}
                    <div className="absolute -top-5 -left-0 z-[60]">
                        <LayeredCharacterIcon
                            mainSrc="/main.png"
                            hairSrc="/hair.png"
                            hatSrc="/Hat.png"
                            alt="伊蕾娜"
                            size={80}
                            scale={5}
                            offsetXPercent={0}
                            offsetYPercent={25}
                        />
                    </div>

                    {/* 聊天窗口主体 */}
                    <div
                        className="magic-chat-window w-80 md:w-96 h-96 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all animate-fade-in-up">

                        {/* Header */}
                        <div
                            className="magic-chat-header p-4 flex justify-between items-center">
                            <div className="flex items-center gap-10">
                                <div className="w-10 h-10"/>
                                <div>
                                    <h3 className="font-serif font-bold theme-text-primary">伊蕾娜</h3>
                                    <p className="text-[10px] theme-text-accent1">灰之魔女</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:opacity-80 transition-colors theme-text-secondary"
                            >
                                <X size={20}/>
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-700 scrollbar-track-transparent">
                            {messages.map((msg) => (
                                <div key={msg.id}
                                     className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div 
                                        className={`max-w-[80%] p-3 rounded-lg text-sm ${
                                            msg.role === 'user' 
                                                ? 'rounded-tr-none magic-chat-user-message' 
                                                : 'rounded-tl-none magic-chat-bot-message'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div
                                        className="p-3 rounded-lg rounded-tl-none flex gap-1 magic-chat-bot-message">
                                        <span className="w-2 h-2 rounded-full animate-bounce magic-chat-loading-dot"
                                              style={{ animationDelay: '0ms' }}/>
                                        <span className="w-2 h-2 rounded-full animate-bounce magic-chat-loading-dot"
                                              style={{ animationDelay: '150ms' }}/>
                                        <span className="w-2 h-2 rounded-full animate-bounce magic-chat-loading-dot"
                                              style={{ animationDelay: '300ms' }}/>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef}/>
                        </div>

                        {/* Input */}
                        <div 
                            className="magic-chat-input-area p-3 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="向魔女提问..."
                                className="flex-1 text-sm rounded-lg px-3 py-2 outline-none transition-colors theme-input"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="p-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors theme-btn-primary"
                            >
                                <Send size={16}/>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group relative w-14 h-14 rounded-full shadow-[0_0_20px_rgba(147,51,234,0.5)] flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 overflow-visible theme-gradient-button"
            >
                <div className="absolute inset-0 rounded-full border border-white/20 animate-ping "/>
                {isOpen ? (
                    <X size={24}/>
                ) : (
                    <div className="relative pointer-events-none">
                        <LayeredCharacterIcon
                            mainSrc="/main.png"
                            hairSrc="/hair.png"
                            hatSrc="/Hat.png"
                            alt="魔女伊蕾娜"
                            size={60}
                            scale={4}
                            offsetXPercent={0}
                            offsetYPercent={25}
                        />
                    </div>
                )}
            </button>
        </div>

    );
};

export default MagicChat;
