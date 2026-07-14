import React, { useState, useEffect } from 'react';
import { useScrollAnimation, fadeInUp, slideInLeft, staggerChildren } from '../hooks/useScrollAnimation';

function ServicesSection() {
    const [headerRef, headerVisible] = useScrollAnimation();
    const [gridRef, gridVisible] = useScrollAnimation();
    const [services, setServices] = useState([]);
    const [sectionData, setSectionData] = useState({
        title: 'Full-Spectrum Logistics',
        subtitle: 'Our Expertise',
        description: 'Systematic approach to information density and modern efficiency for every stage of the automotive lifecycle.'
    });

    useEffect(() => {
        fetchHomepageServices();
    }, []);

    const fetchHomepageServices = async () => {
        try {
            const response = await fetch('/api/homepage-services');
            const data = await response.json();
            
            // Filter only active services
            const activeServices = data.services.filter(service => service.is_active);
            setServices(activeServices);
            
            setSectionData({
                title: data.title || 'Full-Spectrum Logistics',
                subtitle: data.subtitle || 'Our Expertise',
                description: data.description || 'Systematic approach to information density and modern efficiency for every stage of the automotive lifecycle.'
            });
        } catch (error) {
            console.error('Error fetching homepage services:', error);
        }
    };

    return (
        <section className="py-xl bg-surface-container-lowest">
            <div className="max-container-max mx-auto px-lg">
                <div 
                    ref={headerRef}
                    className="flex flex-col md:flex-row justify-between items-end mb-lg gap-md"
                    style={fadeInUp(headerVisible)}
                >
                    <div className="space-y-xs">
                        <span className="text-secondary-container font-label-md text-label-md tracking-widest uppercase">
                            {sectionData.subtitle}
                        </span>
                        <h2 className="font-headline-lg text-[22px] md:text-headline-lg text-white">
                            {sectionData.title}
                        </h2>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                        {sectionData.description}
                    </p>
                </div>
                <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                    {services.map((service, index) => (
                        <div 
                            key={index} 
                            className="bg-primary-container p-lg rounded-xl border border-white/5 hover:border-secondary-container/50 hover:scale-105 hover:shadow-2xl transition-all group cursor-pointer shadow-xl"
                            style={fadeInUp(gridVisible, staggerChildren(index))}
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-md">
                                    <span className="material-symbols-outlined text-secondary-container text-3xl md:text-4xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                                        {service.icon}
                                    </span>
                                    <h3 className="font-title-md text-title-md text-white">
                                        {service.title}
                                    </h3>
                                    <p className="font-body-md text-body-md text-on-surface-variant">
                                        {service.description}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-secondary-container group-hover:translate-x-1 transition-all text-xl md:text-2xl">
                                    arrow_forward
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ServicesSection;
