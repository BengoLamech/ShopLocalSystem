import React, { useEffect, useState } from "react";
import { Table, notification } from "antd";
import { useNavigate } from "react-router-dom";

// Define User Interface
interface User {
  id: number;
  username: string;
  email: string;
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
   const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch Users from IPC
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.electron.ipcRenderer.invoke("get-users");
      if (response.success) {
        setUsers(response.users);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users.");
      notification.error({
        message: "Error",
        description: "Failed to load users.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Define Table Columns
  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
  ];

  return (
    <div className="SalesReport_container">
      <h2>Users List</h2>
      {loading ? (
        <div>Loading users...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <Table dataSource={users} columns={columns} rowKey="id" />
      )}
      <button type="button" onClick={() => navigate("/")}>
        Back
      </button>
    </div>
  );
};

export default UsersList;
