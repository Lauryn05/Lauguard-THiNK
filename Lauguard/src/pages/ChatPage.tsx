import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, User } from 'lucide-react';
import ChatMessage from '@/components/chat/ChatMessage';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { applySecurityRules } from '@/lib/securityRules';

interface Message {
  id: number;
  content: string;
  isUser: boolean;
}

// Available models – keep in sync with backend
const models = [
  {
    value: 'meta-llama/Llama-3.1-8B-Instruct',
    label: 'Llama 3.1 8B'
  },
  {
    value: 'Qwen/Qwen2.5-7B-Instruct-1M',
    label: 'Qwen 2.5 7B'
  },
  {
    value: 'google/gemma-2-2b-it',
    label: 'Gemma 2 2B'
  },
  {
    value: 'deepseek-ai/DeepSeek-R1',
    label: 'DeepSeek R1'
  }
];

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, content: "Hello! How can I assist you today?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    'meta-llama/Llama-3.1-8B-Instruct'
  );
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Optionally read initial model from URL (if passed from Index)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modelFromUrl = params.get('model');
    if (modelFromUrl && models.some(m => m.value === modelFromUrl)) {
      setSelectedModel(modelFromUrl);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const maskedInput = applySecurityRules(input);

    // Local message for immediate UI feedback
    const newUserMessage: Message = {
      id: Date.now() + Math.random(),
      content: maskedInput,
      isUser: true
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');
      let userPayload: { user_id?: number; department_id?: number } = {};
      if (token) {
        userPayload = JSON.parse(atob(token.split('.')[1]));
      }

      // Send to backend with selected model
      const logRes = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: maskedInput,
          user_id: userPayload.user_id,
          department_id: userPayload.department_id,
          model: selectedModel   // <-- include selected model
        })
      });

      if (!logRes.ok) {
        const errorText = await logRes.text();
        console.error('Error logging prompt:', errorText);
        toast({
          title: "Logging failed",
          description: "Your message could not be logged properly.",
          variant: "destructive"
        });
      }

      const data = await logRes.json();
      const aiResponse: Message = {
        id: Date.now() + Math.random(),
        content: data.response,
        isUser: false
      };

      setMessages(prev => [...prev, aiResponse]);

    } catch (err: any) {
      console.error('Chat error:', err);
      toast({
        title: "Error",
        description: err.message || "An error occurred while processing your message.",
        variant: "destructive"
      });
      setMessages(prev => [...prev, {
        id: Math.max(...messages.map(m => m.id)) + 1,
        content: "An error occurred while processing your message.",
        isUser: false
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with model dropdown */}
      <header className="border-b bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-guard-blue">LauGuard</Link>

          <div className="flex items-center gap-4">
            {/* Model selection dropdown */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="border rounded px-2 py-1 text-sm bg-white"
            >
              {models.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <Button variant="outline" asChild>
              <Link to="/admin-login">Admin Login</Link>
            </Button>

            {/* Logged-in user info */}
            <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
              <User className="h-5 w-5 text-guard-blue" />
              <span className="text-guard-blue font-medium">
                {localStorage.getItem('username') || 'Guest'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages (unchanged) */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} content={message.content} isUser={message.isUser} />
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 py-3 px-4 rounded-lg max-w-[80%] text-gray-700">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
      </div>

      {/* Input Area (unchanged) */}
      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none"
            rows={1}
          />
          <Button type="button" onClick={handleSendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-400 mt-2 text-centre">
          Your sensitive information like emails and API keys will be automatically masked
        </div>
      </div>
    </div>
  );
};

export default ChatPage;