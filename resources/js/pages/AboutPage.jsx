import React, { useState, useEffect } from 'react';
import { useScrollAnimation, fadeInUp } from '../hooks/useScrollAnimation';

function AboutPage() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [headerRef, headerVisible] = useScrollAnimation();

    useEffect(() => {
        fetchAboutContent();
    }, []);

    const fetchAboutContent = async () => {
        try {
            const response = await fetch('/api/about-us/published');
            const data = await response.json();
            // Filter only published sections and sort by display order
            const publishedSections = data
                .filter(section => section.is_published)
                .sort((a, b) => a.display_order - b.display_order);
            setSections(publishedSections);
        } catch (error) {
            console.error('Error fetching About Us content:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-primary-container py-xl">
                <div className="max-w-container-max mx-auto px-4 md:px-lg">
                    <div className="animate-pulse space-y-lg">
                        <div className="h-12 bg-surface-container rounded w-2/3 mx-auto"></div>
                        <div className="h-6 bg-surface-container rounded w-1/2 mx-auto"></div>
                        <div className="space-y-md">
                            <div className="h-4 bg-surface-container rounded"></div>
                            <div className="h-4 bg-surface-container rounded"></div>
                            <div className="h-4 bg-surface-container rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary-container">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-surface-container-low to-primary-container py-xl md:py-2xl">
                <div className="max-w-container-max mx-auto px-4 md:px-lg">
                    <div ref={headerRef} className="text-center" style={fadeInUp(headerVisible)}>
                        <span className="text-secondary-container font-label-md text-label-md tracking-widest uppercase">
                            About Us
                        </span>
                        <h1 className="font-display-lg text-[32px] md:text-display-lg text-white mt-sm mb-md">
                            OD Automotive & Logistics
                        </h1>
                        <p className="font-body-lg text-base md:text-body-lg text-on-surface-variant max-w-3xl mx-auto">
                            Your trusted partner in global automotive logistics and vehicle procurement
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="max-w-container-max mx-auto px-4 md:px-lg py-xl">
                <div className="space-y-2xl">
                    {sections.map((section, index) => (
                        <div 
                            key={section.id}
                            className={`bg-surface-container-low rounded-xl p-lg md:p-xl border border-white/5 ${
                                index % 2 === 0 ? 'md:mr-xl' : 'md:ml-xl'
                            }`}
                        >
                            <h2 className="font-display-sm text-[24px] md:text-display-sm text-white mb-md">
                                {section.title}
                            </h2>
                            <div 
                                className="prose prose-invert max-w-none
                                    prose-headings:text-white prose-headings:font-bold
                                    prose-p:text-on-surface-variant prose-p:text-base prose-p:leading-relaxed
                                    prose-a:text-secondary-container prose-a:no-underline hover:prose-a:underline
                                    prose-strong:text-white prose-strong:font-bold
                                    prose-ul:text-on-surface-variant prose-ul:list-disc prose-ul:pl-md
                                    prose-ol:text-on-surface-variant prose-ol:list-decimal prose-ol:pl-md
                                    prose-li:text-on-surface-variant prose-li:mb-xs
                                    prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                                    prose-h1:mb-md prose-h2:mb-sm prose-h3:mb-sm
                                    prose-p:mb-md"
                                dangerouslySetInnerHTML={{ __html: section.content }}
                            />
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="mt-2xl bg-gradient-to-r from-secondary-container to-secondary-container/80 rounded-xl p-xl text-center">
                    <h3 className="font-display-sm text-[24px] md:text-display-sm text-white mb-md">
                        Ready to Get Started?
                    </h3>
                    <p className="font-body-lg text-base md:text-body-lg text-white/90 mb-lg max-w-2xl mx-auto">
                        Whether you need vehicle procurement, shipping, or complete logistics solutions, we're here to help.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-md justify-center">
                        <a
                            href="/quote"
                            className="bg-white text-secondary-container px-xl py-md rounded-lg font-bold hover:bg-white/90 transition-all inline-flex items-center justify-center gap-sm"
                        >
                            Request a Quote
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </a>
                        <a
                            href="/contact"
                            className="bg-transparent border-2 border-white text-white px-xl py-md rounded-lg font-bold hover:bg-white/10 transition-all inline-flex items-center justify-center gap-sm"
                        >
                            Contact Us
                            <span className="material-symbols-outlined">mail</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AboutPage;
