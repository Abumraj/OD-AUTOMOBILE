import React from 'react';
import QuotesTable from '../../components/admin/QuotesTable';
import KanbanBoard from '../../components/admin/KanbanBoard';

function AdminQuotesPage() {
    const [view, setView] = React.useState('table');

    return (
        <div className="space-y-gutter">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display-sm text-display-sm text-white mb-xs">Quote Management</h1>
                    <p className="font-body-lg text-on-surface-variant">
                        Review and respond to customer quote requests
                    </p>
                </div>
                <div className="flex gap-sm bg-surface-container rounded-lg p-xs">
                    <button
                        onClick={() => setView('table')}
                        className={`px-md py-sm rounded-lg font-label-md transition-all ${
                            view === 'table'
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'text-on-surface-variant hover:text-white'
                        }`}
                    >
                        <span className="material-symbols-outlined">table_rows</span>
                    </button>
                    <button
                        onClick={() => setView('kanban')}
                        className={`px-md py-sm rounded-lg font-label-md transition-all ${
                            view === 'kanban'
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'text-on-surface-variant hover:text-white'
                        }`}
                    >
                        <span className="material-symbols-outlined">view_kanban</span>
                    </button>
                </div>
            </div>

            {view === 'table' ? <QuotesTable /> : <KanbanBoard />}
        </div>
    );
}

export default AdminQuotesPage;
