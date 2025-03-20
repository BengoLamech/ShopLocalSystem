import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterShopOwner: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shopName: "",
    kraPin: "",
    email: "",
    contactNumber: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure all fields are filled
    if (!formData.shopName || !formData.kraPin || !formData.email || !formData.contactNumber || !formData.address) {
      alert("All fields are required!");
      return;
    }

    try {
      if (!window.electron || !window.electron.addShopOwner) {
        throw new Error("Electron API is not available.");
      }

      const response = await window.electron.addShopOwner({
        shopName: formData.shopName,
        kraPin: formData.kraPin,
        postalAddress: formData.address,
        email: formData.email,
        phone: formData.contactNumber,
      });

      console.log("Shop Owner Registration Response:", response);

      if (response?.success) {
        alert("Shop owner registered successfully!");
        setFormData({ shopName: "", kraPin: "", email: "", contactNumber: "", address: "" });
      } else {
        alert(`Error: ${response?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error registering shop owner:", error);
      alert("Failed to register shop owner.");
    }
  };

  return (
    <div className="shop-container">
      <form onSubmit={handleSubmit} className="shop-owner-container">
        <h2>Register Shop Owner</h2>

        <input
          type="text"
          name="shopName"
          value={formData.shopName}
          onChange={handleChange}
          placeholder="Shop Name"
          required
        />
        <input
          type="text"
          name="kraPin"
          value={formData.kraPin}
          onChange={handleChange}
          placeholder="KRA PIN"
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <input
          type="text"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleChange}
          placeholder="Contact Number"
          required
        />
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Address"
          required
        />

        <button type="submit">Register</button>
        <button type="button" onClick={() => navigate("/")}>Back</button>
      </form>
    </div>
  );
};

export default RegisterShopOwner;
