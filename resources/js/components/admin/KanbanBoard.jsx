import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function KanbanBoard() {
    const [kanbanData, setKanbanData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchKanbanData();
    }, []);

    const fetchKanbanData = async () => {
        try {
            const data = await api.getKanbanData();
            setKanbanData(data);
        } catch (error) {
            console.error('Error fetching kanban data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const then = new Date(date);
        const diffInMs = now - then;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInDays > 0) return `${diffInDays}d ago`;
        if (diffInHours > 0) return `${diffInHours}h ago`;
        return 'Just now';
    };

    const columnConfig = [
        { key: 'procurement', title: 'Procurement', color: 'bg-blue-400' },
        { key: 'shipping', title: 'Shipping', color: 'bg-secondary' },
        { key: 'at_port', title: 'At Port', color: 'bg-yellow-400' },
        { key: 'clearing', title: 'Clearing', color: 'bg-purple-400' },
        { key: 'delivery', title: 'Delivery', color: 'bg-green-400' }
    ];

    const columns = kanbanData ? columnConfig.map(config => ({
        title: config.title,
        color: config.color,
        count: kanbanData[config.key]?.count || 0,
        cards: (kanbanData[config.key]?.cards || []).map(card => ({
            customer: card.customer,
            vehicle: card.vehicle,
            id: card.tracking_id,
            time: getTimeAgo(card.updated_at),
            starred: card.is_starred,
            delayed: card.is_delayed,
            status: card.status,
            vessel: card.vessel_name,
            progress: card.progress,
            completed: config.key === 'delivery'
        }))
    })) : [];

    if (loading) {
        return (
            <div className="flex flex-col h-full min-h-[600px]">
                <div className="flex items-center justify-between mb-md">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Operational Pipeline</h2>
                </div>
                <div className="flex space-x-md overflow-x-auto pb-lg">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex-shrink-0 w-72 bg-surface-container-low rounded-lg p-sm border border-outline-variant/20 animate-pulse h-96" style={{ minWidth: '280px' }}></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-[600px]">
            <div className="flex items-center justify-between mb-md">
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Operational Pipeline</h2>
                <div className="flex items-center space-x-sm">
                    <button className="bg-surface-container-high px-4 py-2 border border-outline-variant rounded flex items-center space-x-2 text-on-surface-variant hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-sm">filter_list</span>
                        <span className="font-label-md">Filter Views</span>
                    </button>
                    <button className="bg-surface-container-high px-4 py-2 border border-outline-variant rounded flex items-center space-x-2 text-on-surface-variant hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span className="font-label-md">Export CSV</span>
                    </button>
                </div>
            </div>

            <div className="flex space-x-md overflow-x-auto pb-lg snap-x">
                {columns.map((column, colIndex) => (
                    <div
                        key={colIndex}
                        className="kanban-column flex-shrink-0 flex flex-col w-72 bg-surface-container-low rounded-lg p-sm border border-outline-variant/20 snap-start"
                        style={{ minWidth: '280px' }}
                    >
                        <div className="flex items-center justify-between mb-md px-1">
                            <div className="flex items-center space-x-2">
                                <span className={`w-2 h-2 rounded-full ${column.color}`}></span>
                                <h3 className="font-title-md text-on-surface text-sm uppercase tracking-wider">{column.title}</h3>
                            </div>
                            <span className="bg-surface-container-highest px-2 py-0.5 rounded text-[10px] font-bold text-on-surface-variant">
                                {column.count.toString().padStart(2, '0')}
                            </span>
                        </div>

                        <div className="space-y-sm flex-grow">
                            {column.cards.map((card, cardIndex) => (
                                <div
                                    key={cardIndex}
                                    className={`bg-surface-container-high p-md rounded border border-outline-variant/40 hover:border-secondary transition-all cursor-move shadow-sm ${
                                        card.delayed ? 'border-l-4 border-l-red-500' : ''
                                    } ${card.completed ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-label-md text-on-surface font-bold">{card.customer}</p>
                                        {card.starred && (
                                            <span
                                                className="material-symbols-outlined text-on-surface-variant text-sm"
                                                style={{ fontVariationSettings: "'FILL' 1" }}
                                            >
                                                stars
                                            </span>
                                        )}
                                        {card.delayed && (
                                            <span className="bg-error-container text-on-error-container text-[8px] px-1 rounded">DELAY</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-on-surface-variant mb-1">{card.vehicle}</p>
                                    {card.vessel && (
                                        <div className="flex items-center text-[10px] text-secondary mb-3">
                                            <span className="material-symbols-outlined text-[12px] mr-1">fluid</span>
                                            <span>{card.vessel}</span>
                                        </div>
                                    )}
                                    {card.progress !== undefined && (
                                        <div className="w-full bg-surface-container h-1 rounded-full mb-3">
                                            <div className="bg-secondary h-full rounded-full" style={{ width: `${card.progress}%` }}></div>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="bg-primary-container text-[10px] px-2 py-0.5 rounded text-primary border border-primary/20">
                                            {card.id}
                                        </span>
                                        {card.time && <span className="text-[10px] text-on-surface-variant">{card.time}</span>}
                                        {card.status === 'On Water' && (
                                            <span className="flex items-center text-[10px] text-green-400">
                                                <span className="material-symbols-outlined text-[10px] mr-0.5">verified</span>
                                                {card.status}
                                            </span>
                                        )}
                                        {card.status === 'Offloaded' && (
                                            <span className="text-[10px] text-error font-medium">{card.status}</span>
                                        )}
                                        {card.status === 'Inspection' && (
                                            <span className="text-[10px] text-on-surface-variant">{card.status}</span>
                                        )}
                                        {card.status === 'COMPLETE' && (
                                            <span className="text-[10px] text-green-400 font-bold">{card.status}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default KanbanBoard;
