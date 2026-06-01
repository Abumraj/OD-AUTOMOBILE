import { useEffect, useRef, useState } from 'react';

export const useScrollAnimation = (options = {}) => {
    const {
        threshold = 0.1,
        triggerOnce = true,
        rootMargin = '0px'
    } = options;

    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (triggerOnce && ref.current) {
                        observer.unobserve(ref.current);
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            {
                threshold,
                rootMargin
            }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [threshold, triggerOnce, rootMargin]);

    return [ref, isVisible];
};

export const fadeInUp = (isVisible, delay = 0) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
    transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`
});

export const fadeIn = (isVisible, delay = 0) => ({
    opacity: isVisible ? 1 : 0,
    transition: `opacity 0.8s ease-out ${delay}s`
});

export const slideInLeft = (isVisible, delay = 0) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateX(0)' : 'translateX(-50px)',
    transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`
});

export const slideInRight = (isVisible, delay = 0) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateX(0)' : 'translateX(50px)',
    transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`
});

export const scaleIn = (isVisible, delay = 0) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.9)',
    transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`
});

export const staggerChildren = (index, baseDelay = 0) => baseDelay + (index * 0.1);
