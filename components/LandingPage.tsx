import React, { useState, useEffect } from 'react';
import { Search, Menu, Play, Heart, Instagram, Facebook, Twitter, Apple, Monitor, ChevronLeft, ChevronRight, Users, MessageSquare, Brain, ShieldCheck } from 'lucide-react';

const LandingPage: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const carouselImages = [
        "https://i.ibb.co/HpVr8m9Q/image.png",
        "https://i.ibb.co/kghVJ8PD/image.png",
        "https://i.ibb.co/SXN0zzLX/image.png",
        "https://i.ibb.co/C3kkSvPH/image.png"
    ];

    const heroContent = [
        {
            subtitle: "Cộng đồng Liên Quân Mobile lớn nhất",
            title: "Kết nối đam mê Chinh phục Đỉnh cao",
            highlight: "Đỉnh cao"
        },
        {
            subtitle: "Tìm kiếm đồng đội hoàn hảo",
            title: "Lập đội leo Rank Cùng đồng đội chuẩn",
            highlight: "chuẩn"
        },
        {
            subtitle: "Trợ lý ảo thông minh",
            title: "Nâng tầm kỹ năng Với AI Coach",
            highlight: "AI Coach"
        },
        {
            subtitle: "Tin tức & Highlight mới nhất",
            title: "Không bỏ lỡ Bất kỳ khoảnh khắc nào",
            highlight: "khoảnh khắc"
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
    };

    const handleLogin = () => {
        window.location.hash = 'login';
    };

    const handleRegister = () => {
        window.location.hash = 'register';
    };

    return (
        <div className="relative min-h-screen w-full bg-[#0a0b0f] text-white overflow-x-hidden font-archivo">
            {/* Background Carousel */}
            <div className="fixed inset-0 z-0">
                {carouselImages.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-40 md:opacity-60' : 'opacity-0'
                            }`}
                    >
                        <img
                            src={img}
                            alt={`ArenaHub Background ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0b0f]/90 via-[#0a0b0f]/20 to-[#0a0b0f]"></div>
                <div className="absolute inset-0 backdrop-blur-[2px]"></div>
            </div>

            {/* Navbar - Responsive */}
            <nav className="relative z-50 flex items-center justify-between px-4 md:px-12 py-4 md:py-6 backdrop-blur-md bg-black/20 border-b border-white/5">
                <div className="flex items-center gap-3 md:gap-6">
                </div>

                <div className="absolute flex items-center">
                    <img
                        src="https://i.ibb.co/Y7zWPJVZ/liqi88-2026.png"
                        alt="ArenaHub Logo"
                        className="h-12 md:h-20 w-auto drop-shadow-[0_0_15px_rgba(140,103,246,0.5)]"
                    />
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={handleRegister}
                        className="px-3 md:px-6 py-1.5 md:py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-all font-semibold uppercase text-[10px] md:text-sm tracking-widest whitespace-nowrap"
                    >
                        Đăng Ký
                    </button>
                    <button
                        onClick={handleLogin}
                        className="px-3 md:px-6 py-1.5 md:py-2 rounded-lg bg-primary hover:bg-primary/80 transition-all font-semibold uppercase text-[10px] md:text-sm tracking-widest whitespace-nowrap shadow-lg shadow-primary/20"
                    >
                        Đăng Nhập
                    </button>
                </div>
            </nav>

            {/* Hero Section - Responsive */}
            <main className="relative z-10 px-6 md:px-12 lg:px-24 pt-20 md:pt-32 pb-16 min-h-[70vh] flex flex-col justify-center">
                <div className="max-w-4xl">
                    <p className="text-primary font-bold uppercase tracking-[2px] md:tracking-[4px] mb-4 md:mb-6 text-xs md:text-base animate-fade-in transition-all duration-500">
                        {heroContent[currentSlide].subtitle}
                    </p>
                    <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[1.1] tracking-tighter mb-8 md:mb-12 drop-shadow-2xl transition-all duration-500">
                        {heroContent[currentSlide].title.split(heroContent[currentSlide].highlight)[0]}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/30">
                            {heroContent[currentSlide].highlight}
                        </span>
                    </h1>

                    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 md:gap-8 mt-4">
                        <button
                            onClick={handleRegister}
                            className="w-full sm:w-auto px-10 md:px-16 h-[60px] md:h-[70px] rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all font-bold uppercase tracking-widest text-lg md:text-2xl shadow-xl"
                        >
                            Khám phá Ngay
                        </button>

                        <div className="flex items-center gap-6">
                            <div className="w-[1px] h-10 bg-white/10 hidden sm:block"></div>
                            <button className="flex items-center gap-4 group">
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                                    <Play className="w-5 h-5 md:w-6 md:h-6 text-primary fill-primary" />
                                </div>
                                <span className="font-bold uppercase tracking-widest text-xs md:text-sm group-hover:text-primary transition-colors">
                                    Xem Trailer
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Social Sidebar - Responsive */}
                <div className="hidden lg:flex absolute left-8 bottom-12 flex-col gap-6">
                    <a href="https://www.facebook.com/tung.nguyenson.1044" className="p-2 hover:text-primary transition-colors hover:scale-110 border border-white/5 rounded-full bg-white/5 backdrop-blur-sm"><Instagram className="w-5 h-5" /></a>
                    <a href="https://www.facebook.com/tung.nguyenson.1044" className="p-2 hover:text-primary transition-colors hover:scale-110 border border-white/5 rounded-full bg-white/5 backdrop-blur-sm"><Facebook className="w-5 h-5" /></a>
                    <a href="https://www.facebook.com/tung.nguyenson.1044" className="p-2 hover:text-primary transition-colors hover:scale-110 border border-white/5 rounded-full bg-white/5 backdrop-blur-sm font-bold italic text-lg w-9 h-9 flex items-center justify-center">X</a>
                </div>

                {/* Carousel Controls - Repositioned for small screens */}
                <div className="absolute right-6 bottom-10 lg:bottom-12 flex items-center gap-4">
                    <button
                        onClick={prevSlide}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all group"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all group"
                    >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                    </button>
                </div>

                {/* Pagination Indicator - Hidden on mobile, shown on md+ */}
                <div className="hidden md:flex absolute right-12 top-1/2 -translate-y-1/2 flex-col items-center gap-4">
                    <span className="text-xs font-bold opacity-60">0{currentSlide + 1}</span>
                    <div className="w-[2px] h-40 lg:h-80 bg-white/10 relative">
                        <div
                            className="absolute left-0 w-full bg-primary shadow-[0_0_15px_rgba(140,103,246,0.8)] transition-all duration-700"
                            style={{
                                height: `${100 / carouselImages.length}%`,
                                top: `${(currentSlide * 100) / carouselImages.length}%`
                            }}
                        ></div>
                    </div>
                    <span className="text-xs font-bold opacity-60">0{carouselImages.length}</span>
                </div>
            </main>

            {/* Features Section - Content Relevant to ArenaHub */}
            <section className="relative z-10 px-6 md:px-12 lg:px-24 py-16 md:py-24 bg-gradient-to-t from-black via-black/90 to-transparent">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 md:mb-16 gap-6">
                        <div>
                            <h2 className="text-sm md:text-base font-bold uppercase tracking-[3px] text-primary mb-2">Tính năng đặc biệt</h2>
                            <p className="text-2xl md:text-5xl font-black uppercase tracking-tight">Hệ sinh thái <br /> <span className="text-white/60">Game thủ Liqi88</span></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {/* Feature 1: Social Feed */}
                        <div className="group p-8 rounded-[32px] bg-bg-secondary/50 border border-white/5 hover:border-primary/40 hover:bg-bg-secondary transition-all duration-500 flex flex-col h-full shadow-lg">
                            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <MessageSquare className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold uppercase mb-4">Bảng tin Cộng đồng</h3>
                            <p className="text-sm text-white/50 leading-relaxed mb-8">
                                Chia sẻ những pha highlight, cập nhật tin tức Meta mới nhất và thảo luận cùng hàng nghìn kiện tướng khác.
                            </p>
                            {/* <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center group-hover:text-primary transition-colors cursor-pointer">
                                <span className="text-xs font-bold uppercase tracking-widest">Xem thêm</span>
                                <ChevronRight className="w-4 h-4" />
                            </div> */}
                        </div>

                        {/* Feature 2: LFG */}
                        <div className="group p-8 rounded-[32px] bg-bg-secondary/50 border border-white/5 hover:border-primary/40 hover:bg-bg-secondary transition-all duration-500 flex flex-col h-full shadow-lg">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <Users className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold uppercase mb-4">Tìm đồng đội (LFG)</h3>
                            <p className="text-sm text-white/50 leading-relaxed mb-8">
                                Không còn phải leo rank một mình. Tìm kiếm đồng đội cùng bậc hạng, đúng vị trí sở trường để chiến thắng dễ dàng hơn.
                            </p>
                            {/* <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center group-hover:text-emerald-400 transition-colors cursor-pointer">
                                <span className="text-xs font-bold uppercase tracking-widest">Tìm Team</span>
                                <ChevronRight className="w-4 h-4" />
                            </div> */}
                        </div>

                        {/* Feature 3: AI Coach */}
                        <div className="group p-8 rounded-[32px] bg-bg-secondary/50 border border-white/5 hover:border-primary/40 hover:bg-bg-secondary transition-all duration-500 flex flex-col h-full shadow-lg">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <Brain className="w-7 h-7 text-amber-400" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold uppercase mb-4">Trợ lý AI Coach</h3>
                            <p className="text-sm text-white/50 leading-relaxed mb-8">
                                Tích hợp công nghệ Gemini giúp phân tích lối chơi, gợi ý lối lên đồ và hướng dẫn kỹ năng tướng chuẩn chuyên gia.
                            </p>
                            {/* <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center group-hover:text-amber-400 transition-colors cursor-pointer">
                                <span className="text-xs font-bold uppercase tracking-widest">Hỏi AI</span>
                                <ChevronRight className="w-4 h-4" />
                            </div> */}
                        </div>

                        {/* Feature 4: Verified Profile */}
                        <div className="group p-8 rounded-[32px] bg-bg-secondary/50 border border-white/5 hover:border-primary/40 hover:bg-bg-secondary transition-all duration-500 flex flex-col h-full shadow-lg">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-7 h-7 text-blue-400" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold uppercase mb-4">Xác thực Rank AI</h3>
                            <p className="text-sm text-white/50 leading-relaxed mb-8">
                                Tự động xác thực bậc hạng trong game thông qua ảnh chụp màn hình bằng công nghệ AI Vision cực nhanh.
                            </p>
                            {/* <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center group-hover:text-blue-400 transition-colors cursor-pointer">
                                <span className="text-xs font-bold uppercase tracking-widest">Xác thực</span>
                                <ChevronRight className="w-4 h-4" />
                            </div> */}
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="relative z-10 px-6 py-20 text-center">
                <div className="max-w-2xl mx-auto p-12 rounded-[40px] bg-gradient-to-br from-primary/20 to-transparent border border-white/10 backdrop-blur-md">
                    <h2 className="text-3xl md:text-5xl font-black uppercase mb-6">Bắt đầu hành trình <br /> của bạn ngay hôm nay!</h2>
                    <p className="text-white/60 mb-10 text-sm md:text-base">Gia nhập cộng đồng kiện tướng Liên Quân hàng đầu để cùng nhau tỏa sáng trên đấu trường danh vọng.</p>
                    <button
                        onClick={handleRegister}
                        className="px-12 py-5 rounded-2xl bg-primary hover:bg-primary/80 transition-all font-bold uppercase tracking-widest shadow-2xl shadow-primary/40"
                    >
                        Đăng Ký Tài Khoản Miễn Phí
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-6 md:px-12 py-12 border-t border-white/5 bg-black/40">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <img
                        src="https://i.ibb.co/Y7zWPJVZ/liqi88-2026.png"
                        alt="ArenaHub Logo"
                        className="h-14 w-auto opacity-50"
                    />
                    <p className="text-[10px] md:text-xs text-white/30 uppercase tracking-[2px]">
                        © 2024 ArenaHub Social Platform. All Rights Reserved.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-white/30 hover:text-white transition-colors text-xs">Điều khoản</a>
                        <a href="#" className="text-white/30 hover:text-white transition-colors text-xs">Bảo mật</a>
                        <a href="#" className="text-white/30 hover:text-white transition-colors text-xs">Liên hệ</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
