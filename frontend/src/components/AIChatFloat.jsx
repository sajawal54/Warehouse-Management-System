import { useNavigate } from 'react-router-dom';
import { MessageSquare, Sparkles } from 'lucide-react';

const AIChatFloat = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/ai-chat')}
      className="fixed bottom-4 right-6 z-50 group flex items-center gap-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-2 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
      title="Ask AI Assistant"
    >
      <MessageSquare size={20} />
      <span className="text-sm font-medium hidden sm:inline">Ask AI</span>
      <Sparkles size={14} className="text-yellow-300 hidden sm:inline" />
    </button>
  );
};

export default AIChatFloat;