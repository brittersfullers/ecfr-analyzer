import React from 'react';
import './App.css';
import ChartDashboard from './ChartDashboard';
import TimeSeriesChart from './TimeSeriesChart';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src="/logo.svg" className="App-logo" alt="eCFR Analyzer Logo" />
        <nav className="App-nav">
          <a href="/">Home</a>
          <a href="/regulations">Regulations</a>
          <a href="/about">About</a>
        </nav>
      </header>
      <main className="App-main">
        <ChartDashboard />
        <TimeSeriesChart />
      </main>
      <footer className="App-footer">
        <p>© 2024 eCFR Analyzer. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
// This is the main entry point of the React application.
// It imports the ChartDashboard component and renders it within the App component.
// The App component serves as the root component of the application.