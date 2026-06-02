/**
 * Convert array of objects to CSV string
 */
export const convertToCSV = (data, headers = null) => {
    if (!data || data.length === 0) {
        return '';
    }

    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);
    
    // Create header row
    const headerRow = csvHeaders.join(',');
    
    // Create data rows
    const dataRows = data.map(row => {
        return csvHeaders.map(header => {
            let value = row[header];
            
            // Handle null/undefined
            if (value === null || value === undefined) {
                return '';
            }
            
            // Convert to string
            value = String(value);
            
            // Escape quotes and wrap in quotes if contains comma, newline, or quote
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            
            return value;
        }).join(',');
    });
    
    return [headerRow, ...dataRows].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

/**
 * Export data to CSV file
 */
export const exportToCSV = (data, filename, headers = null) => {
    const csvContent = convertToCSV(data, headers);
    downloadCSV(csvContent, filename);
};
