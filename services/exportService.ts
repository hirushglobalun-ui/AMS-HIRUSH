
/**
 * Utility to export data to CSV and trigger a download
 * @param data Array of objects to export
 * @param filename Name of the file to download
 * @param headers Optional custom headers
 */
export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
    if (!data || !data.length) {
        return;
    }

    const separator = ',';
    const keys = headers || Object.keys(data[0]);
    
    const csvContent = [
        keys.join(separator), // Header row
        ...data.map(row => 
            keys.map(key => {
                let cellData = row[key];
                if (cellData === undefined || cellData === null) {
                    cellData = '';
                }
                // Handle strings with commas
                const cellString = String(cellData).replace(/"/g, '""');
                return `"${cellString}"`;
            }).join(separator)
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
