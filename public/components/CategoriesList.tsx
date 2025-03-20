import React, { useEffect, useState } from "react";
import { Table, notification } from "antd";
import { useNavigate } from "react-router-dom";
// Define Category Interface
interface Category {
  id: number;
  name: string;
  description: string;
}

const CategoriesList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch Categories from IPC
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.electron.ipcRenderer.invoke("getCategories");
      if (response.success) {
        setCategories(response.categories);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories.");
      notification.error({
        message: "Error",
        description: "Failed to load categories.",
      });
    } finally {
      setLoading(false);
    }
  }; 
  const columns = [
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
  ];

  return (
    <div className="SalesReport_container">
      <h2>Categories List</h2>
      {loading ? (
        <div>Loading categories...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <Table dataSource={categories} columns={columns} rowKey="id" />
      )}
      <button type="button" onClick={() => navigate("/")}>
        Back
      </button>
    </div>
  );
};

export default CategoriesList;
