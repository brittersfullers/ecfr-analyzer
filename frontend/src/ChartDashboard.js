import React, { useEffect, useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale } from "chart.js";
import TimeSeriesChart from "./TimeSeriesChart";

Chart.register(BarElement, CategoryScale, LinearScale);

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
          family: '__Inter_d65c78, __Inter_Fallback_d65c78',
          size: 12,
          weight: '400'
        },
        padding: 10,
        color: 'rgb(249, 250, 251)'
      },
      grid: {
        color: 'rgba(249, 250, 251, 0.1)'
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(249, 250, 251, 0.1)'
      },
      ticks: {
        color: 'rgb(249, 250, 251)',
        font: {
          family: '__Inter_d65c78, __Inter_Fallback_d65c78',
          size: 12,
          weight: '400'
        }
      }
    }
  },
  plugins: {
    legend: {
      display: false,
      labels: {
        color: 'rgb(249, 250, 251)',
        font: {
          family: '__Inter_d65c78, __Inter_Fallback_d65c78',
          size: 12,
          weight: '400'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'rgb(249, 250, 251)',
      bodyColor: 'rgb(249, 250, 251)',
      titleFont: {
        family: '__Inter_d65c78, __Inter_Fallback_d65c78',
        size: 14,
        weight: '700'
      },
      bodyFont: {
        family: '__Inter_d65c78, __Inter_Fallback_d65c78',
        size: 12,
        weight: '400'
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
  const [isLoading, setIsLoading] = useState(true);

  // Process data using useMemo to prevent unnecessary recalculations
  const processedData = useMemo(() => {
    if (!Array.isArray(allData) || allData.length === 0) {
      return null;
    }

    const titleMetrics = {};
    const titleNames = {};

    // Process data in chunks to avoid blocking the main thread
    const chunkSize = 1000;
    for (let i = 0; i < allData.length; i += chunkSize) {
      const chunk = allData.slice(i, i + chunkSize);
      chunk.forEach((entry) => {
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
    }

    return { titleMetrics, titleNames };
  }, [allData]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/small_summary.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        
        if (!Array.isArray(json)) {
          throw new Error('Invalid data format: expected an array');
        }

        setAllData(json);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!processedData) return;

    const { titleMetrics, titleNames } = processedData;
    setTitleNames(titleNames);

    let filteredTitles = Object.keys(titleMetrics);
    if (selectedTitle !== "All Titles") {
      filteredTitles = filteredTitles.filter(titleNum => titleNames[titleNum] === selectedTitle);
    }

    const values = filteredTitles.map(titleNum => {
      switch (selectedMetric) {
        case "wordCount":
          return titleMetrics[titleNum].wordCount;
        case "sectionCount":
          return titleMetrics[titleNum].sectionCount;
        case "partCount":
          return titleMetrics[titleNum].partCount;
        case "avgWordsPerSection":
          return titleMetrics[titleNum].sectionCount > 0 
            ? Math.round(titleMetrics[titleNum].wordCount / titleMetrics[titleNum].sectionCount)
            : 0;
        default:
          return 0;
      }
    });

    setChartData({
      labels: filteredTitles.map(titleNum => titleNames[titleNum]),
      datasets: [{
        label: getMetricLabel(selectedMetric),
        data: values,
        backgroundColor: '#5A91EE',
        borderColor: '#5A91EE',
        borderWidth: 1,
      }],
    });
  }, [processedData, selectedMetric, selectedTitle]);

  const getMetricLabel = (metric) => {
    switch (metric) {
      case "wordCount":
        return "Total Word Count";
      case "sectionCount":
        return "Number of Sections";
      case "partCount":
        return "Number of Parts";
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
        Select a metric and title to view the analysis of regulations.
      </p>
      <div className="chart-content">
        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}
        {isLoading ? (
          <div className="loading-message">
            Loading data...
          </div>
        ) : (
          <>
            <div className="chart-controls">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="metric-select"
              >
                <option value="wordCount">Total Word Count</option>
                <option value="sectionCount">Number of Sections</option>
                <option value="partCount">Number of Parts</option>
                <option value="avgWordsPerSection">Average Words per Section</option>
              </select>
              <select
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                className="title-select"
              >
                <option value="All Titles">All Titles</option>
                {Object.values(titleNames).map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>
            {chartData && (
              <div className="chart-wrapper">
                <Bar data={chartData} options={chartOptions} />
              </div>
            )}
            <div className="time-series-chart">
              <TimeSeriesChart />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChartDashboard;
