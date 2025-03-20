import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import Login from "../public/components/Login";
import Register from "../public/components/Register"; // Make sure to import Register component

// Function to render the Login component
const renderLogin = () => {
  const root = ReactDOM.createRoot(document.getElementById("login-page") as HTMLElement); // Ensure this matches the ID in Login.html

  root.render(
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login onLoginSuccess={() => console.log("Login successful!")} />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </HashRouter>
  );
};

renderLogin();
