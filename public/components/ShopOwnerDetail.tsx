import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";

// Define a type for the shop owner details
interface ShopOwner {
  shopName: string;
  kraPin: string;
  postalAddress: string;
  email: string;
  phone: string;
}

const ShopOwnerDetails: React.FC = () => {
  const navigate = useNavigate();
  const [shopOwner, setShopOwner] = useState<ShopOwner | null>(null);
  const [error, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<ShopOwner>({
    shopName: "",
    kraPin: "",
    postalAddress: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const fetchShopOwnerDetails = async () => {
      try {
        const response = await window.electron.ipcRenderer.invoke("get-shop-owner-details");
        console.log("Shop Owner Response:", response);

        if (response && response.success && response.shopOwner) {
          setShopOwner(response.shopOwner);
          setFormData(response.shopOwner);
        } else {
          setError(response?.message || "Failed to load shop owner details.");
        }
      } catch (error) {
        setError("Error fetching shop owner details.");
        console.error("Fetch Error:", error);
      }
    };

    fetchShopOwnerDetails();
  }, []);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSave = async () => {
    try {
      const response = await window.electron.ipcRenderer.invoke("update-shop-owner-details", formData);
      if (response.success) {
        setShopOwner(formData); // Update displayed details
        setIsEditing(false); // Exit editing mode
        notification.success({ message: "Details updated successfully!" });
      } else {
        notification.error({ message: "Update failed", description: response.message });
      }
    } catch (error) {
      console.error("Error updating details:", error);
      notification.error({ message: "Error updating details" });
    }
  };

  return (
    <div className="show-shop">
      <div className="shop-owner-container">
        <h2>Shop Owner Details</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {shopOwner ? (
          <div className="shop-details">
            {isEditing ? (
              <div className="edit-form">
                <label>Shop Name:</label>
                <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} />

                <label>KRA PIN:</label>
                <input type="text" name="kraPin" value={formData.kraPin} onChange={handleChange} />

                <label>Postal Address:</label>
                <input type="text" name="postalAddress" value={formData.postalAddress} onChange={handleChange} />

                <label>Email:</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} />

                <label>Phone:</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} />

                <button onClick={handleSave}>Save</button>
                <button onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            ) : (
              <div>
                <p><strong>Shop Name:</strong> {shopOwner.shopName}</p>
                <p><strong>KRA PIN:</strong> {shopOwner.kraPin}</p>
                <p><strong>Postal Address:</strong> {shopOwner.postalAddress}</p>
                <p><strong>Email:</strong> {shopOwner.email}</p>
                <p><strong>Phone:</strong> {shopOwner.phone}</p>
                <button onClick={() => setIsEditing(true)}>Edit</button>
                <button onClick={() => navigate("/")}>Back</button>
              </div>
            )}
          </div>
        ) : (
          <p>Loading shop owner details...</p>
        )}
      </div>
    </div>
  );
};

export default ShopOwnerDetails;
