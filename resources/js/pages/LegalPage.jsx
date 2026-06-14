import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useScrollAnimation, fadeInUp } from '../hooks/useScrollAnimation';

function LegalPage() {
    const { slug } = useParams();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [headerRef, headerVisible] = useScrollAnimation();
    const [contentRef, contentVisible] = useScrollAnimation();

    useEffect(() => {
        fetchPage();
    }, [slug]);

    const fetchPage = async () => {
        try {
            console.log('=== LEGAL PAGE DEBUG ===');
            console.log('Fetching legal page:', slug);
            const response = await fetch(`/api/legal-pages/${slug}`);
            console.log('Response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Legal page data:', data);
                console.log('Content length:', data.content?.length);
                setPage(data);
                console.log('Page state set successfully');
                document.title = `${data.title} - OD Automotive`;
            } else {
                setError('Page not found');
            }
        } catch (error) {
            console.error('Error fetching page:', error);
            setError('Failed to load page');
        } finally {
            setLoading(false);
        }
    };

    console.log('=== RENDER STATE ===');
    console.log('Loading:', loading);
    console.log('Error:', error);
    console.log('Page:', page);

    if (loading) {
        console.log('Rendering loading state...');
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="animate-pulse text-on-surface-variant">Loading...</div>
            </div>
        );
    }

    if (error || !page) {
        console.log('Rendering error/not found state');
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="text-center">
                    <h1 className="font-display-md text-white mb-md">Page Not Found</h1>
                    <p className="text-on-surface-variant">The page you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    console.log('Rendering legal page content');
    return (
        <div className="min-h-screen bg-surface">
            <div className="px-4 md:px-lg py-xl">
                <div ref={headerRef} className="max-w-4xl mx-auto mb-xl">
                    <h1 className="font-display-lg text-[28px] md:text-display-lg text-white mb-md">
                        {page.title}
                    </h1>
                    {page.meta_description && (
                        <p className="font-body-lg text-base md:text-body-lg text-on-surface-variant">
                            {page.meta_description}
                        </p>
                    )}
                    <div className="h-1 w-20 bg-secondary-container mt-md"></div>
                </div>

                <div
                    ref={contentRef}
                    className="max-w-4xl mx-auto bg-surface-container rounded-xl p-4 md:p-lg border border-white/10"
                >
                    <div 
                        className="legal-content"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                        style={{
                            color: '#e0e0e0',
                            fontSize: '1rem',
                            lineHeight: '1.75'
                        }}
                    />
                </div>

                <div className="max-w-4xl mx-auto mt-lg text-center">
                    <p className="font-caption text-on-surface-variant">
                        Last updated: {new Date(page.updated_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>
            </div>

            <style>{`
                .legal-content {
                    color: #e0e0e0;
                    font-size: 1rem;
                    line-height: 1.75;
                }
                .legal-content h2 {
                    font-size: 1.75rem;
                    font-weight: 600;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    color: #ffffff;
                }
                .legal-content h3 {
                    font-size: 1.35rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    color: #ffffff;
                }
                .legal-content h4 {
                    font-size: 1.15rem;
                    font-weight: 600;
                    margin-top: 1.25rem;
                    margin-bottom: 0.5rem;
                    color: #ffffff;
                }
                .legal-content p {
                    margin-bottom: 1rem;
                    line-height: 1.75;
                    color: #e0e0e0;
                }
                .legal-content ul, .legal-content ol {
                    margin-left: 1.5rem;
                    margin-bottom: 1rem;
                    padding-left: 0.5rem;
                }
                .legal-content li {
                    margin-bottom: 0.5rem;
                    color: #e0e0e0;
                }
                .legal-content a {
                    color: #ff9800;
                    text-decoration: underline;
                }
                .legal-content a:hover {
                    opacity: 0.8;
                }
                .legal-content strong {
                    color: #ffffff;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}

export default LegalPage;
