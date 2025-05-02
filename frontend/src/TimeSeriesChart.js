import React, { useEffect, useState, useMemo } from "react";
import { Scatter } from "react-chartjs-2";
import { Chart, PointElement, CategoryScale, LinearScale, TimeScale } from "chart.js";
import 'chartjs-adapter-date-fns';

Chart.register(PointElement, CategoryScale, LinearScale, TimeScale);

const API_URL = process.env.REACT_APP_API_URL || 'https://ecfr-analyzer-staging-5b93a7fa9af7.herokuapp.com';

const TimeSeriesChart = () => {
  const [data, setData] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState("All Titles");
  const [selectedMetric, setSelectedMetric] = useState("wordCount");
  const [timePeriod, setTimePeriod] = useState("Monthly");
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [titles, setTitles] = useState([]);

  // Process data using useMemo to prevent unnecessary recalculations
  const processedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const departmentData = {};
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 50);

    let timeLabels = [];
    switch (timePeriod) {
      case "Daily":
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          timeLabels.push(d.toISOString().split('T')[0]);
        }
        break;
      case "Weekly":
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
          timeLabels.push(d.toISOString().split('T')[0]);
        }
        break;
      case "Monthly":
        for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
          timeLabels.push(d.toISOString().split('T')[0]);
        }
        break;
      case "Quarterly":
        for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 3)) {
          timeLabels.push(d.toISOString().split('T')[0]);
        }
        break;
      case "Annually":
        for (let d = new Date(startDate); d <= endDate; d.setFullYear(d.getFullYear() + 1)) {
          timeLabels.push(d.toISOString().split('T')[0]);
        }
        break;
      default:
        break;
    }

    data.forEach(entry => {
      if (entry.title_number) {
        const titleNum = entry.title_number.split("—")[0].trim();
        const departmentName = entry.title_number.split("—")[1]?.trim() || titleNum;
        
        if (!departmentData[departmentName]) {
          departmentData[departmentName] = {};
          timeLabels.forEach(date => {
            departmentData[departmentName][date] = {
              wordCount: 0,
              sectionCount: 0,
              partCount: 0
            };
          });
        }

        let entryDate;
        try {
          const dateStr = entry.date || entry.created_at;
          if (!dateStr) return;
          
          entryDate = new Date(dateStr);
          if (isNaN(entryDate.getTime())) return;
          
          entryDate = entryDate.toISOString().split('T')[0];
        } catch (error) {
          return;
        }

        const closestTimeLabel = timeLabels.reduce((prev, curr) => {
          return Math.abs(new Date(curr) - new Date(entryDate)) < Math.abs(new Date(prev) - new Date(entryDate)) ? curr : prev;
        });

        if (entry.label) {
          const labelWords = entry.label.trim().split(/\s+/).length;
          departmentData[departmentName][closestTimeLabel].wordCount += labelWords;
        }

        if (entry.type === "section") {
          departmentData[departmentName][closestTimeLabel].sectionCount += 1;
        }

        if (entry.type === "part") {
          departmentData[departmentName][closestTimeLabel].partCount += 1;
        }
      }
    });

    return { departmentData, timeLabels };
  }, [data, timePeriod]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching data from:', `${API_URL}/small_summary.json`);
        const response = await fetch(`${API_URL}/small_summary.json`, {
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        console.log('Data received:', json);
        
        if (!Array.isArray(json)) {
          throw new Error('Invalid data format: expected an array');
        }

        setData(json);
        setError(null);
        
        // Extract unique titles
        const uniqueTitles = [...new Set(json.map(item => item.title_number))];
        setTitles(uniqueTitles);
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

    const { departmentData, timeLabels } = processedData;
    const datasets = Object.entries(departmentData).map(([department, timeData], index) => {
      const points = Object.entries(timeData).map(([date, metrics]) => {
        let value;
        switch (selectedMetric) {
          case "wordCount":
            value = metrics.wordCount;
            break;
          case "sectionCount":
            value = metrics.sectionCount;
            break;
          case "partCount":
            value = metrics.partCount;
            break;
          case "avgWordsPerSection":
            value = metrics.sectionCount > 0 
              ? Math.round(metrics.wordCount / metrics.sectionCount)
              : 0;
            break;
          default:
            value = 0;
        }
        return {
          x: new Date(date).getTime(),
          y: value
        };
      });

      return {
        label: department,
        data: points,
        backgroundColor: '#5A91EE',
        borderColor: '#5A91EE',
        pointRadius: 6,
        pointHoverRadius: 8
      };
    });

    setChartData({
      labels: timeLabels,
      datasets
    });
  }, [processedData, selectedMetric]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM d, yyyy',
            week: 'MMM d, yyyy',
            month: 'MMM yyyy',
            quarter: 'QQQ yyyy',
            year: 'yyyy'
          }
        },
        title: {
          display: true,
          text: 'Time',
          color: 'rgb(249, 250, 251)',
          font: {
            family: '__Inter_d65c78, __Inter_Fallback_d65c78',
            size: 14,
            weight: '700'
          }
        },
        ticks: {
          color: 'rgb(249, 250, 251)',
          font: {
            family: '__Inter_d65c78, __Inter_Fallback_d65c78',
            size: 12,
            weight: '400'
          }
        },
        grid: {
          color: 'rgba(249, 250, 251, 0.1)'
        }
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Value',
          color: 'rgb(249, 250, 251)',
          font: {
            family: '__Inter_d65c78, __Inter_Fallback_d65c78',
            size: 14,
            weight: '700'
          }
        },
        ticks: {
          color: 'rgb(249, 250, 251)',
          font: {
            family: '__Inter_d65c78, __Inter_Fallback_d65c78',
            size: 12,
            weight: '400'
          }
        },
        grid: {
          color: 'rgba(249, 250, 251, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgb(249, 250, 251)',
          font: {
            family: '__Inter_d65c78, __Inter_Fallback_d65c78',
            size: 12,
            weight: '400'
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
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
        },
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          }
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <h2 className="chart-title">Federal Regulations Changes Over Time</h2>
      <p className="chart-description">
        Track changes in federal regulations by agency. Negative values indicate reduction, positive values indicate increase.
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
                value={selectedTitle} 
                onChange={(e) => setSelectedTitle(e.target.value)}
                id="titleSelect"
              >
                <option value="All Titles">All Titles</option>
                {titles.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>

              <select 
                value={selectedMetric} 
                onChange={(e) => setSelectedMetric(e.target.value)}
                id="metricSelect"
              >
                <option value="wordCount">Total Word Count</option>
                <option value="sectionCount">Number of Sections</option>
                <option value="partCount">Number of Parts</option>
                <option value="avgWordsPerSection">Average Words per Section</option>
              </select>

              <select 
                value={timePeriod} 
                onChange={(e) => setTimePeriod(e.target.value)}
                id="timePeriodSelect"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annually">Annually</option>
              </select>
            </div>

            {chartData && (
              <div style={{ height: '500px', width: '100%' }}>
                <Scatter data={chartData} options={chartOptions} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TimeSeriesChart; 