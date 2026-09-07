import { useState } from 'react';
import { useAI } from '../../hooks/useAI';
import { useWarehouses } from '../../hooks/useWarehouses';
import { 
  MessageSquare, Send, Bot, User, Loader2,
  Warehouse
} from 'lucide-react';

const AIChat = () => {
  const [question, setQuestion] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI inventory assistant. Ask me anything about your inventory, stock levels, or warehouse operations!'
    }
  ]);

  const { sendChatMessage, chatLoading, error } = useAI();
  const { warehouses, loadWarehouses } = useWarehouses();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setQuestion('');

    try {
      const response = await sendChatMessage(question, warehouseId || null);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.answer || 'Sorry, I couldn\'t process that request.'
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    }
  };

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">AI Chat Assistant</h1>
          <p className="text-gray-600 dark:text-gray-400">Ask questions about your inventory</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 max-w-xs">
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 mb-4 ${
              msg.role === 'user' ? 'justify-end' : ''
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                <Bot className="text-blue-600 dark:text-blue-400" size={18} />
              </div>
            )}
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0">
                <User className="text-gray-600 dark:text-gray-400" size={18} />
              </div>
            )}
          </div>
        ))}
        {chatLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Bot className="text-blue-600 dark:text-blue-400" size={18} />
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <Loader2 className="animate-spin" size={20} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-3 mt-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about inventory, stock levels, or warehouse operations..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={chatLoading}
        />
        <button
          type="submit"
          disabled={!question.trim() || chatLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={18} />
          Send
        </button>
      </form>
    </div>
  );
};

export default AIChat;