import { Heart, Droplet, Users, Calendar, Award } from 'lucide-react';
import { Link } from "react-router-dom";
import Header from './layouts/Header';
import Footer from './layouts/Footer';
import { getImageUrl } from '../../utils/Image';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold leading-tight">
                <span className="text-red-600">Hiến máu cứu người</span>
                <br />
                Một giọt máu - Triệu tấm lòng
              </h1>
              <p className="text-gray-600 text-lg">
                Mỗi giọt máu cho đi là một cuộc đời ở lại. Hãy cùng chung tay 
                vì cộng đồng với những giọt máu nghĩa tình.
              </p>
              
              <div className="flex space-x-4">
                <Link to="/" className="bg-red-600 text-white px-8 py-3 rounded-full hover:bg-red-700 transition transform hover:scale-105 font-semibold">
                  Đăng ký ngay
                </Link>
                <Link to="/" className="border-2 border-red-600 text-red-600 px-8 py-3 rounded-full hover:bg-red-50 transition font-semibold">
                  Tìm hiểu thêm
                </Link>
              </div>
              
              <div className="flex items-center space-x-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">1000+</div>
                  <div className="text-sm text-gray-600">Lượt hiến máu</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">500+</div>
                  <div className="text-sm text-gray-600">Người đăng ký</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">50+</div>
                  <div className="text-sm text-gray-600">Sự kiện</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={getImageUrl("image/upload/v1772905326/photo-1615461066841-6116e61058f4_gmb47t.avif")} 
                alt="Blood Donation"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <Heart className="h-6 w-6 text-red-600 fill-current" />
                  <span className="font-semibold">Cứu sống 3000+ người</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1250</div>
              <div className="text-red-100">Đơn vị máu</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">850</div>
              <div className="text-red-100">Tình nguyện viên</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24</div>
              <div className="text-red-100">Trung tâm</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">156</div>
              <div className="text-red-100">Sự kiện trong năm</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Donate Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tại sao nên hiến máu?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hiến máu không chỉ cứu người mà còn mang lại nhiều lợi ích cho sức khỏe của chính bạn
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Heart className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Cứu người</h3>
              <p className="text-gray-600">
                Mỗi lần hiến máu có thể cứu sống 3 người. Giọt máu của bạn là món quà vô giá.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Award className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Tốt cho sức khỏe</h3>
              <p className="text-gray-600">
                Kích thích sản sinh hồng cầu mới, giảm nguy cơ tim mạch và đột quỵ.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Kết nối cộng đồng</h3>
              <p className="text-gray-600">
                Gặp gỡ những người có cùng tấm lòng nhân ái, xây dựng cộng đồng yêu thương.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Sự kiện sắp tới</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tham gia các sự kiện hiến máu gần nhất để chung tay giúp đỡ cộng đồng
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="h-48 bg-red-200 relative">
                  <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-full text-sm font-semibold">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    15/12/2024
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Hiến máu tại Hà Nội</h3>
                  <p className="text-gray-600 mb-4">
                    Địa điểm: 123 Đường ABC, Quận 1, Hà Nội
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-red-600 font-semibold">Còn 20 chỗ</span>
                    <Link to="/" className="text-red-600 hover:text-red-700 font-semibold">
                      Đăng ký →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/" className="bg-red-600 text-white px-8 py-3 rounded-full hover:bg-red-700 transition">
              Xem tất cả sự kiện
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Câu chuyện từ người hiến máu</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Những chia sẻ chân thật từ những người đã và đang tham gia hiến máu
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-4 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1494790108777-466fd103c8ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" 
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold">Nguyễn Thị Lan</h4>
                  <p className="text-gray-500 text-sm">Đã hiến máu 5 lần</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Tôi cảm thấy hạnh phúc khi biết rằng giọt máu của mình có thể giúp ai đó 
                có cơ hội sống. Đó là điều tuyệt vời nhất tôi từng làm."
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-4 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" 
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold">Trần Văn Nam</h4>
                  <p className="text-gray-500 text-sm">Đã hiến máu 10 lần</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Hiến máu đã trở thành thói quen của tôi mỗi năm. Không chỉ tốt cho sức khỏe 
                mà còn là cách để tôi đóng góp cho xã hội."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Sẵn sàng để cứu người?</h2>
          <p className="text-xl mb-8 text-red-100">
            Hãy đăng ký hiến máu ngay hôm nay để mang lại hy vọng cho hàng ngàn người
          </p>
          <Link to="/" className="bg-white text-red-600 px-10 py-4 rounded-full hover:bg-gray-100 transition transform hover:scale-105 font-bold text-lg">
            Đăng ký hiến máu ngay
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;