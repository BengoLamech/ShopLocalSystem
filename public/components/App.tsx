import React from "react";
import { HashRouter as Router } from "react-router-dom";
import AppRouter from "./Router";

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <AppRouter />
      </div>
    </Router>
  );
};

export default App;
