import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale } from "chart.js";

Chart.register(BarElement, CategoryScale, LinearScale);

const API_URL = process.env.REACT_APP_API_URL || 'https://ecfr-analyzer-staging-5b93a7fa9af7.herokuapp.com';

// Chart options for better label display
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        font: {
          size: 12,
          weight: 'bold'
        },
        padding: 10,
        color: 'var(--text-light)'
      },
      grid: {
        color: 'var(--border-color)'
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'var(--border-color)'
      },
      ticks: {
        color: 'var(--text-light)',
        font: {
          weight: 'bold'
        }
      }
    }
  },
  plugins: {
    legend: {
      display: false,
      labels: {
        color: 'var(--text-light)',
        font: {
          weight: 'bold'
        }
      }
    },
    tooltip: {
      backgroundColor: 'var(--card-bg)',
      titleColor: 'var(--text-light)',
      bodyColor: 'var(--text-light)',
      borderColor: 'var(--border-color)',
      borderWidth: 1,
      titleFont: {
        weight: 'bold'
      },
      bodyFont: {
        weight: 'bold'
      }
    }
  }
};

const ChartDashboard = () => {
  const [allData, setAllData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("wordCount");
  const [selectedTitle, setSelectedTitle] = useState("All Titles");
  const [chartData, setChartData] = useState(null);
  const [titleNames, setTitleNames] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Fetching data from:', `${API_URL}/small_summary.json`);
    fetch(`${API_URL}/small_summary.json`, {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then((response) => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((json) => {
        console.log('Data received:', json);
        if (!Array.isArray(json)) {
          throw new Error('Invalid data format: expected an array');
        }
        setAllData(json);
        setError(null);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setError(error.message);
      });
  }, []);

  useEffect(() => {
    console.log('Processing data for chart...');
    if (!Array.isArray(allData) || allData.length === 0) {
      console.log('No data to process');
      return;
    }

    const titleMetrics = {};
    const titleNames = {};

    allData.forEach((entry) => {
      if (entry.title_number) {
        const titleNum = entry.title_number.split("—")[0].trim();
        const fullTitle = entry.title_number.trim();

        if (!titleMetrics[titleNum]) {
          titleMetrics[titleNum] = { wordCount: 0, sectionCount: 0, partCount: 0 };
        }

        if (!titleNames[titleNum]) {
          titleNames[titleNum] = fullTitle;
        }

        if (entry.label) {
          const labelWords = entry.label.trim().split(/\s+/).length;
          titleMetrics[titleNum].wordCount += labelWords;
        }

        if (entry.type === "section") {
          titleMetrics[titleNum].sectionCount += 1;
        }

        if (entry.type === "part") {
          titleMetrics[titleNum].partCount += 1;
        }
      }
    });

    console.log('Title metrics:', titleMetrics);
    setTitleNames(titleNames);

    let labels = Object.keys(titleMetrics).map(titleNum => {
      const fullTitle = titleNames[titleNum] || titleNum;
      const departmentName = fullTitle.split("—")[1]?.trim() || fullTitle;
      return departmentName;
    });

    console.log('Labels:', labels);

    let values = labels.map((title) => {
      const titleNum = title.split("—")[0].trim();
      const metrics = titleMetrics[titleNum];
      if (!metrics) return 0;

      switch (selectedMetric) {
        case "wordCount":
          return metrics.wordCount;
        case "sectionCount":
          return metrics.sectionCount;
        case "partCount":
          return metrics.partCount;
        case "avgWordsPerSection":
          const sections = metrics.sectionCount || 1;
          return (metrics.wordCount / sections).toFixed(2);
        default:
          return 0;
      }
    });

    console.log('Values:', values);

    const maxWordCount = Math.max(...values);
    const getColor = (wordCount) => {
      const mediumThreshold = maxWordCount * 0.75;
      const lowThreshold = maxWordCount * 0.25;

      if (wordCount === maxWordCount) {
        return 'var(--primary-color)';
      }

      if (wordCount >= lowThreshold && wordCount < mediumThreshold) {
        return 'var(--primary-hover)';
      }

      if (wordCount < lowThreshold) {
        return 'var(--text-secondary)';
      }

      return 'var(--primary-color)';
    };

    const backgroundColors = values.map(getColor);

    const newChartData = {
      labels,
      datasets: [
        {
          label: getMetricLabel(selectedMetric),
          data: values,
          backgroundColor: backgroundColors,
          borderColor: 'var(--border-color)',
          borderWidth: 1
        }
      ]
    };

    console.log('Setting chart data:', newChartData);
    setChartData(newChartData);
  }, [allData, selectedMetric]);

  const getMetricLabel = (metric) => {
    switch (metric) {
      case "wordCount":
        return "Total Word Count per Title";
      case "sectionCount":
        return "Number of Sections per Title";
      case "partCount":
        return "Number of Parts per Title";
      case "avgWordsPerSection":
        return "Average Words per Section";
      default:
        return "";
    }
  };

  return (
    <div className="chart-container">
      <h2 className="chart-title">Regulation Analysis</h2>
      <p className="chart-description">
        Select regulations from the dropdown to view their analysis.
      </p>
      <div className="chart-content">
        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            Error loading data: {error}
          </div>
        )}

        <div className="chart-controls">
          <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)} id="metricSelect">
            <option value="wordCount">Total Word Count</option>
            <option value="sectionCount">Number of Sections</option>
            <option value="partCount">Number of Parts</option>
            <option value="avgWordsPerSection">Average Words per Section</option>
          </select>

          <select 
            value={selectedTitle} 
            onChange={(e) => setSelectedTitle(e.target.value)}
            id="titleSelect"
          >
            <option value="All Titles">All Titles</option>
            {Object.entries(titleNames).map(([titleNum, fullTitle]) => (
              <option key={titleNum} value={fullTitle}>
                {fullTitle}
              </option>
            ))}
          </select>
        </div>

        {chartData ? (
          <div style={{ height: '500px', width: '100%' }}>
            <Bar 
              data={chartData} 
              options={chartOptions}
            />
          </div>
        ) : (
          <p style={{ color: 'var(--text-light)' }}>Loading chart...</p>
        )}
      </div>
    </div>
  );
};

export default ChartDashboard;
