import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale } from "chart.js";

Chart.register(BarElement, CategoryScale, LinearScale);

const WordCountChart = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/small_summary.json")
      .then((response) => response.json())
      .then((json) => {
        console.log("Fetched JSON (full):", json);
  
        const titleWordCounts = {};
  
        json.forEach((entry) => {
          if (entry.type === "section" || entry.type === "part") {
            if (entry.title_number) {
              const titleNum = entry.title_number.split("—")[0].trim(); // Grab just the number part
              if (!titleWordCounts[titleNum]) {
                titleWordCounts[titleNum] = 0;
              }
              titleWordCounts[titleNum] += entry.word_count;
            }
          }
        });
  
        console.log("titleWordCounts:", titleWordCounts);
  
        const labels = Object.keys(titleWordCounts);
        const counts = Object.values(titleWordCounts);
  
        setData({
          labels,
          datasets: [
            {
              label: "Word Count per Title",
              data: counts,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        });
      });
  }, []);
  

  if (!data) return <div>Loading chart...</div>;

  return (
    <div style={{ width: "90%", margin: "auto" }}>
      <h2>Word Counts per Title</h2>
      <Bar data={data} />
    </div>
  );
};

export default WordCountChart;
