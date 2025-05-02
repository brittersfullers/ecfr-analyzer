import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, PointElement, CategoryScale, LinearScale, Filler } from "chart.js";

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Filler);

const API_URL = process.env.REACT_APP_API_URL || 'https://ecfr-analyzer-staging-5b93a7fa9af7.herokuapp.com';

const TimeSeriesChart = () => {
  const [data, setData] = useState([]);
  const [timePeriod, setTimePeriod] = useState("Monthly");
  const [chartData, setChartData] = useState(null);
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
        setData(json);
        setError(null);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setError(error.message);
      });
  }, []);

  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) {
      console.log('No data to process');
      return;
    }

    // Group data by department
    const departmentData = {};
    data.forEach(entry => {
      if (entry.title_number) {
        const titleNum = entry.title_number.split("—")[0].trim();
        const departmentName = entry.title_number.split("—")[1]?.trim() || titleNum;
        
        if (!departmentData[departmentName]) {
          departmentData[departmentName] = {
            wordCount: 0,
            sectionCount: 0,
            partCount: 0
          };
        }

        if (entry.label) {
          const labelWords = entry.label.trim().split(/\s+/).length;
          departmentData[departmentName].wordCount += labelWords;
        }

        if (entry.type === "section") {
          departmentData[departmentName].sectionCount += 1;
        }

        if (entry.type === "part") {
          departmentData[departmentName].partCount += 1;
        }
      }
    });

    // Create time periods for the last 50 years
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 50);

    let timeLabels = [];
    let timeData = {};

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
    }

    // Create datasets for each department
    const datasets = Object.entries(departmentData).map(([department, metrics]) => ({
      label: department,
      data: timeLabels.map(() => metrics.wordCount), // Using wordCount as an example metric
      borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      fill: true,
      tension: 0.4
    }));

    setChartData({
      labels: timeLabels,
      datasets
    });
  }, [data, timePeriod]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Time',
          color: 'var(--text-light)',
          font: {
            weight: 'bold',
            family: "'system-ui', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }
        },
        ticks: {
          color: 'var(--text-light)',
          font: {
            weight: 'bold',
            family: "'system-ui', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }
        },
        grid: {
          color: 'var(--border-color)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Department',
          color: 'var(--text-light)',
          font: {
            weight: 'bold',
            family: "'system-ui', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }
        },
        ticks: {
          color: 'var(--text-light)',
          font: {
            weight: 'bold',
            family: "'system-ui', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }
        },
        grid: {
          color: 'var(--border-color)'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'var(--text-light)',
          font: {
            weight: 'bold',
            family: "'system-ui', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
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
          weight: 'bold',
          family: "'system-ui', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        },
        bodyFont: {
          weight: 'bold',
          family: "'system-ui', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <h2 className="chart-title">Regulation Timeline Analysis</h2>
      <p className="chart-description">
        View the evolution of regulations over time by department.
      </p>
      <div className="chart-content">
        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            Error loading data: {error}
          </div>
        )}

        <div className="chart-controls">
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

        {chartData ? (
          <div style={{ height: '500px', width: '100%' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <p style={{ color: 'var(--text-light)' }}>Loading chart...</p>
        )}
      </div>
    </div>
  );
};

export default TimeSeriesChart; 