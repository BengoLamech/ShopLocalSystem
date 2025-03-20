import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  onLoginSuccess: () => void; // Callback for successful login
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null); // Improved error type handling
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await window.electron.authenticateUser(email, password);
      
      console.log("Login response:", response); // Debugging log
  
      if (response.success) {
        console.log("Waiting for role confirmation...");        
        onLoginSuccess(); 
      } else {
        setError(response.message || "Authentication failed.");
      }
    } catch (error) {
      console.error("Error during authentication:", error);
      setError("An unexpected error occurred. Please try again.");
    }
  };

return (
    <div className="login-parent">
      <div className="login-form">
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="login-button">Login</button>
        </form>
        <div className="register-link">
          <p>
            Don't have an account?{" "}
            <button onClick={() => navigate("/register")} className="register-button">
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
