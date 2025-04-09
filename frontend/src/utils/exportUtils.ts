/**
 * Generates and triggers the download of a CSV file from an array of objects.
 *
 * @param data - An array of objects. Each object represents a row.
 * @param filename - The desired filename for the downloaded CSV (e.g., 'report.csv').
 */
export const downloadCSV = (data: any[], filename: string): void => {
  if (!data || data.length === 0) {
    console.warn("No data provided for CSV export.");
    alert("No data available to export."); // Provide user feedback
    return;
  }

  // Ensure filename ends with .csv
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  // Extract headers from the keys of the first object
  const headers = Object.keys(data[0]);
  
  // Convert array of objects into CSV string
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        let cellValue = row[header];
        // Handle null/undefined
        if (cellValue === null || cellValue === undefined) {
            cellValue = '';
        }
        // Escape commas and quotes in cell values
        const stringValue = String(cellValue);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            // Enclose in double quotes and escape existing double quotes
            return `"${stringValue.replace(/"/g, '""')}"`;
        } 
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) { // Feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
  } else {
    alert("CSV download is not supported in this browser.");
  }
}; 