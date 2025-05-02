import React, { useState } from 'react';

const PDFGenerator = () => {
  const [selectedTitle, setSelectedTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGeneratePDF = async () => {
    if (!selectedTitle) {
      setError('Please select a title');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: selectedTitle }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `EPA_${selectedTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pdf-generator">
      <h2>Generate PDF Reports</h2>
      <div className="pdf-controls">
        <select
          value={selectedTitle}
          onChange={(e) => setSelectedTitle(e.target.value)}
          className="pdf-select"
        >
          <option value="">Select EPA Title</option>
          <option value="Title 40 - Protection of Environment">Title 40 - Protection of Environment</option>
          {/* Add more EPA titles as needed */}
        </select>
        <button
          onClick={handleGeneratePDF}
          disabled={loading || !selectedTitle}
          className="pdf-button"
        >
          {loading ? 'Generating...' : 'Generate PDF'}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default PDFGenerator; 