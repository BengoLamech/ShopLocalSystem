import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddProductCategory: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      alert("Both fields are required!");
      return;
    }

    setLoading(true);
    try {
      if (!window.electron?.addCategory) {
        throw new Error("IPC communication is not available.");
      }

      const response = await window.electron.addCategory(formData);
      if (response?.success) {
        alert("Product category added successfully!");
        setFormData({ name: "", description: "" });
      } else {
        alert(`Error: ${response?.message || "Unknown error occurred"}`);
      }
    } catch (error: unknown) {
      console.error("Error adding product category:", error);
      alert(error instanceof Error ? error.message : "Failed to add product category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-parent">
    <form onSubmit={handleSubmit} className="category-form">
      <h2>Add Product Category</h2>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Category Name"
        required
        disabled={loading}
      />
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Category Description"
        required
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Category"}
      </button>
      <button type="button" onClick={() => navigate("/")}>
        Back
      </button>
    </form>
    </div>
  );
};

export default AddProductCategory;
