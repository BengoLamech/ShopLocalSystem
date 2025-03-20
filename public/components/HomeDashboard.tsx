import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {  faStore, faArrowLeft, faCaretDown, faCaretUp, faCashRegister } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";


const HomeDashboard = () => {
  const [shopName, setShopName] = useState("Loading...");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const currentDate = new Date();

  const toggleMenu = (menu: string) => {
    setActiveDropdown((prevMenu) => (prevMenu === menu ? null : menu)); // Toggle the menu
  };
  const navigate = useNavigate();

  const handleClick = () => {    
    navigate("/sell");
  };
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
    <div className='home-dash-container'>
         <section className="header">
          <FontAwesomeIcon icon={faStore} className="icon" />
          <h1>Welcome to {shopName} Sales System</h1>
         </section>
         <section className='home-sidebar'>
            <div className="sidebar-content">
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
                  {/* Logout Button */}
                  <ul className="navList-home">
                    <li>
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
                  </ul>
                {/* App Version */}
                  <div className="app-version">
                    <p>App Version: 1.0.0</p>
                  </div>
            </div>              
         </section>
         <section className='home-body'>
            <article onClick={handleClick} className='home-article'     
            >
              <header>
                <h2>
                  <time dateTime={currentDate.toISOString()}>
                    {format(currentDate, "dd MMM yyyy")}
                  </time>
                </h2>
              </header>
              <FontAwesomeIcon icon={faCashRegister} className="icon" /> Next Sell...!!            
            </article>
         </section>
         <footer className='footer'>&copy; CopyRight. Developed by GoSuccessTechnologies</footer>
    </div>
  )
}

export default HomeDashboard