import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

function Testimonials() {
    const fallbackTestimonials = [
        {
            quote: '"The procurement process was seamless. They found a high-quality sedan at the auction and handled all the shipping and customs details for me."',
            name: 'Chidi Okafor',
            location: 'Lagos, Nigeria'
        },
        {
            quote: '"Moving industrial equipment across borders is usually a nightmare, but OD Automotive\'s tracking kept me updated every step of the way."',
            name: 'Kofi Mensah',
            location: 'Accra, Ghana'
        },
        {
            quote: '"Professional, fast, and transparent. The $1000 deposit made me feel confident they were serious about winning the bid on my behalf."',
            name: 'Abebe Bekele',
            location: 'Addis Ababa, Ethiopia'
        }
    ];

    const [testimonials, setTestimonials] = useState(fallbackTestimonials);
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const scrollRef = useRef(null);
    const pauseTimeoutRef = useRef(null);

    useEffect(() => {
        fetchTestimonials();
    }, []);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer || testimonials.length === 0 || isPaused) return;

        let scrollInterval;
        const startScrolling = () => {
            scrollInterval = setInterval(() => {
                if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
                    scrollContainer.scrollLeft = 0;
                } else {
                    scrollContainer.scrollLeft += 1;
                }
            }, 30);
        };

        startScrolling();

        return () => {
            if (scrollInterval) clearInterval(scrollInterval);
        };
    }, [testimonials, loading, isPaused]);

    const scrollNext = () => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const cardWidth = scrollContainer.querySelector('div').offsetWidth + 24; // card width + gap
        scrollContainer.scrollLeft += cardWidth;

        // Pause auto-scroll and resume after 5 seconds
        setIsPaused(true);
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), 5000);
    };

    const scrollPrev = () => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const cardWidth = scrollContainer.querySelector('div').offsetWidth + 24; // card width + gap
        scrollContainer.scrollLeft -= cardWidth;

        // Pause auto-scroll and resume after 5 seconds
        setIsPaused(true);
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), 5000);
    };

    const fetchTestimonials = async () => {
        try {
            const data = await api.getFeaturedTestimonials();
            if (data && data.length > 0) {
                setTestimonials(data);
            }
        } catch (error) {
            console.error('Error fetching testimonials:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="py-xl bg-surface-container-lowest">
                <div className="max-w-container-max mx-auto px-lg">
                    <div className="text-center mb-lg space-y-xs">
                        <span className="text-secondary-container font-label-md text-label-md tracking-widest uppercase">
                            Client Success Stories
                        </span>
                        <h2 className="font-headline-lg text-headline-lg text-white">
                            Trusted by Professionals
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-primary-container p-lg rounded-xl border border-white/5 animate-pulse h-64"></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (!testimonials || testimonials.length === 0) {
        return (
            <section className="py-xl bg-surface-container-lowest">
                <div className="max-w-container-max mx-auto px-lg">
                    <div className="text-center">
                        <p className="text-on-surface-variant">No testimonials available at this time.</p>
                    </div>
                </div>
            </section>
        );
    }

    const duplicatedTestimonials = [...testimonials, ...testimonials];

    return (
        <section className="py-xl bg-surface-container-lowest overflow-hidden">
            <div className="max-w-container-max mx-auto px-4 md:px-lg">
                <div className="text-center mb-lg space-y-xs px-4">
                    <span className="text-secondary-container font-label-md text-label-md tracking-widest uppercase">
                        Client Success Stories
                    </span>
                    <h2 className="font-headline-lg text-[22px] md:text-headline-lg text-white">
                        Trusted by Professionals
                    </h2>
                </div>
                <div className="relative">
                    {/* Previous Button */}
                    <button
                        onClick={scrollPrev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-secondary-container hover:bg-secondary text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 hidden md:flex items-center justify-center"
                        aria-label="Previous testimonial"
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>

                    {/* Next Button */}
                    <button
                        onClick={scrollNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-secondary-container hover:bg-secondary text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 hidden md:flex items-center justify-center"
                        aria-label="Next testimonial"
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>

                    <div 
                        ref={scrollRef}
                        className="flex gap-6 overflow-x-hidden scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                    {duplicatedTestimonials.map((testimonial, index) => (
                        <div 
                            key={index} 
                            className="bg-primary-container p-lg rounded-xl border border-white/5 flex flex-col justify-between flex-shrink-0 w-[90%] sm:w-[400px] md:w-[380px] hover:border-secondary-container/50 transition-all duration-300"
                        >
                            <div>
                                <span className="material-symbols-outlined text-secondary-container text-4xl mb-md">
                                    format_quote
                                </span>
                                <p className="font-body-md text-body-md text-on-surface-variant mb-lg italic">
                                    {testimonial.quote}
                                </p>
                            </div>
                            <div>
                                <p className="font-title-md text-white">{testimonial.name}</p>
                                <p className="font-caption text-secondary-container">{testimonial.location}</p>
                                {testimonial.social_link && (
                                    <a href={testimonial.social_link} target="_blank" rel="noopener noreferrer"
                                       className="inline-flex items-center gap-1 mt-sm text-sm text-primary hover:text-secondary transition-colors">
                                        <span className="material-symbols-outlined text-sm">link</span>
                                        View Profile
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                    </div>

                    {/* Mobile Navigation Buttons */}
                    <div className="flex justify-center gap-4 mt-6 md:hidden">
                        <button
                            onClick={scrollPrev}
                            className="bg-secondary-container hover:bg-secondary text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
                            aria-label="Previous testimonial"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button
                            onClick={scrollNext}
                            className="bg-secondary-container hover:bg-secondary text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
                            aria-label="Next testimonial"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    );
}

export default Testimonials;
