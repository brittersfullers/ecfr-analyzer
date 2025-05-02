const fs = require('fs');
const path = require('path');

// Read the small_summary.json file
const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/small_summary.json'), 'utf8'));

// Pre-process data into yearly aggregates
const yearlyAggregates = {};

rawData.forEach(item => {
  if (!item.date || !item.title_number) return;
  
  const date = new Date(item.date);
  const year = date.getFullYear();
  const month = date.getMonth();
  const titleNum = item.title_number.split("—")[0].trim();
  const departmentName = item.title_number.split("—")[1]?.trim() || titleNum;
  
  if (!yearlyAggregates[year]) {
    yearlyAggregates[year] = {};
  }
  
  if (!yearlyAggregates[year][departmentName]) {
    yearlyAggregates[year][departmentName] = {
      months: Array(12).fill().map(() => ({
        wordCount: 0,
        sectionCount: 0,
        partCount: 0
      })),
      total: {
        wordCount: 0,
        sectionCount: 0,
        partCount: 0
      }
    };
  }
  
  // Update monthly and total counts
  if (item.label) {
    const wordCount = item.label.trim().split(/\s+/).length;
    yearlyAggregates[year][departmentName].months[month].wordCount += wordCount;
    yearlyAggregates[year][departmentName].total.wordCount += wordCount;
  }
  if (item.type === "section") {
    yearlyAggregates[year][departmentName].months[month].sectionCount += 1;
    yearlyAggregates[year][departmentName].total.sectionCount += 1;
  }
  if (item.type === "part") {
    yearlyAggregates[year][departmentName].months[month].partCount += 1;
    yearlyAggregates[year][departmentName].total.partCount += 1;
  }
});

// Write the pre-processed data to a new file
fs.writeFileSync(
  path.join(__dirname, '../public/yearly_aggregates.json'),
  JSON.stringify(yearlyAggregates, null, 2)
);

console.log('Pre-processing complete! Created yearly_aggregates.json'); 