import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faCashRegister,
  faBox,
  faStore,
  faArrowLeft,
  faCaretDown,
  faCaretUp,
} from "@fortawesome/free-solid-svg-icons";
import SalesChart from "./SalesChart";
import InventoryStatus from "./InventoryStatus"; // Import InventoryStatus
 

const Dashboard: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null); // Tracks the active dropdown
  const [profitData, setProfitData] = useState<any>(null); // For profit analysis data

  const toggleMenu = (menu: string) => {
    setActiveDropdown((prevMenu) => (prevMenu === menu ? null : menu)); // Toggle the menu
  };

  // Function to fetch profit data (daily, monthly, yearly)
  const fetchProfitData = async () => {
    const response = await window.electron.ipcRenderer.invoke("get-profit-analysis"); 
    if (response.success) {
      setProfitData(response.data);
    }
  };

  useEffect(() => {
    fetchProfitData(); // Fetch profit data when component mounts
  }, []);
  const [shopName, setShopName] = useState("Loading...");

  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const result = await window.electron.ipcRenderer.invoke("get-shop-owner-details");  // Fetch shop details
        if (result.success && result.shopOwner) {
          setShopName(result.shopOwner.shopName || "ShopLocal"); // Set shop name dynamically
        } else {
          setShopName("ShopLocal"); // Default name if no data
        }
      } catch (error) {
        console.error("Error fetching shop details:", error);
        setShopName("ShopLocal"); // Handle errors gracefully
      }
    };

    fetchShopDetails();
  }, []);

  return (
    <div className="grid-container">
      {/* Header Section */}
      <section className="header">
        <FontAwesomeIcon icon={faStore} className="icon" />
        <h1>Welcome to {shopName} Sales System</h1>
      </section>

      {/* Sidebar Section */}
      <section className="sidebar">
        <h1 className="dashboard-header">Dashboard</h1>

        <nav className="navBar">
          <ul>
            {/* Register Dropdown */}
            <li className="navList">
              <div
                className="dropdown-header"
                onClick={() => toggleMenu("register")}
              >
                Register{" "}
                <FontAwesomeIcon
                  icon={activeDropdown === "register" ? faCaretUp : faCaretDown}
                  className="icon"
                />
              </div>
              {activeDropdown === "register" && (
                <ul className="dropdown-menu">
                  <li>
                    <Link to="/register">
                      <FontAwesomeIcon icon={faUserPlus} className="icon" /> Add
                      Users
                    </Link>
                  </li>
                  <li>
                    <Link to="/AddShopOwner">
                      <FontAwesomeIcon icon={faUserPlus} className="icon" /> Add
                      Shop-owner
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Products Dropdown */}
            <li className="navList">
              <div
                className="dropdown-header"
                onClick={() => toggleMenu("products")}
              >
                Products{" "}
                <FontAwesomeIcon
                  icon={activeDropdown === "products" ? faCaretUp : faCaretDown}
                  className="icon"
                />
              </div>
              {activeDropdown === "products" && (
                <ul className="dropdown-menu">
                  <li>
                    <Link to="/AddProduct">
                      <FontAwesomeIcon icon={faBox} className="icon" /> Add
                      Products
                    </Link>
                  </li>
                  <li>
                    <Link to="/ProductCategory">
                      <FontAwesomeIcon icon={faBox} className="icon" /> Add
                      Category
                    </Link>
                  </li>
                  <li>
                    <Link to="/EditProduct">
                      <FontAwesomeIcon icon={faBox} className="icon" /> Edit
                      Products
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Sell Dropdown */}
            <li className="navList">
              <div className="dropdown-header" onClick={() => toggleMenu("sell")}>
                Sell{" "}
                <FontAwesomeIcon
                  icon={activeDropdown === "sell" ? faCaretUp : faCaretDown}
                  className="icon"
                />
              </div>
              {activeDropdown === "sell" && (
                <ul className="dropdown-menu">
                  <li>
                    <Link to="/sell">
                      <FontAwesomeIcon
                        icon={faCashRegister}
                        className="icon"
                      />{" "}
                      Sell Now
                    </Link>
                  </li>
                  <li>
                    <Link to="/SalesHistory">
                      <FontAwesomeIcon
                        icon={faCashRegister}
                        className="icon"
                      />{" "}
                      Revoke Sales
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Report Dropdown */}
            <li className="navList">
              <div
                className="dropdown-header"
                onClick={() => toggleMenu("report")}
              >
                Report{" "}
                <FontAwesomeIcon
                  icon={activeDropdown === "report" ? faCaretUp : faCaretDown}
                  className="icon"
                />
              </div>
              {activeDropdown === "report" && (
                <ul className="dropdown-menu">
                  <li>
                    <Link to="/SalesReport">
                      <FontAwesomeIcon icon={faBox} className="icon" /> Sales
                      Report
                    </Link>
                  </li>
                  <li>
                    <Link to="/ProductReport">
                      <FontAwesomeIcon icon={faBox} className="icon" /> View
                      Products
                    </Link>
                  </li>
                  <li>
                    <Link to="/Category">
                      <FontAwesomeIcon icon={faBox} className="icon" />Product Category
                    </Link>
                  </li>
                  <li>
                    <Link to="/users">
                      <FontAwesomeIcon icon={faBox} className="icon" /> View
                      Users
                    </Link>
                  </li>
                  <li>
                    <Link to="/Shopowner">
                      <FontAwesomeIcon icon={faBox} className="icon" /> View
                      Shop report
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>

          <h3>Quick Links</h3>
          <br />
          <hr />
          <br />
                <li className="navList">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.electron.ipcRenderer.send("logout");
                    }}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="icon" /> Logout
                  </a>
                </li>
        </nav>
      </section>

      {/* Main Content Section */}
      <section className="main-container">
        <div className="grid-sales-container">  

          {/* Profit Analysis Section */}
          <div className="grid-2 grid-item">
            <h3>
              <FontAwesomeIcon icon={faCashRegister} className="icon" /> Profit
              Analysis
            </h3>
            {profitData ? (
              <div className="profit-analysis">
                <div>Daily Profit: ${profitData.daily}</div>
                <div>Monthly Profit: ${profitData.monthly}</div>
                <div>Yearly Profit: ${profitData.yearly}</div>
              </div>
            ) : (
              <div>Loading profit data...</div>
            )}
          </div>
            {/* Inventory Status */}
          <div className="grid-1 grid-item">
            <h3>
              <FontAwesomeIcon icon={faBox} className="icon" /> Inventory Status
            </h3>
            <InventoryStatus />
          </div>
          {/* Daily Sales Chart */}
          <div className="grid-3 grid-item">
            <h3>
              <FontAwesomeIcon icon={faCashRegister} className="icon" /> Daily
              Sales
            </h3>
            <SalesChart reportType="daily" />
          </div>

          {/* Monthly Sales Chart */}
          <div className="grid-4 grid-item">
            <h3>
              <FontAwesomeIcon icon={faCashRegister} className="icon" /> Monthly
              Sales
            </h3>
            <SalesChart reportType="monthly" />
          </div>

          {/* Yearly Sales Chart */}
          <div className="grid-5 grid-item">
            <h3>
              <FontAwesomeIcon icon={faCashRegister} className="icon" /> Yearly
              Sales
            </h3>
            <SalesChart reportType="yearly" />
          </div>
        </div>
      </section>
      <footer className='footer'>&copy; CopyRight. Developed by GoSuccessTechnologies</footer>
    </div>
  );
};

export default Dashboard;
