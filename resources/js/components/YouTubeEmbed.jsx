import React, { useState } from 'react';

function YouTubeEmbed({ videoId, title = 'Video' }) {
    const [showModal, setShowModal] = useState(false);

    if (!videoId) return null;

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="relative w-full aspect-video rounded-lg overflow-hidden group cursor-pointer bg-black/50 hover:bg-black/30 transition-all"
            >
                <img
                    src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                    alt={title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 rounded-full p-md group-hover:scale-110 transition-transform shadow-lg">
                        <span className="material-symbols-outlined text-white text-5xl">play_arrow</span>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-md">
                    <p className="text-white font-label-md flex items-center gap-xs">
                        <span className="material-symbols-outlined text-sm">play_circle</span>
                        Watch How It Works
                    </p>
                </div>
            </button>

            {showModal && (
                <div 
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-md"
                    onClick={() => setShowModal(false)}
                >
                    <div 
                        className="relative w-full max-w-5xl aspect-video"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute -top-12 right-0 text-white hover:text-secondary-container transition-colors"
                        >
                            <span className="material-symbols-outlined text-4xl">close</span>
                        </button>
                        <iframe
                            className="w-full h-full rounded-lg"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                            title={title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}
        </>
    );
}

export default YouTubeEmbed;
