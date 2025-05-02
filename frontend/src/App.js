import React from 'react';
import './App.css';
import ChartDashboard from './ChartDashboard';

function App() {
  return (
    <div className="App">
      <div className="gov-banner">
        🇺🇸 An [un]official website of the United States government
      </div>
      <header className="App-header">
        <div className="logo-container">
          <img src={process.env.PUBLIC_URL + '/logo.svg'} className="App-logo" alt="eCFR Analyzer Logo" />
          <div className="header-text">
            <h1 className="department-title">Department of Government Efficiency</h1>
            <p className="department-tagline">The people voted for major reform.</p>
          </div>
        </div>
        <nav className="App-nav">
          <a href="/">Home</a>
          <a href="/regulations">Regulations</a>
          <a href="/about">About</a>
        </nav>
      </header>
      <main className="App-main">
        <ChartDashboard />
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