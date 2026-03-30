import { Heart, TrendingUp, Users2, CheckCircle, ArrowRight, HandHeart, HandCoins, LifeBuoy, HeartPulse, ContactRound } from 'lucide-react';
import { Link } from "react-router-dom";
import Header from './layouts/Header';
import Footer from './layouts/Footer';
import { getImageUrl } from '../../utils/Image';
import { useState, useEffect } from 'react';
import { Helmet } from "react-helmet-async";

const Home = () => {
  const [counters, setCounters] = useState({
    bloodUnits: 0,
    volunteers: 0,
    centers: 0,
    events: 0
  });

  useEffect(() => {
    const animateCounter = (target, setter, duration = 2000) => {
      let start = 0;
      const increment = target / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(Math.floor(start));
        }
      }, 16);
    };

    animateCounter(1250, (val) => setCounters(prev => ({ ...prev, bloodUnits: val })));
    animateCounter(850, (val) => setCounters(prev => ({ ...prev, volunteers: val })));
    animateCounter(24, (val) => setCounters(prev => ({ ...prev, centers: val })));
    animateCounter(156, (val) => setCounters(prev => ({ ...prev, events: val })));
  }, []);

  const testimonials = [
    {
      id: 1,
      name: "Nguyễn Thị Lan",
      role: "Đã hiến máu 5 lần",
      avatar: "https://res.cloudinary.com/dp9b0dkkt/image/upload/v1774723684/single-women-happier-than-men-675ac891b545d_vrx2nt.avif",
      content: "Tôi cảm thấy hạnh phúc khi biết rằng giọt máu của mình có thể giúp ai đó có cơ hội sống. Đó là điều tuyệt vời nhất tôi từng làm."
    },
    {
      id: 2,
      name: "Trần Văn Nam",
      role: "Đã hiến máu 10 lần",
      avatar: "https://res.cloudinary.com/dp9b0dkkt/image/upload/v1774723684/close-up-portrait-of-smiling-handsome-young-caucasian-man-face-looking-at-camera-on-isolated-light-gray-studio-background-photo_ccmvpd.jpg",
      content: "Hiến máu đã trở thành thói quen của tôi mỗi năm. Không chỉ tốt cho sức khỏe mà còn là cách để tôi đóng góp cho xã hội."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white">
      <Helmet>
        <title>Trang chủ | Dòng Máu Lạc Hồng</title>
      </Helmet>
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-transparent"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fadeInUp">
              <div className="inline-flex items-center space-x-2 bg-red-100 text-red-600 px-4 py-2 rounded-full">
                <HandHeart className="w-4 h-4" />
                <span className="text-sm font-semibold">Trao giọt máu - Trao sự sống</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                  Hiến máu nhân đạo
                </span>
                <br />
                <span className="text-gray-800 text-xl">Bạn cho đi một giọt máu, thế giới nhận lại một phép màu</span>
              </h1>

              <p className="text-gray-600 text-lg leading-relaxed">
                Mỗi giọt máu cho đi là một cuộc đời ở lại. Hãy cùng chung tay
                vì cộng đồng với những giọt máu nghĩa tình, lan tỏa yêu thương đến muôn nơi.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/list-event"
                  className="group relative bg-gradient-to-r from-red-600 to-red-500 text-white px-8 py-3 rounded-full hover:from-red-700 hover:to-red-600 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg hover:shadow-xl"
                >
                  <span className="relative z-10">Đăng ký ngay</span>
                  <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="#"
                  className="border-2 border-red-600 text-red-600 px-8 py-3 rounded-full hover:bg-red-50 transition-all duration-300 font-semibold hover:shadow-md"
                >
                  Tìm hiểu thêm
                </Link>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center group cursor-pointer">
                  <div className="text-3xl font-bold text-red-600 group-hover:scale-110 transition-transform">1000+</div>
                  <div className="text-sm text-gray-600">Lượt hiến máu</div>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="text-3xl font-bold text-red-600 group-hover:scale-110 transition-transform">500+</div>
                  <div className="text-sm text-gray-600">Người đăng ký</div>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="text-3xl font-bold text-red-600 group-hover:scale-110 transition-transform">50+</div>
                  <div className="text-sm text-gray-600">Sự kiện</div>
                </div>
              </div>
            </div>

            <div className="relative animate-fadeInRight">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition duration-500">
                <img
                  src={getImageUrl("image/upload/v1772905326/photo-1615461066841-6116e61058f4_gmb47t.avif")}
                  alt="Blood Donation"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl animate-pulse">
                <div className="flex items-center space-x-2">
                  <Heart className="h-6 w-6 text-red-600 fill-current" />
                  <span className="font-semibold text-gray-800">Cứu sống 3000+ người</span>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-yellow-500 p-3 rounded-full shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-red-600 to-red-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="transform hover:scale-110 transition duration-300">
              <div className="text-4xl font-bold mb-2 text-white">{counters.bloodUnits}+</div>
              <div className="text-red-100">Đơn vị máu</div>
            </div>
            <div className="transform hover:scale-110 transition duration-300">
              <div className="text-4xl font-bold mb-2 text-white">{counters.volunteers}+</div>
              <div className="text-red-100">Tình nguyện viên</div>
            </div>
            <div className="transform hover:scale-110 transition duration-300">
              <div className="text-4xl font-bold mb-2 text-white">{counters.centers}+</div>
              <div className="text-red-100">Trung tâm</div>
            </div>
            <div className="transform hover:scale-110 transition duration-300">
              <div className="text-4xl font-bold mb-2 text-white">{counters.events}+</div>
              <div className="text-red-100">Sự kiện trong năm</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-red-100 text-red-600 px-4 py-2 rounded-full mb-4">
              <HandCoins className="w-4 h-4" />
              <span className="text-sm font-semibold">Lợi ích</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Tại sao nên hiến máu?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Hiến máu không chỉ cứu người mà còn mang lại nhiều lợi ích cho sức khỏe của chính bạn
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: LifeBuoy,
                title: "Cứu người",
                description: "Mỗi lần hiến máu có thể cứu sống 3 người. Giọt máu của bạn là món quà vô giá.",
                color: "red"
              },
              {
                icon: HeartPulse,
                title: "Tốt cho sức khỏe",
                description: "Kích thích sản sinh hồng cầu mới, giảm nguy cơ tim mạch và đột quỵ.",
                color: "green"
              },
              {
                icon: Users2,
                title: "Kết nối cộng đồng",
                description: "Gặp gỡ những người có cùng tấm lòng nhân ái, xây dựng cộng đồng yêu thương.",
                color: "blue"
              }
            ].map((item, index) => (
              <div key={index} className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className={`bg-${item.color}-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`h-8 w-8 text-${item.color}-600`} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CheckCircle className="w-5 h-5 text-red-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-red-100 text-red-600 px-4 py-2 rounded-full mb-4">
              <ContactRound className="w-4 h-4" />
              <span className="text-sm font-semibold">Chia sẻ</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Câu chuyện từ người hiến máu</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Những chia sẻ chân thật từ những người đã và đang tham gia hiến máu
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center space-x-4 mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-red-100"
                  />
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">{testimonial.name}</h4>
                    <p className="text-red-600 text-sm font-semibold">{testimonial.role}</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -top-2 -left-2 text-6xl text-red-100 opacity-50">"</div>
                  <p className="text-gray-600 italic leading-relaxed relative z-10 pl-4">
                    {testimonial.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 animate-pulse">
            Sẵn sàng để cứu người?
          </h2>
          <p className="text-xl mb-8 text-red-100">
            Hãy đăng ký hiến máu ngay hôm nay để mang lại hy vọng cho hàng ngàn người
          </p>
          <Link
            to="/list-event"
            className="inline-flex items-center bg-white text-red-600 px-10 py-4 rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-110 font-bold text-lg shadow-2xl"
          >
            Đăng ký hiến máu ngay
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
        }
        
        .animate-fadeInRight {
          animation: fadeInRight 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Home;