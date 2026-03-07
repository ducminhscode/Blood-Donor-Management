import { Droplet, Phone } from 'lucide-react';
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
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
              <li><Link to="/" className="hover:text-white transition">Trang chủ</Link></li>
              <li><Link to="/" className="hover:text-white transition">Về chúng tôi</Link></li>
              <li><Link to="/" className="hover:text-white transition">Sự kiện</Link></li>
              <li><Link to="/" className="hover:text-white transition">Tin tức</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-white transition">Câu hỏi thường gặp</Link></li>
              <li><Link to="/" className="hover:text-white transition">Điều kiện hiến máu</Link></li>
              <li><Link to="/" className="hover:text-white transition">Quy trình hiến máu</Link></li>
              <li><Link to="/" className="hover:text-white transition">Liên hệ</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>1900 1234</span>
              </li>
              <li>Email: info@mauhongviet.vn</li>
              <li>Địa chỉ: 123 Đường ABC, Hà Nội</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Máu Hồng Việt. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;