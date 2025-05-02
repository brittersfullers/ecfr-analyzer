import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale } from "chart.js";

Chart.register(BarElement, CategoryScale, LinearScale);

const API_URL = process.env.REACT_APP_API_URL || 'https://ecfr-analyzer-staging-5b93a7fa9af7.herokuapp.com';

const ChartDashboard = () => {
  const [allData, setAllData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("wordCount");
  const [selectedTitle, setSelectedTitle] = useState("All Titles");  // Single-select version
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
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((json) => {
        console.log('Data received:', json);
        setAllData(json);
        setError(null);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setError(error.message);
      });
  }, []);

  useEffect(() => {
    if (!allData.length) return;

    const titleMetrics = {};
    const titleNames = {}; // Local titleNames variable

    allData.forEach((entry) => {
      if (entry.title_number) {
        const titleNum = entry.title_number.split("—")[0].trim();
        const fullTitle = entry.title_number.trim(); // Full Title like "7—Agriculture"

        if (!titleMetrics[titleNum]) {
          titleMetrics[titleNum] = { wordCount: 0, sectionCount: 0, partCount: 0 };
        }

        if (!titleNames[titleNum]) {
          titleNames[titleNum] = fullTitle;  // Map the full Title name to the number
        }

        // Count words from the label text
        if (entry.label) {
          const labelWords = entry.label.trim().split(/\s+/).length;
          titleMetrics[titleNum].wordCount += labelWords;
        }

        // Continue counting sections and parts
        if (entry.type === "section") {
          titleMetrics[titleNum].sectionCount += 1;
        }

        if (entry.type === "part") {
          titleMetrics[titleNum].partCount += 1;
        }
      }
    });

    setTitleNames(titleNames);

    let labels = Object.keys(titleMetrics).map(titleNum => titleNames[titleNum] || titleNum);
    let values = labels.map((title) => {
      const titleNum = title.split("—")[0].trim();
      const metrics = titleMetrics[titleNum];
      // Safe check for undefined metrics
      if (!metrics) return 0;

      if (selectedMetric === "wordCount") {
        return metrics.wordCount;
      }
      if (selectedMetric === "sectionCount") {
        return metrics.sectionCount;
      }
      if (selectedMetric === "partCount") {
        return metrics.partCount;
      }
      if (selectedMetric === "avgWordsPerSection") {
        const sections = metrics.sectionCount || 1; // prevent division by zero
        return (metrics.wordCount / sections).toFixed(2);
      }
      return 0;
    });

    // Adjust filtering logic for selectedTitle
    if (selectedTitle !== "All Titles") {
      const selectedTitleNum = selectedTitle.split("—")[0].trim();
      const selectedMetrics = titleMetrics[selectedTitleNum];
      
      if (selectedMetrics) {
        labels = [selectedTitle];
        values = [selectedMetric === "wordCount" ? selectedMetrics.wordCount :
                 selectedMetric === "sectionCount" ? selectedMetrics.sectionCount :
                 selectedMetric === "partCount" ? selectedMetrics.partCount :
                 selectedMetric === "avgWordsPerSection" ? (selectedMetrics.wordCount / (selectedMetrics.sectionCount || 1)).toFixed(2) : 0];
      }
    }

    // Apply the color gradient logic
    const maxWordCount = Math.max(...values); // Get the max word count
    const getColor = (wordCount) => {
      const mediumThreshold = maxWordCount * 0.75;
      const lowThreshold = maxWordCount * 0.25;

      if (wordCount === maxWordCount) {
        return `rgb(255, 99, 71)`; // Tomato red
      }

      if (wordCount >= lowThreshold && wordCount < mediumThreshold) {
        return `rgb(255, 223, 77)`; // Soft Yellow
      }

      if (wordCount < lowThreshold) {
        return `rgb(34, 139, 34)`; // Dark Green
      }

      return `rgb(255, 99, 71)`; // Red for the largest
    };

    const backgroundColors = values.map(getColor); // Apply color gradient for each bar

    setChartData({
      labels,
      datasets: [
        {
          label: getMetricLabel(selectedMetric),
          data: values,
          backgroundColor: backgroundColors,  // Apply the gradient
        },
      ],
    });
  }, [allData, selectedMetric, selectedTitle]);

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

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
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

        {chartData ? <Bar data={chartData} /> : <p>Loading chart...</p>}
      </div>
    </div>
  );
};

export default ChartDashboard;
