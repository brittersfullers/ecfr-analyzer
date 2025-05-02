import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, PointElement, CategoryScale, LinearScale, LineElement } from "chart.js";

Chart.register(PointElement, CategoryScale, LinearScale, LineElement);

// Use relative URL for local development
const API_URL = process.env.REACT_APP_API_URL || '';

const TimeSeriesChart = () => {
  const [selectedTitle, setSelectedTitle] = useState("All Titles");
  const [selectedMetric, setSelectedMetric] = useState("wordCount");
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [availableTitles, setAvailableTitles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Process data into chart format
  const processData = (data) => {
    try {
      const yearlyAggregates = {};
      const titles = new Set();

      // First pass: collect all unique titles
      data.forEach(item => {
        if (item && item.title) {
          titles.add(item.title.trim());
        }
      });

      // Sort titles numerically
      const availableTitlesArray = Array.from(titles).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''));
        const numB = parseInt(b.replace(/\D/g, ''));
        return numA - numB;
      });
      
      setAvailableTitles(availableTitlesArray);
      
      // Second pass: process the data
      data.forEach(item => {
        if (!item || !item.date || !item.title) {
          console.warn('Skipping invalid item:', item);
          return;
        }
        
        const year = new Date(item.date).getFullYear();
        const title = item.title.trim();

        if (!yearlyAggregates[year]) {
          yearlyAggregates[year] = {};
        }
        if (!yearlyAggregates[year][title]) {
          yearlyAggregates[year][title] = {
            wordCount: 0,
            sectionCount: 0,
            partCount: 0
          };
        }
        
        yearlyAggregates[year][title].wordCount += Number(item.wordCount) || 0;
        yearlyAggregates[year][title].sectionCount += Number(item.sectionCount) || 0;
        yearlyAggregates[year][title].partCount += Number(item.partCount) || 0;
      });

      // If selected title is not in available titles, reset to "All Titles"
      if (selectedTitle !== "All Titles" && !availableTitlesArray.includes(selectedTitle)) {
        setSelectedTitle("All Titles");
      }
      
      const years = Object.keys(yearlyAggregates).sort();
      const datasets = [];

      if (selectedTitle === "All Titles") {
        const allTitlesData = years.map(year => {
          return Object.values(yearlyAggregates[year]).reduce((acc, titleData) => {
            return {
              wordCount: acc.wordCount + titleData.wordCount,
              sectionCount: acc.sectionCount + titleData.sectionCount,
              partCount: acc.partCount + titleData.partCount
            };
          }, { wordCount: 0, sectionCount: 0, partCount: 0 });
        });

        datasets.push({
          label: "All Titles",
          data: allTitlesData.map(data => data[selectedMetric]),
          borderColor: '#5A91EE',
          backgroundColor: '#5A91EE',
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6
        });
      } else {
        const titleData = years.map(year => {
          const yearData = yearlyAggregates[year][selectedTitle];
          return yearData ? yearData[selectedMetric] : 0;
        });

        datasets.push({
          label: selectedTitle,
          data: titleData,
          borderColor: '#5A91EE',
          backgroundColor: '#5A91EE',
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6
        });
      }

      setChartData({
        labels: years,
        datasets
      });
    } catch (error) {
      console.error('Error processing data:', error);
      setError('Error processing data. Please try again later.');
    }
  };

  // Fetch and process data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/yearly_aggregates.json', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No data available');
        }
        
        processData(data);
        setError(null);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedTitle, selectedMetric]);

  const getMetricLabel = (metric) => {
    switch (metric) {
      case "wordCount": return "Total Word Count";
      case "sectionCount": return "Number of Sections";
      case "partCount": return "Number of Parts";
      default: return "";
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `Yearly ${getMetricLabel(selectedMetric)}`,
        font: {
          size: 16,
          weight: 'bold',
          family: '__Inter_d65c78, __Inter_Fallback_d65c78'
        },
        color: 'rgb(249, 250, 251)'
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 12,
            family: '__Inter_d65c78, __Inter_Fallback_d65c78'
          },
          color: 'rgb(249, 250, 251)'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(249, 250, 251, 0.1)'
        },
        ticks: {
          color: 'rgb(249, 250, 251)',
          font: {
            family: '__Inter_d65c78, __Inter_Fallback_d65c78',
            size: 12
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(249, 250, 251, 0.1)'
        },
        ticks: {
          color: 'rgb(249, 250, 251)',
          font: {
            family: '__Inter_d65c78, __Inter_Fallback_d65c78',
            size: 12
          }
        }
      }
    }
  };

  if (isLoading) {
    return <div className="loading-message">Loading data...</div>;
  }

  if (!chartData) {
    return <div className="error-message">No data available</div>;
  }

  return (
    <div className="chart-container" style={{ 
      height: '600px',
      minHeight: '600px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      padding: '1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '8px'
    }}>
      {error && <div className="warning-message">{error}</div>}
      <div className="chart-controls" style={{ 
        marginBottom: '1rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <select 
          id="title-select"
          name="title"
          value={selectedTitle} 
          onChange={(e) => setSelectedTitle(e.target.value)}
          aria-label="Select Title"
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            color: 'white',
            minWidth: '200px',
            fontFamily: '__Inter_d65c78, __Inter_Fallback_d65c78'
          }}
        >
          <option value="All Titles">All Titles</option>
          {availableTitles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
        
        <select 
          id="metric-select"
          name="metric"
          value={selectedMetric} 
          onChange={(e) => setSelectedMetric(e.target.value)}
          aria-label="Select Metric"
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            color: 'white',
            minWidth: '150px',
            fontFamily: '__Inter_d65c78, __Inter_Fallback_d65c78'
          }}
        >
          <option value="wordCount">Word Count</option>
          <option value="sectionCount">Section Count</option>
          <option value="partCount">Part Count</option>
        </select>
      </div>
      
      <div className="chart-wrapper" style={{ 
        height: '500px',
        minHeight: '500px',
        position: 'relative',
        width: '100%'
      }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default TimeSeriesChart; 