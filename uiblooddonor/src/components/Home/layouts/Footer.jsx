import { Droplet, Phone, ArrowUp, ChevronUp, Heart, Mail, MapPinned, MessageCircle, Headphones, X } from 'lucide-react';
import { Link } from "react-router-dom";
import { useState, useEffect } from 'react';
import '../../../styles/Footer.css';

const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showChatBox, setShowChatBox] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
      
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const toggleChat = () => {
    setShowChatBox(!showChatBox);
    if (!showChatBox) {
      setShowChat(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      console.log('Message:', message);
      setMessage('');
      alert('Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất.');
      setShowChatBox(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 relative">
      <div className="fixed bottom-8 right-24 z-50 flex flex-col items-end space-y-4">
        {showChatBox && (
          <div className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden animate-slideUp">
            <div className="bg-gradient-to-r from-red-600 to-red-500 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Hỗ trợ trực tuyến</h3>
                  <p className="text-xs text-red-100">Thường trả lời trong 5 phút</p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-64 p-4 bg-gray-50 overflow-y-auto">
              <div className="flex items-start space-x-2 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-4 h-4 text-red-600" />
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm max-w-[200px]">
                  <p className="text-sm text-gray-700">
                    Xin chào! Tôi có thể giúp gì cho bạn?
                  </p>
                  <span className="text-xs text-gray-400 mt-1 block">Vừa xong</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8"></div>
                <div className="bg-gray-200 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Gửi
                </button>
              </div>
            </form>
          </div>
        )}

        <button
          onClick={toggleChat}
          className="group relative"
        >
          <div className={`absolute inset-0 rounded-full bg-green-500 animate-ping ${showChatBox ? 'opacity-0' : 'opacity-50'}`}></div>
          
          <div className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transform transition-all duration-300 ${
            showChatBox 
              ? 'bg-gray-600 rotate-90 scale-110' 
              : 'bg-green-500 hover:bg-green-600 hover:scale-110'
          }`}>
            {showChatBox ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <MessageCircle className="w-6 h-6 text-white" />
            )}
          </div>

          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap">
              {showChatBox ? 'Đóng chat' : 'Hỗ trợ trực tuyến'}
              <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-800"></span>
            </div>
          </div>

          {!showChatBox && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </div>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 group z-50 transition-all duration-500 ${
          showScrollTop 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-20 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <div className="relative">
          <svg className="absolute -top-1 -left-1 w-14 h-14 transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="#374151"
              strokeWidth="2"
            />
            <circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - scrollProgress / 100)}`}
              className="transition-stroke-dashoffset duration-300"
              strokeLinecap="round"
            />
          </svg>

          <div className="relative w-12 h-12 bg-red-600 rounded-full shadow-lg flex items-center justify-center transform group-hover:scale-110 group-hover:bg-red-700 transition-all duration-300">
            <ArrowUp className="w-6 h-6 text-white group-hover:animate-bounce" />
          </div>

          <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20 group-hover:opacity-30"></div>
        </div>

        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-xl whitespace-nowrap">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Lên đầu trang</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Đã cuộn {Math.round(scrollProgress)}%
            </div>
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
          </div>
        </div>
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Droplet className="h-8 w-8 text-red-500" />
              <span className="font-bold text-xl">Dòng Máu Lạc Hồng</span>
            </div>
            <p className="text-gray-400">
              Chung tay vì cộng đồng với những giọt máu nghĩa tình.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-white transition hover:translate-x-1 inline-block">Trang chủ</Link></li>
              <li><Link to="/" className="hover:text-white transition hover:translate-x-1 inline-block">Về chúng tôi</Link></li>
              <li><Link to="/" className="hover:text-white transition hover:translate-x-1 inline-block">Sự kiện</Link></li>
              <li><Link to="/" className="hover:text-white transition hover:translate-x-1 inline-block">Tin tức</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-white transition hover:translate-x-1 inline-block">Câu hỏi thường gặp</Link></li>
              <li><Link to="/" className="hover:text-white transition hover:translate-x-1 inline-block">Điều kiện hiến máu</Link></li>
              <li><Link to="/" className="hover:text-white transition hover:translate-x-1 inline-block">Quy trình hiến máu</Link></li>
              <li><Link to="/" className="hover:text-white transition hover:translate-x-1 inline-block">Liên hệ</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>1900 1234</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>info@mauhongviet.vn</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPinned className="h-4 w-4" />
                <span>123 Đường ABC, Hà Nội</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex justify-between items-center text-gray-400">
          <p>&copy; 2024 Máu Hồng Việt. Tất cả quyền được bảo lưu.</p>
        
          <button
            onClick={scrollToTop}
            className="md:hidden flex items-center space-x-1 text-gray-400 hover:text-white transition"
          >
            <span className="text-sm">Lên đầu</span>
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;