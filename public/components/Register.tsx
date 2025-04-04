import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier"); // Default role is "cashier"
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Regex patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{1,8}$/;

  const validateInputs = (): boolean => {
    if (!username.trim()) {
      setMessage("Username is required.");
      return false;
    }
    if (!email.trim() || !emailRegex.test(email)) {
      setMessage("Invalid email format.");
      return false;
    }
    if (!password.trim() || !passwordRegex.test(password)) {
      setMessage(
        "Password must be max 8 characters, include at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character."
      );
      return false;
    }
    if (!role.trim()) {
      setMessage("Role is required.");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    // Validate inputs
    if (!validateInputs()) return;

    try {
      if (!window.electron || !window.electron.registerUser) {
        console.error("registerUser is not available.");
        setMessage("Failed to register user.");
        return;
      }

      // Create a user object with role
      const user = { username, email, password, role };

      // Log the user object being sent to the main process
      console.log("Registering user with data:", user);

      // Call the registerUser method exposed in the preload script
      const response = await window.electron.registerUser(user);

      if (response.success) {
        setMessage("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/"), 2000); // Redirect after 2 seconds
      } else {
        setMessage(response.message || "Failed to register user.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setMessage("An unexpected error occurred during registration.");
    }
  };

  return (
    <div className="reg-parent">
      <div className="reg-container">
        <h1>Register</h1>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="cashier">Cashier</option>
          </select>
        </div>
        <button onClick={handleRegister}>Register</button>
        {message && <p>{message}</p>}
        <div>
          <button onClick={() => navigate("/")}>Back to Home</button> 
        </div>
      </div>
    </div>
  );
};

export default Register;
