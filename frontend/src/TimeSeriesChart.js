import React, { useEffect, useState } from "react";
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
  const [titles, setTitles] = useState([]);

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
        
        // Extract unique titles
        const uniqueTitles = [...new Set(json.map(item => item.title_number))];
        setTitles(uniqueTitles);
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

    // Filter data by selected title if not "All Titles"
    const filteredData = selectedTitle === "All Titles" 
      ? data 
      : data.filter(item => item.title_number === selectedTitle);

    // Group data by department and time period
    const departmentData = {};

    // Create time periods for the last 50 years
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

    // Process data for each department and time period
    filteredData.forEach(entry => {
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

        // Safely handle date parsing
        let entryDate;
        try {
          const dateStr = entry.date || entry.created_at;
          if (!dateStr) return; // Skip if no date
          
          entryDate = new Date(dateStr);
          if (isNaN(entryDate.getTime())) return; // Skip if invalid date
          
          entryDate = entryDate.toISOString().split('T')[0];
        } catch (error) {
          console.warn('Invalid date for entry:', entry);
          return; // Skip entries with invalid dates
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

    // Create scatter plot data
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
        backgroundColor: `hsla(${(index * 137.5) % 360}, 70%, 50%, 0.8)`,
        borderColor: `hsla(${(index * 137.5) % 360}, 70%, 50%, 1)`,
        pointRadius: 6,
        pointHoverRadius: 8
      };
    });

    const chartData = {
      labels: timeLabels,
      datasets
    };

    setChartData(chartData);
  }, [data, selectedTitle, selectedMetric, timePeriod]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timePeriod.toLowerCase(),
          displayFormats: {
            daily: 'MMM d, yyyy',
            weekly: 'MMM d, yyyy',
            monthly: 'MMM yyyy',
            quarterly: 'QQQ yyyy',
            yearly: 'yyyy'
          },
          parser: 'yyyy-MM-dd',
          tooltipFormat: 'MMM d, yyyy'
        },
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
        type: 'linear',
        title: {
          display: true,
          text: 'Regulatory Changes by Agency',
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
        },
        callbacks: {
          label: function(context) {
            const value = context.raw.y;
            const absValue = Math.abs(value);
            let changeText = '';
            
            switch(selectedMetric) {
              case 'wordCount':
                changeText = value > 0 ? `Increased Total Word Count by ${absValue} words` : 
                          value < 0 ? `Reduced Total Word Count by ${absValue} words` : 
                          'No change in Total Word Count';
                break;
              case 'sectionCount':
                changeText = value > 0 ? `Increased Number of Sections by ${absValue} sections` : 
                          value < 0 ? `Reduced Number of Sections by ${absValue} sections` : 
                          'No change in Number of Sections';
                break;
              case 'partCount':
                changeText = value > 0 ? `Increased Number of Parts by ${absValue} parts` : 
                          value < 0 ? `Reduced Number of Parts by ${absValue} parts` : 
                          'No change in Number of Parts';
                break;
              case 'avgWordsPerSection':
                changeText = value > 0 ? `Increased Average Words per Section by ${absValue}` : 
                          value < 0 ? `Reduced Average Words per Section by ${absValue}` : 
                          'No change in Average Words per Section';
                break;
              default:
                changeText = value > 0 ? `Increased by ${absValue}` : 
                          value < 0 ? `Reduced by ${absValue}` : 
                          'No change';
                break;
            }
            
            return `${context.dataset.label}: ${changeText}`;
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
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            Error loading data: {error}
          </div>
        )}

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

        {chartData ? (
          <div style={{ height: '500px', width: '100%' }}>
            <Scatter data={chartData} options={chartOptions} />
          </div>
        ) : (
          <p style={{ color: 'var(--text-light)' }}>Loading chart...</p>
        )}
      </div>
    </div>
  );
};

export default TimeSeriesChart; 