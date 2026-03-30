import { Droplet, Phone, ArrowUp, ChevronUp, Heart, Mail, MapPinned, MessageCircle, Headphones, X, Facebook, Twitter, Youtube, Instagram } from 'lucide-react';
import { Link } from "react-router-dom";
import { useState, useEffect } from 'react';

const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showChatBox, setShowChatBox] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 to-gray-950 text-white pt-16 pb-8">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600"></div>
      
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end space-y-4">
        {showChatBox && (
          <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden animate-slideUp border border-gray-200">
            <div className="bg-gradient-to-r from-red-600 to-red-500 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Chatbot tư vấn</h3>
                  <p className="text-xs text-red-100">Thường trả lời trong 5 phút</p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="text-white/80 hover:text-white transition-all duration-300 hover:rotate-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-80 p-4 bg-gradient-to-b from-gray-50 to-white overflow-y-auto">
              <div className="flex items-start space-x-2 mb-4 animate-fadeIn">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <Headphones className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-xl p-3 shadow-md max-w-[240px] border border-gray-100">
                  <p className="text-sm text-gray-700">
                    Xin chào! Tôi có thể giúp gì cho bạn? 😊
                  </p>
                  <span className="text-xs text-gray-400 mt-1 block">Vừa xong</span>
                </div>
              </div>

              {isTyping && (
                <div className="flex items-start space-x-2 mb-4 animate-fadeIn">
                  <div className="w-8 h-8"></div>
                  <div className="bg-gray-100 rounded-xl p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="Nhập tin nhắn của bạn"
                  className="flex-1 text-black px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-300"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
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
          <div className={`absolute inset-0 rounded-full bg-green-500 ${showChatBox ? 'opacity-0' : 'animate-ping opacity-75'}`}></div>
          
          <div className={`relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transform transition-all duration-500 ${
            showChatBox 
              ? 'bg-gray-600 rotate-90 scale-110' 
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-110'
          }`}>
            {showChatBox ? (
              <X className="w-6 h-6 text-white transition-transform duration-300" />
            ) : (
              <MessageCircle className="w-6 h-6 text-white" />
            )}
          </div>

          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap shadow-lg">
              {showChatBox ? 'Đóng chat' : 'Chatbot tư vấn'}
              <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-800"></span>
            </div>
          </div>

          {!showChatBox && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>
      </div>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-24 right-8 group z-50 transition-all duration-500 ${
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
              stroke="rgba(55, 65, 81, 0.3)"
              strokeWidth="2.5"
            />
            <circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2.5"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - scrollProgress / 100)}`}
              className="transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>

          <div className="relative w-12 h-12 bg-gradient-to-r from-red-600 to-red-500 rounded-full shadow-lg flex items-center justify-center transform group-hover:scale-110 group-hover:from-red-700 group-hover:to-red-600 transition-all duration-300">
            <ArrowUp className="w-6 h-6 text-white group-hover:animate-bounce" />
          </div>

          <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20 group-hover:opacity-30"></div>
        </div>

        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="bg-gray-800/95 backdrop-blur-sm text-white px-4 py-2 rounded-xl shadow-xl whitespace-nowrap border border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Lên đầu trang</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Đã cuộn {Math.round(scrollProgress)}%
            </div>
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-800/95"></div>
          </div>
        </div>
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                <Droplet className="relative h-9 w-9 text-red-500 drop-shadow-sm" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent">
                Dòng Máu Lạc Hồng
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Chung tay vì cộng đồng với những giọt máu nghĩa tình, kết nối yêu thương, lan tỏa sự sống.
            </p>
            <div className="flex space-x-3 pt-2">
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-300 hover:scale-110">
                <Facebook className="w-4 h-4 text-gray-400 hover:text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-300 hover:scale-110">
                <Twitter className="w-4 h-4 text-gray-400 hover:text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-300 hover:scale-110">
                <Youtube className="w-4 h-4 text-gray-400 hover:text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-300 hover:scale-110">
                <Instagram className="w-4 h-4 text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-5 text-lg relative inline-block">
              Liên kết nhanh
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent"></div>
            </h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link to="#" className="hover:text-white transition-all duration-300 hover:translate-x-2 inline-flex items-center space-x-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span><span>Trang chủ</span></Link></li>
              <li><Link to="#" className="hover:text-white transition-all duration-300 hover:translate-x-2 inline-flex items-center space-x-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span><span>Về chúng tôi</span></Link></li>
              <li><Link to="#" className="hover:text-white transition-all duration-300 hover:translate-x-2 inline-flex items-center space-x-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span><span>Sự kiện</span></Link></li>
              <li><Link to="#" className="hover:text-white transition-all duration-300 hover:translate-x-2 inline-flex items-center space-x-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span><span>Tin tức</span></Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-5 text-lg relative inline-block">
              Hỗ trợ
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent"></div>
            </h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link to="#" className="hover:text-white transition-all duration-300 hover:translate-x-2 inline-flex items-center space-x-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span><span>Câu hỏi thường gặp</span></Link></li>
              <li><Link to="#" className="hover:text-white transition-all duration-300 hover:translate-x-2 inline-flex items-center space-x-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span><span>Điều kiện hiến máu</span></Link></li>
              <li><Link to="#" className="hover:text-white transition-all duration-300 hover:translate-x-2 inline-flex items-center space-x-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span><span>Quy trình hiến máu</span></Link></li>
              <li><Link to="#" className="hover:text-white transition-all duration-300 hover:translate-x-2 inline-flex items-center space-x-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span><span>Trung tâm kiến thức</span></Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-5 text-lg relative inline-block">
              Liên hệ
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent"></div>
            </h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-center space-x-3 group cursor-pointer">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-all duration-300">
                  <Phone className="h-4 w-4 text-red-500 group-hover:text-white" />
                </div>
                <span className="group-hover:text-white transition">1900 1234</span>
              </li>
              <li className="flex items-center space-x-3 group cursor-pointer">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-all duration-300">
                  <Mail className="h-4 w-4 text-red-500 group-hover:text-white" />
                </div>
                <span className="group-hover:text-white transition">info@dongmaulachong.vn</span>
              </li>
              <li className="flex items-start space-x-3 group cursor-pointer">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-all duration-300 flex-shrink-0 mt-1">
                  <MapPinned className="h-4 w-4 text-red-500 group-hover:text-white" />
                </div>
                <span className="group-hover:text-white transition">123 Đường Cách Mạng Tháng Tám, Quận 1, TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4 text-gray-400">
            <p>&copy; 2026 Dòng Máu Lạc Hồng. Đã đăng ký bản quyền.</p>
            <div className="hidden md:flex space-x-2">
              <Link to="#" className="text-sm hover:text-white transition">Chính sách bảo mật</Link>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <Link to="#" className="text-sm hover:text-white transition">Điều khoản sử dụng</Link>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <Link to="#" className="text-sm hover:text-white transition">Sơ đồ trang</Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Hệ thống hoạt động 24/7</span>
            </div>
            <button
              onClick={scrollToTop}
              className="md:hidden flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-all duration-300 group"
            >
              <span className="text-sm text-gray-400 group-hover:text-white">Lên đầu</span>
              <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:-translate-y-1 transition" />
            </button>
          </div>
        </div>

        <div className="md:hidden flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-gray-800">
          <Link to="/privacy" className="text-xs text-gray-400 hover:text-white transition">Chính sách bảo mật</Link>
          <span className="text-gray-600">•</span>
          <Link to="/terms" className="text-xs text-gray-400 hover:text-white transition">Điều khoản sử dụng</Link>
          <span className="text-gray-600">•</span>
          <Link to="/sitemap" className="text-xs text-gray-400 hover:text-white transition">Sơ đồ trang</Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        
        .group:hover .group-hover\\:animate-bounce {
          animation: bounce 0.5s ease-in-out infinite;
        }
      `}</style>
    </footer>
  );
};

export default Footer;