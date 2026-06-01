import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        fetchTestimonials();
    }, []);

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
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="bg-primary-container p-lg rounded-xl border border-white/5 flex flex-col justify-between hover:scale-105 hover:border-secondary-container/50 transition-all duration-300">
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
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Testimonials;
