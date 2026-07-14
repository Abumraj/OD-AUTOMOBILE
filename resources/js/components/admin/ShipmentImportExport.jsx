import React, { useState } from 'react';

function ShipmentImportExport() {
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/admin/shipments/import', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setImportResult(data);
        } catch (error) {
            setImportResult({
                message: 'Error importing file',
                errors: [error.message],
            });
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    const handleExport = async () => {
        setExporting(true);

        try {
            const response = await fetch('/api/admin/shipments/export');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shipments_export_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            alert('Error exporting file: ' + error.message);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="bg-surface-container rounded-xl p-lg border border-white/10">
            <div className="mb-md">
                <h2 className="font-title-lg text-white mb-xs">Import/Export Shipments</h2>
                <p className="font-body-sm text-on-surface-variant">
                    Upload Excel files to bulk import shipments or export existing data
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {/* Import Section */}
                <div className="bg-surface rounded-lg p-md border border-outline-variant">
                    <div className="flex items-center space-x-sm mb-md">
                        <span className="material-symbols-outlined text-secondary">upload_file</span>
                        <h3 className="font-title-md text-white">Import from Excel</h3>
                    </div>
                    <p className="font-body-sm text-on-surface-variant mb-md">
                        Upload an Excel file (.xlsx) with shipment data. The file should have columns: CAR MODEL, YEAR, CAR COLOR, IMAGE LINK, VIN, S/TYPE, SHIPPING LINE, ETA, CLIENT NAME, STATUS, SHIPMENT #
                    </p>
                    <label className="block">
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleImport}
                            disabled={importing}
                            className="hidden"
                        />
                        <div className={`border-2 border-dashed border-outline rounded-lg p-lg text-center cursor-pointer hover:border-secondary transition-colors ${
                            importing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}>
                            {importing ? (
                                <div className="flex items-center justify-center space-x-sm">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-secondary"></div>
                                    <span className="font-label-md text-on-surface-variant">Importing...</span>
                                </div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-secondary mb-xs">cloud_upload</span>
                                    <div className="font-label-md text-white">Click to upload Excel file</div>
                                    <div className="font-body-sm text-on-surface-variant mt-xs">or drag and drop</div>
                                </>
                            )}
                        </div>
                    </label>

                    {importResult && (
                        <div className={`mt-md p-md rounded-lg ${
                            importResult.errors && importResult.errors.length > 0
                                ? 'bg-error/10 border border-error/30'
                                : 'bg-green-500/10 border border-green-500/30'
                        }`}>
                            <div className="font-label-md text-white mb-xs">{importResult.message}</div>
                            {importResult.imported > 0 && (
                                <div className="font-body-sm text-green-400">
                                    Successfully imported: {importResult.imported} shipments
                                </div>
                            )}
                            {importResult.errors && importResult.errors.length > 0 && (
                                <div className="mt-sm">
                                    <div className="font-label-sm text-error mb-xs">Errors:</div>
                                    <div className="space-y-xs max-h-40 overflow-y-auto">
                                        {importResult.errors.map((error, index) => (
                                            <div key={index} className="font-body-sm text-on-surface-variant">
                                                • {error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Export Section */}
                <div className="bg-surface rounded-lg p-md border border-outline-variant">
                    <div className="flex items-center space-x-sm mb-md">
                        <span className="material-symbols-outlined text-secondary">download</span>
                        <h3 className="font-title-md text-white">Export to Excel</h3>
                    </div>
                    <p className="font-body-sm text-on-surface-variant mb-md">
                        Download all shipment data in Excel format. The exported file will include all fields in the same format as the import template.
                    </p>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className={`w-full bg-secondary text-on-secondary py-md rounded-lg hover:opacity-90 transition-opacity font-label-md flex items-center justify-center space-x-sm ${
                            exporting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {exporting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-on-secondary"></div>
                                <span>Exporting...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">file_download</span>
                                <span>Download Excel File</span>
                            </>
                        )}
                    </button>

                    <div className="mt-md p-md bg-surface-container-highest rounded-lg">
                        <div className="font-label-sm text-white mb-xs">Export includes:</div>
                        <ul className="space-y-xs font-body-sm text-on-surface-variant">
                            <li>• All shipment details</li>
                            <li>• Vehicle information (Model, Year, Color, VIN)</li>
                            <li>• Shipping details (Type, Line, ETA)</li>
                            <li>• Client information</li>
                            <li>• Current status and tracking numbers</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mt-md p-md bg-surface rounded-lg border border-outline-variant">
                <div className="flex items-start space-x-sm">
                    <span className="material-symbols-outlined text-secondary">info</span>
                    <div>
                        <div className="font-label-md text-white mb-xs">Excel Format Requirements</div>
                        <ul className="space-y-xs font-body-sm text-on-surface-variant">
                            <li>• <strong>Required columns:</strong> CAR MODEL, VIN</li>
                            <li>• <strong>Optional columns:</strong> YEAR, CAR COLOR, IMAGE LINK, S/TYPE, SHIPPING LINE, ETA, CLIENT NAME, STATUS, SHIPMENT #</li>
                            <li>• <strong>Date format:</strong> ETA should be in DD/MM/YYYY format</li>
                            <li>• <strong>Status values:</strong> Use our system statuses (pending, in_transit, delivered, etc.) or common terms like "on vessel"</li>
                            <li>• <strong>New shipping types/lines:</strong> Will be automatically created if they don't exist</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShipmentImportExport;
