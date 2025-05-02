import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, PointElement, CategoryScale, LinearScale, LineElement } from "chart.js";

Chart.register(PointElement, CategoryScale, LinearScale, LineElement);

const API_URL = process.env.REACT_APP_API_URL || 'https://ecfr-analyzer-staging-5b93a7fa9af7.herokuapp.com';

const TimeSeriesChart = () => {
  const [selectedTitle, setSelectedTitle] = useState("All Titles");
  const [selectedMetric, setSelectedMetric] = useState("wordCount");
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [availableTitles, setAvailableTitles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch and process data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/yearly_aggregates.json`, {
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format: expected an array');
        }

        // Process data into yearly aggregates
        const yearlyAggregates = {};
        const titles = new Set();

        data.forEach(item => {
          if (!item || !item.date || !item.title) return;
          
          const year = new Date(item.date).getFullYear();
          titles.add(item.title);

          if (!yearlyAggregates[year]) {
            yearlyAggregates[year] = {};
          }
          if (!yearlyAggregates[year][item.title]) {
            yearlyAggregates[year][item.title] = {
              wordCount: 0,
              sectionCount: 0,
              partCount: 0
            };
          }
          
          yearlyAggregates[year][item.title].wordCount += Number(item.wordCount) || 0;
          yearlyAggregates[year][item.title].sectionCount += Number(item.sectionCount) || 0;
          yearlyAggregates[year][item.title].partCount += Number(item.partCount) || 0;
        });

        setAvailableTitles(Array.from(titles));
        
        // Prepare chart data
        const years = Object.keys(yearlyAggregates).sort();
        const datasets = [];

        if (selectedTitle === "All Titles") {
          // Aggregate data for all titles
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
            tension: 0.1
          });
        } else {
          // Data for selected title
          datasets.push({
            label: selectedTitle,
            data: years.map(year => yearlyAggregates[year][selectedTitle]?.[selectedMetric] || 0),
            borderColor: '#5A91EE',
            backgroundColor: '#5A91EE',
            tension: 0.1
          });
        }

        setChartData({
          labels: years,
          datasets
        });
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
        text: `Yearly ${getMetricLabel(selectedMetric)}`
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (isLoading) {
    return <div className="loading-message">Loading data...</div>;
  }

  if (!chartData) {
    return <div className="error-message">No data available</div>;
  }

  return (
    <div className="chart-container">
      <div className="chart-controls">
        <select 
          value={selectedTitle} 
          onChange={(e) => setSelectedTitle(e.target.value)}
        >
          <option value="All Titles">All Titles</option>
          {availableTitles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
        
        <select 
          value={selectedMetric} 
          onChange={(e) => setSelectedMetric(e.target.value)}
        >
          <option value="wordCount">Word Count</option>
          <option value="sectionCount">Section Count</option>
          <option value="partCount">Part Count</option>
        </select>
      </div>
      
      <div className="chart-wrapper">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default TimeSeriesChart; 