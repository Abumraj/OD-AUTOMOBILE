import React, { useState, useEffect } from 'react';

function AboutPage() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAboutContent();
    }, []);

    const fetchAboutContent = async () => {
        try {
            const response = await fetch('/api/about-us/published');
            const data = await response.json();
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

    const getSection = (key) => sections.find(s => s.section_key === key);
    const getLeaders = () => sections.filter(s => s.section_key.startsWith('leader_'));
    const getTimeline = () => sections.filter(s => s.section_key.startsWith('timeline_'));

    const hero = getSection('hero');
    const mission = getSection('mission');
    const vision = getSection('vision');
    const leaders = getLeaders();
    const timeline = getTimeline();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-on-surface-variant">Loading...</div>
            </div>
        );
    }

    const parseMetadata = (section) => {
        try {
            return section?.metadata ? JSON.parse(section.metadata) : {};
        } catch {
            return {};
        }
    };

    return (
        <main>
            {/* Hero Section */}
            {hero && (
                <section className="relative overflow-hidden pt-lg md:pt-xl pb-md md:pb-lg">
                    <div className="relative z-10 max-w-container-max mx-auto px-md md:px-lg">
                        <div className="flex flex-col md:flex-row gap-md md:gap-lg items-center">
                            <div className="md:w-1/2 space-y-sm md:space-y-md">
                                {hero.subtitle && (
                                    <span className="inline-block py-1 px-3 bg-secondary-container/20 text-secondary border border-secondary/30 rounded-full font-label-md text-label-md text-xs md:text-sm">
                                        {hero.subtitle}
                                    </span>
                                )}
                                <h1 className="font-display-lg text-[28px] md:text-display-lg lg:text-[64px] text-white leading-tight">
                                    {hero.title.split(':')[0]}: <span className="text-secondary">{hero.title.split(':')[1]}</span>
                                </h1>
                                <p className="font-body-lg text-base md:text-body-lg text-on-surface-variant max-w-xl">
                                    {hero.content}
                                </p>
                            </div>
                            <div className="md:w-1/2 relative w-full">
                                {hero.image_url && (
                                    <div className="rounded-xl overflow-hidden shadow-2xl border border-white/5">
                                        <img className="w-full aspect-[4/3] object-cover" src={hero.image_url} alt={hero.title} />
                                    </div>
                                )}
                                {parseMetadata(hero).stat_value && (
                                    <div className="absolute -bottom-6 -left-6 bg-primary-container/40 backdrop-blur-xl p-md rounded-xl hidden md:block border border-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-secondary p-3 rounded-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-on-secondary">groups</span>
                                            </div>
                                            <div>
                                                <p className="font-title-md text-title-md text-white">{parseMetadata(hero).stat_value}</p>
                                                <p className="font-caption text-caption text-on-surface-variant">{parseMetadata(hero).stat_label}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Mission & Vision Bento Grid */}
            {(mission || vision) && (
                <section className="py-md md:py-xl bg-surface-container-low">
                    <div className="max-w-container-max mx-auto px-md md:px-lg">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-sm md:gap-md">
                            {mission && (
                                <div className="md:col-span-7 bg-primary-container/40 backdrop-blur-xl p-md md:p-lg rounded-xl border-l-4 border-l-secondary flex flex-col justify-between group transition-all hover:translate-y-[-4px] border border-white/10">
                                    <div>
                                        <div className="bg-primary-container w-12 h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center mb-sm md:mb-md">
                                            <span className="material-symbols-outlined text-secondary text-[24px] md:text-[32px]">{parseMetadata(mission).icon || 'rocket_launch'}</span>
                                        </div>
                                        <h2 className="font-headline-lg text-xl md:text-headline-lg text-white mb-sm md:mb-base">{mission.title}</h2>
                                        <p className="font-body-lg text-sm md:text-body-lg text-on-surface-variant">{mission.content}</p>
                                    </div>
                                    {mission.subtitle && (
                                        <div className="mt-lg pt-md border-t border-white/10 flex items-center justify-between">
                                            <span className="font-label-md text-label-md text-secondary">{mission.subtitle}</span>
                                            <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">trending_flat</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            {vision && (
                                <div className="md:col-span-5 bg-primary-container p-md md:p-lg rounded-xl relative overflow-hidden group transition-all hover:translate-y-[-4px]">
                                    <div className="relative z-10">
                                        <div className="bg-white/10 w-12 h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center mb-sm md:mb-md">
                                            <span className="material-symbols-outlined text-white text-[24px] md:text-[32px]">{parseMetadata(vision).icon || 'visibility'}</span>
                                        </div>
                                        <h2 className="font-headline-lg text-xl md:text-headline-lg text-white mb-sm md:mb-base">{vision.title}</h2>
                                        <p className="font-body-md text-sm md:text-body-md text-on-surface-variant">{vision.content}</p>
                                    </div>
                                    <div className="absolute -right-8 -bottom-8 opacity-5 transition-transform group-hover:scale-110 duration-700">
                                        <span className="material-symbols-outlined text-[200px]">language</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Leadership Section */}
            {leaders.length > 0 && (
                <section className="py-md md:py-xl">
                    <div className="max-w-container-max mx-auto px-md md:px-lg">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-md md:mb-lg">
                            <div className="max-w-xl">
                                <span className="font-label-md text-xs md:text-label-md text-secondary tracking-widest mb-xs md:mb-base block">TEAM</span>
                                <h2 className="font-headline-lg text-2xl md:text-headline-lg lg:text-[40px] text-white">Meet the Leadership</h2>
                            </div>
                            <p className="text-on-surface-variant text-xs md:text-sm mt-xs md:mt-0">Scroll to see all →</p>
                        </div>
                        <div className="overflow-x-auto pb-sm md:pb-md -mx-md md:-mx-lg px-md md:px-lg" style={{scrollbarWidth: 'thin', scrollbarColor: '#ea6b1b #1e2020'}}>
                            <div className="flex gap-sm md:gap-lg min-w-max">
                                {leaders.map((leader) => (
                                    <div key={leader.id} className="group flex flex-col w-[280px] md:w-[400px] bg-surface-container-high rounded-xl overflow-hidden border border-white/5 flex-shrink-0">
                                        {leader.image_url && (
                                            <div className="w-full h-[200px] md:h-[300px] overflow-hidden">
                                                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={leader.image_url} alt={leader.title} />
                                            </div>
                                        )}
                                        <div className="p-sm md:p-md flex flex-col space-y-xs md:space-y-base">
                                            <h3 className="font-headline-lg text-lg md:text-headline-lg text-white">{leader.title}</h3>
                                            {leader.subtitle && (
                                                <p className="font-label-md text-xs md:text-label-md text-secondary uppercase tracking-wider">{leader.subtitle}</p>
                                            )}
                                            <p className="font-body-md text-xs md:text-body-md text-on-surface-variant">{leader.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Timeline Section */}
            {timeline.length > 0 && (
                <section className="py-md md:py-xl bg-surface-container-lowest">
                    <div className="max-w-container-max mx-auto px-md md:px-lg">
                        <div className="text-center mb-md md:mb-xl">
                            <h2 className="font-headline-lg text-2xl md:text-headline-lg lg:text-[40px] text-white">Decade of Excellence</h2>
                            <p className="text-on-surface-variant text-sm md:text-base mt-xs md:mt-base">Tracing our growth from a small firm to an industry titan.</p>
                        </div>
                        <div className="relative">
                            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-[2px] bg-white/10 hidden md:block"></div>
                            <div className="space-y-md md:space-y-lg relative">
                                {timeline.map((item, index) => {
                                    const metadata = parseMetadata(item);
                                    const isHighlight = metadata.highlight;
                                    return (
                                        <div key={item.id} className={`flex flex-col md:flex-row items-center justify-between ${index % 2 === 0 ? 'md:flex-row-reverse' : ''} group`}>
                                            <div className={`w-full md:w-[45%] p-sm md:p-md bg-primary-container/40 backdrop-blur-xl rounded-xl border border-white/10 ${index % 2 === 0 ? '' : 'md:border-r-4 md:border-r-secondary/40'} ${index % 2 !== 0 ? '' : 'md:border-l-4 md:border-l-secondary/40'}`}>
                                                <span className="font-headline-lg text-xl md:text-headline-lg text-secondary mb-xs block">{item.subtitle}</span>
                                                <h4 className="font-title-md text-base md:text-title-md text-white mb-xs">{item.title}</h4>
                                                <p className="font-body-md text-sm md:text-body-md text-on-surface-variant">{item.content}</p>
                                            </div>
                                            <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full hidden md:flex items-center justify-center ${isHighlight ? 'bg-secondary outline outline-8 outline-secondary/20' : 'bg-white/30'}`}></div>
                                            <div className="w-full md:w-[45%]"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="py-md md:py-xl">
                <div className="max-w-container-max mx-auto px-md md:px-lg">
                    <div className="bg-primary-container p-md md:p-xl rounded-xl relative overflow-hidden flex flex-col items-center text-center">
                        <div className="relative z-10 space-y-sm md:space-y-md max-w-2xl">
                            <h2 className="font-display-lg text-2xl md:text-display-lg text-white">Ready to move with precision?</h2>
                            <p className="font-body-lg text-sm md:text-body-lg text-on-surface-variant">Join thousands of clients who trust OD Automotive for high-stakes vehicle transport.</p>
                            <div className="flex flex-col sm:flex-row gap-sm md:gap-md justify-center pt-sm md:pt-md">
                                <a href="/quote" className="bg-secondary-container text-white px-md md:px-lg py-xs md:py-sm rounded-lg font-title-md text-sm md:text-title-md hover:scale-105 transition-transform">
                                    Get a Quote
                                </a>
                                <a href="/contact" className="border border-white/20 text-white px-md md:px-lg py-xs md:py-sm rounded-lg font-title-md text-sm md:text-title-md hover:bg-white/5 transition-colors">
                                    Contact Expert
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default AboutPage;
