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