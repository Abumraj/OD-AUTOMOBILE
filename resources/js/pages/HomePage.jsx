import React from 'react';
import Hero from '../components/Hero';
import DepositSection from '../components/DepositSection';
import ServicesSection from '../components/ServicesSection';
import TrackingSection from '../components/TrackingSection';
import PerformanceCounter from '../components/PerformanceCounter';
import Testimonials from '../components/Testimonials';

function HomePage() {
    return (
        <>
            <Hero />
            <DepositSection />
            <ServicesSection />
            <TrackingSection />
            <PerformanceCounter />
            <Testimonials />
        </>
    );
}

export default HomePage;
