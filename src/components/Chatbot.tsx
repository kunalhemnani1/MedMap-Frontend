'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: JSON.stringify(messages) + " " + userMessage }),
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();
            setMessages((prev) => [...prev, { role: 'model', text: data.text }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'model', text: 'Sorry, I encountered an error. Please try again.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <div className="bg-base-100 border-base-300 text-base-content w-80 sm:w-96 rounded-box border shadow-xl flex flex-col h-[500px] overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white p-4 flex justify-between items-center shadow-md">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Bot size={24} className="text-white" />
                            MedMap Assistant
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200/50">
                        {messages.length === 0 && (
                            <div className="text-center text-base-content/50 mt-10">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bot size={32} className="text-primary opacity-50" />
                                </div>
                                <p className="font-medium">Hello! I&apos;m your MedMap AI assistant.</p>
                                <p className="text-sm mt-1">Ask me about hospital prices, procedure costs, or insurance.</p>
                                <div className="mt-4 flex flex-col gap-2">
                                    {[
                                        "What's the cost of an MRI scan?",
                                        "Which hospitals accept insurance?",
                                        "Average consultation fee in Delhi?",
                                    ].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            className="btn btn-xs btn-outline btn-primary w-full text-left"
                                            onClick={() => { setInput(suggestion); }}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}
                            >
                                <div className="chat-image avatar place-content-center">
                                    <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center text-base-content">
                                        {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                                    </div>
                                </div>
                                <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'} max-w-[260px] text-sm`}>
                                    {msg.role === 'model' ? (
                                        <ReactMarkdown
                                            components={{
                                                p: ({ ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                                                ul: ({ ...props }) => <ul className="list-disc pl-4 mb-1 space-y-0.5" {...props} />,
                                                li: ({ ...props }) => <li className="pl-0.5" {...props} />,
                                                strong: ({ ...props }) => <strong className="font-bold" {...props} />,
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="chat chat-start">
                                <div className="chat-image avatar place-content-center">
                                    <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center text-base-content">
                                        <Bot size={20} />
                                    </div>
                                </div>
                                <div className="chat-bubble chat-bubble-secondary">
                                    <span className="loading loading-dots loading-sm"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-base-100 border-t border-base-300">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="input input-bordered flex-1"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                            />
                            <button
                                className="btn btn-primary btn-square"
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-teal-500/30 hover:scale-105 transition-all duration-300"
                >
                    <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20 group-hover:opacity-0 delay-1000 duration-1000"></span>
                    <MessageCircle size={32} className="relative z-10" />

                    {/* Tooltip-like label on hover */}
                    <span className="hidden md:block absolute right-full mr-4 bg-base-300 text-base-content px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
                        Chat with AI
                    </span>
                </button>
            )}
        </div>
    );
}
