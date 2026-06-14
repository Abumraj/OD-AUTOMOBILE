import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Hero() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [carouselImages, setCarouselImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCarouselImages();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (carouselImages.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [carouselImages]);

    const fetchCarouselImages = async () => {
        try {
            const response = await fetch('/api/carousel/active');
            const data = await response.json();
            const activeImages = data.filter(img => img.is_active);
            setCarouselImages(activeImages.length > 0 ? activeImages : [{
                title: 'We Ship.',
                description: 'Unwavering reliability and industrial precision in high-stakes automotive transport.',
                image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbdlHYn-Yu84Wp3SDga2Jy1adaPOsWsK_zp3w1zSryIm4AaMwwCmZAsfD6ba7S4W6DTHVIqlNfS80OHLAdKMB6lyixjBsIiwXh_n9-einAoq77MflGQcc65exnR0okE6vJsCkIb9yMMuNCtCcT6rnnlYszAi6RP04xm0aPbWXWHbXR9E6xvUtwzBTxrEYhxVRh0bSXLTF17ChgsQPmZjNt-ggP_EHc5TR-9pfR6CVqkQRCB536h8hgprmmEXV5wUCNffAUJHRlFyL-',
                button_text: 'Get a Quote',
                button_link: '/quote'
            }]);
        } catch (error) {
            console.error('Error fetching carousel images:', error);
            setCarouselImages([{
                title: 'We Ship.',
                description: 'Unwavering reliability and industrial precision in high-stakes automotive transport.',
                image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbdlHYn-Yu84Wp3SDga2Jy1adaPOsWsK_zp3w1zSryIm4AaMwwCmZAsfD6ba7S4W6DTHVIqlNfS80OHLAdKMB6lyixjBsIiwXh_n9-einAoq77MflGQcc65exnR0okE6vJsCkIb9yMMuNCtCcT6rnnlYszAi6RP04xm0aPbWXWHbXR9E6xvUtwzBTxrEYhxVRh0bSXLTF17ChgsQPmZjNt-ggP_EHc5TR-9pfR6CVqkQRCB536h8hgprmmEXV5wUCNffAUJHRlFyL-',
                button_text: 'Get a Quote',
                button_link: '/quote'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const currentImage = carouselImages[currentIndex] || {};

    if (loading) {
        return (
            <header className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-primary-container">
                <div className="animate-pulse text-on-surface-variant">Loading...</div>
            </header>
        );
    }

    return (
        <header className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-primary-container">
            <div className="absolute inset-0 z-0">
                {carouselImages.map((image, index) => (
                    <img 
                        key={index}
                        className="w-full h-full object-cover absolute inset-0" 
                        alt={image.title}
                        src={image.image_url}
                        style={{
                            opacity: index === currentIndex && isLoaded ? 1 : 0,
                            transform: index === currentIndex && isLoaded ? 'scale(1)' : 'scale(1.05)',
                            transition: 'opacity 1s ease-out, transform 1.5s ease-out'
                        }}
                    />
                ))}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-container/90 via-primary-container/60 to-transparent"></div>
            </div>
            <div className="relative z-10 max-w-container-max mx-auto px-lg w-full">
                <div className="max-w-2xl space-y-md">
                    <h1
                        className="font-display-lg text-[28px] md:text-display-lg text-white leading-tight"
                        style={{
                            opacity: isLoaded ? 1 : 0,
                            transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
                            transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s'
                        }}
                    >
                        {currentImage.title}
                    </h1>
                    {currentImage.description && (
                        <p
                            className="font-body-lg text-base md:text-body-lg text-on-surface-variant max-w-lg"
                            style={{
                                opacity: isLoaded ? 1 : 0,
                                transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
                                transition: 'opacity 0.8s ease-out 0.4s, transform 0.8s ease-out 0.4s'
                            }}
                        >
                            {currentImage.description}
                        </p>
                    )}
                    <div 
                        className="flex flex-wrap gap-md pt-base"
                        style={{
                            opacity: isLoaded ? 1 : 0,
                            transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
                            transition: 'opacity 0.8s ease-out 0.6s, transform 0.8s ease-out 0.6s'
                        }}
                    >
                        {currentImage.button_text && currentImage.button_link && (
                            <Link 
                                to={currentImage.button_link}
                                className="bg-secondary-container text-on-secondary-container font-label-md text-label-md px-6 py-2.5 rounded-xl hover:opacity-90 hover:scale-105 transition-all shadow-lg active:scale-95"
                            >
                                {currentImage.button_text}
                            </Link>
                        )}
                        <Link 
                            to="/tracking" 
                            className="border-2 border-white text-white font-label-md text-label-md px-6 py-2.5 rounded-xl hover:bg-white/10 hover:scale-105 transition-all active:scale-95"
                        >
                            Track Shipment
                        </Link>
                    </div>
                </div>
                {carouselImages.length > 1 && (
                    <div className="absolute bottom-lg left-1/2 transform -translate-x-1/2 flex gap-sm">
                        {carouselImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    index === currentIndex 
                                        ? 'bg-secondary-container w-8' 
                                        : 'bg-white/50 hover:bg-white/80'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </header>
    );
}

export default Hero;
