import React, { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import LoginPage from "./Login";
import RegisterPage from "./Register";
import ProductManagement from "./ProductManagemen";
import Dashboard from "./Dashboard";
import HomeDashboard from "./HomeDashboard";
import SalesForm from "./SalesForm";
import RegisterShopOwner from "./RegisterShopOwner";
import AddProductCategory from "./AddProductCategory";
import ShopOwnerDetails from "./ShopOwnerDetail";
import SalesReport from "./SalesReport";
import EditProduct from "./EditProduct";
import ProductsReport from "./ProductsReport";
import SalesHistory from "./SalesHistory";
import UsersList from "./UsersList";
import CategoriesList from "./CategoriesList";

const AppRouter: React.FC = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Function to fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        if (window.electron) {
          const role: string | null = await window.electron.ipcRenderer.invoke("get-user-role");
          console.log("Fetched user role:", role);
          setUserRole(role);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  // Handle successful login
  const handleLoginSuccess = () => {
    setLoading(true);
    setUserRole(null);
    const fetchUserRole = async () => {
      try {
        const role: string | null = await window.electron.ipcRenderer.invoke("get-user-role");
        console.log("Fetched user role:", role);
        setUserRole(role);
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserRole();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" tip="Loading user role..." />
      </div>
    );
  }

  return (
    <main>
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Admin Routes */}
        {userRole === "admin" && (
          <>
            <Route path="/sell" element={<SalesForm />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/Category" element={<CategoriesList />} />
            <Route path="/AddProduct" element={<ProductManagement />} />
            <Route path="/HomeDashboard" element={<HomeDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ProductCategory" element={<AddProductCategory />} />
            <Route path="/AddShopOwner" element={<RegisterShopOwner />} />
            <Route path="/EditProduct" element={<EditProduct />} />
            <Route path="/SalesReport" element={<SalesReport />} />
            <Route path="/Shopowner" element={<ShopOwnerDetails />} />
            <Route path="/ProductReport" element={<ProductsReport />} />
            <Route path="/SalesHistory" element={<SalesHistory />} />
            <Route path="/SalesReport" element={<SalesReport />} />
        </>
        )}

        {/* User Routes */}
        {( userRole === "admin" || userRole === "cashier") && (
          <>
            <Route path="/HomeDashboard" element={<HomeDashboard />} />
            <Route path="/sell" element={<SalesForm />} />
            <Route path="/SalesHistory" element={<SalesHistory />} />
            <Route path="/SalesReport" element={<SalesReport />} />
          </>
        )}

        {/* Redirect root to appropriate dashboard based on role */}
        <Route path="/" element={
          location.pathname === "/" ? (
            userRole ? (
              <Navigate to={userRole === "admin" ? "/dashboard" : "/HomeDashboard"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          ) : null
        } />
        {/* Catch-all: Redirect to dashboard based on role */}
        <Route path="*" element={<Navigate to={userRole === "admin" ? "/dashboard" : "/HomeDashboard"} replace />} />
      </Routes>
    </main>
  );
};

export default AppRouter;
