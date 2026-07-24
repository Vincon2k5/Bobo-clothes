import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { chatApi } from '../../services/api';
import { resolveImageUrl } from '../../utils/image';
import placeholder from '../../assets/placeholder.svg';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Xin chào! Mình là BoBo AI. Bạn muốn tìm sản phẩm, chọn size hay gợi ý phối đồ?',
};

const loadMessages = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem('bobo_chat_messages') || '[]');
    return Array.isArray(saved) && saved.length ? saved : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('bobo_chat_messages', JSON.stringify(messages.slice(-20)));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    const userMessage = { role: 'user', content: message };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setSending(true);

    try {
      const history = messages
        .filter((item) => ['user', 'assistant'].includes(item.role))
        .slice(-8)
        .map(({ role, content }) => ({ role, content }));
      const response = await chatApi.send({ message, history });
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: response.data.answer,
          products: response.data.products || [],
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: error.message || 'Xin lỗi, BoBo AI đang bận. Bạn vui lòng thử lại sau.',
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <section
          className="mb-3 flex h-[min(620px,calc(100vh-130px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-bobo-gray-200 bg-white shadow-2xl"
          aria-label="Chat với BoBo AI"
        >
          <header className="flex items-center gap-3 bg-bobo-black px-4 py-3.5 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-bobo-black">
              <Bot size={20} />
            </span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold">BoBo AI</h2>
              <p className="text-xs text-white/70">Trợ lý mua sắm</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 hover:bg-white/10"
              aria-label="Đóng chat"
            >
              <X size={19} />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-bobo-gray-50 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === 'user' ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[92%]'}
              >
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-br-sm bg-bobo-black text-white'
                      : message.isError
                        ? 'rounded-bl-sm border border-red-200 bg-red-50 text-red-700'
                        : 'rounded-bl-sm border border-bobo-gray-100 bg-white text-bobo-black'
                  }`}
                >
                  {message.content}
                </div>

                {message.products?.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {message.products.map((product) => (
                      <Link
                        key={product._id}
                        to={`/products/${product.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="overflow-hidden rounded-lg border border-bobo-gray-200 bg-white hover:border-bobo-black"
                      >
                        <img
                          src={resolveImageUrl(product.image) || placeholder}
                          alt={product.name}
                          className="h-24 w-full object-cover"
                        />
                        <div className="p-2">
                          <p className="line-clamp-2 text-xs font-medium">{product.name}</p>
                          <p className="mt-1 text-xs font-semibold">{formatPrice(product.price)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl rounded-bl-sm border border-bobo-gray-100 bg-white px-4 py-3 text-sm text-bobo-gray-500">
                <Loader2 size={15} className="animate-spin" />
                BoBo AI đang trả lời...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-bobo-gray-100 bg-white p-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder="Hỏi BoBo AI..."
              className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-bobo-gray-200 px-3 py-2.5 text-sm focus:border-bobo-black focus:outline-none"
              aria-label="Tin nhắn"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-bobo-black text-white disabled:opacity-40"
              aria-label="Gửi tin nhắn"
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-bobo-black text-white shadow-lg transition-transform hover:scale-105"
        aria-label={isOpen ? 'Đóng BoBo AI' : 'Mở BoBo AI'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={25} />}
      </button>
    </div>
  );
};

export default ChatWidget;
