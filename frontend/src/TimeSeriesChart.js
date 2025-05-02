import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, PointElement, CategoryScale, LinearScale, TimeScale } from "chart.js";
import 'chartjs-adapter-date-fns';

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, TimeScale);

const TimeSeriesChart = ({ data }) => {
  const [chartData, setChartData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState("wordCount");

  useEffect(() => {
    if (!data.length) return;

    // Process data to track changes over time
    const timeSeriesData = {};
    const departments = new Set();

    // First pass: collect all departments and their data points
    data.forEach(entry => {
      if (entry.title_number) {
        const department = entry.title_number.split("—")[1]?.trim();
        if (department) {
          departments.add(department);
          if (!timeSeriesData[department]) {
            timeSeriesData[department] = {
              wordCount: [],
              sectionCount: [],
              partCount: [],
              dates: []
            };
          }
        }
      }
    });

    // Second pass: calculate metrics for each time period
    // For this example, we'll use a monthly aggregation
    const monthlyData = {};
    data.forEach(entry => {
      if (entry.title_number) {
        const department = entry.title_number.split("—")[1]?.trim();
        if (department) {
          // Assuming we have a date field in the entry
          const date = new Date(entry.date || Date.now());
          const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {};
          }
          if (!monthlyData[monthKey][department]) {
            monthlyData[monthKey][department] = {
              wordCount: 0,
              sectionCount: 0,
              partCount: 0
            };
          }

          // Aggregate metrics
          if (entry.label) {
            monthlyData[monthKey][department].wordCount += entry.label.trim().split(/\s+/).length;
          }
          if (entry.type === "section") {
            monthlyData[monthKey][department].sectionCount += 1;
          }
          if (entry.type === "part") {
            monthlyData[monthKey][department].partCount += 1;
          }
        }
      }
    });

    // Prepare data for the chart
    const labels = Object.keys(monthlyData).sort();
    const datasets = Array.from(departments).map(department => {
      const values = labels.map(month => {
        const data = monthlyData[month][department];
        if (!data) return null;
        
        switch (selectedMetric) {
          case "wordCount":
            return data.wordCount;
          case "sectionCount":
            return data.sectionCount;
          case "partCount":
            return data.partCount;
          default:
            return null;
        }
      });

      // Calculate trend color
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const trendColor = lastValue > firstValue ? 'rgb(255, 99, 71)' : 'rgb(34, 139, 34)';

      return {
        label: department,
        data: values,
        borderColor: trendColor,
        backgroundColor: trendColor,
        tension: 0.4,
        fill: false
      };
    });

    setChartData({
      labels,
      datasets
    });
  }, [data, selectedMetric]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Time Period'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: selectedMetric === "wordCount" ? "Word Count" :
                selectedMetric === "sectionCount" ? "Section Count" :
                "Part Count"
        }
      }
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <h2 className="chart-title">Regulatory Activity Over Time</h2>
      <p className="chart-description">
        Track changes in regulatory activity by department over time.
      </p>
      <div className="chart-content">
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <select 
            value={selectedMetric} 
            onChange={(e) => setSelectedMetric(e.target.value)}
            id="timeMetricSelect"
          >
            <option value="wordCount">Word Count</option>
            <option value="sectionCount">Section Count</option>
            <option value="partCount">Part Count</option>
          </select>
        </div>

        {chartData ? (
          <div style={{ height: '500px', width: '100%' }}>
            <Line 
              data={chartData} 
              options={chartOptions}
            />
          </div>
        ) : <p>Loading chart...</p>}
      </div>
    </div>
  );
};

export default TimeSeriesChart; 