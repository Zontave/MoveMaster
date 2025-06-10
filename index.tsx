
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Environment variable check for API Key (for Gemini)
if (!process.env.API_KEY) {
  console.warn(
    "process.env.API_KEY is not set. AI features (like package content suggestions) will not work. " +
    "This is a placeholder for where your build system or environment would provide the key. " +
    "Do NOT commit API keys directly into source code for production apps."
  );
  // For local development without a .env setup or build process that injects env vars, 
  // you might temporarily set it for testing like:
  // process.env.API_KEY = "YOUR_ACTUAL_API_KEY_FOR_TESTING_ONLY";
  // But ensure this line is NOT present in committed code.
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
