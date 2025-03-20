import React, { useEffect, useState } from 'react';
import { Card, List, Alert, Spin } from 'antd';

// Define the structure of the product data
interface Product {
  id: number;
  name: string;
  stock_level: number; // Changed to match the correct field from the database
}

const InventoryStatus: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]); // Store all products
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]); // Store products with low stock
  const [totalStock, setTotalStock] = useState<number>(0); // Store total stock quantity
  const [loading, setLoading] = useState<boolean>(true); // Track loading state
  const [error, setError] = useState<string>(""); // Store error message

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        console.log("Fetching inventory data from renderer...");
        const result = await window.electron.ipcRenderer.invoke("get-inventory-data");
        console.log("Received result from main process:", result);
    
        if (result.success) {
          const productsData: Product[] = result.data;
          setProducts(productsData);
          
          // Filter products with low stock (stock_level <= 5)
          const lowStock = productsData.filter(product => product.stock_level <= 5);
          setLowStockProducts(lowStock);
          
          // Calculate the total stock level
          const total = productsData.reduce((acc, product) => acc + product.stock_level, 0);
          setTotalStock(total);
        } else {
          console.error("Failed to fetch inventory data:", result.message);
          setError(result.message || "Unknown error");
        }
      } catch (error) {
        console.error("Error fetching inventory data:", error);
        setError("Error fetching inventory data.");
      } finally {
        setLoading(false);
      }
    }; 

    fetchInventoryData();
  }, []);

  // If data is still loading, show a loading spinner
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card title="Inventory Status" className='Inventory_card'>
      <div>
        <h3>Total Products in Stock: {totalStock}</h3>

        {/* Display alert if there are low stock products */}
        {lowStockProducts.length > 0 && (
          <Alert
            message="Low Stock Alert"
            description="The following products are running low on stock."
            type="warning"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}

        {/* Display list of products with low stock */}
        <List
          size="small"
          bordered
          dataSource={lowStockProducts}
          renderItem={(product) => (
            <List.Item>
              {product.name} - {product.stock_level} in stock
            </List.Item>
          )}
        />
      </div>

      {/* Display error message if there was an issue fetching the data */}
      {error && <Alert message={error} type="error" showIcon />}
    </Card>
  );
};

export default InventoryStatus;
