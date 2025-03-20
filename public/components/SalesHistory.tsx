import React, { useEffect, useState } from 'react';
import { Table, Button, notification } from 'antd';
import { useNavigate } from "react-router-dom";

interface SaleData {  
  totalSales: number;
  productId: number;
  quantity: number;
  discount?: number;
  totalPrice: number;
  paymentMethod: string;
  sale_date?: string;
  isBulk?: boolean;
  bulkQuantity?: number;   
}
interface SaleDataWithId extends SaleData {
  id: number;
  productName:string;
}

const SalesHistory: React.FC = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<SaleDataWithId[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSalesHistory();
  }, []);

  // Fetch sales history from the main process
  const fetchSalesHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const salesData: SaleDataWithId[] = await window.electron.ipcRenderer.invoke('get-sales-history');
  
      console.log("Fetched sales data:", salesData); // Debugging output
  
      // Ensure required fields exist
      if (!Array.isArray(salesData)) {
        throw new Error("Invalid data format: Expected an array.");
      }
  
      if (!salesData.every(sale => sale.id && sale.productName)) {
        throw new Error("Invalid sales data format: Missing required properties.");
      }
  
      setSales(salesData);
    } catch (err) {
      console.error("Error fetching sales history:", err);
      setError("An error occurred while fetching the sales data.");
      notification.error({
        message: "Error fetching sales history",
        description: "An error occurred while fetching the sales data.",
      });
    } finally {
      setLoading(false);
    }
  };
  

  // Define the columns for the Ant Design Table
  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      render: (text: number) => (text ? `${text}%` : 'None'),
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (text: number) => `₦${text.toFixed(2)}`,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
    },
    {
      title: 'Sale Date',
      dataIndex: 'saleDate',
      key: 'saleDate',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: SaleDataWithId) => (
        <Button
          danger
          onClick={() => revokeSale(record.id)} 
          style={{
            backgroundColor: "red",
            color: "white",
            border: "none",
            padding: "5px 10px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  const revokeSale = async (saleId: number) => {
    try {
      const result = await window.electron.ipcRenderer.invoke("revoke-sale", saleId);
      if (result.success) {
        notification.success({
          message: "Sale Revoked",
          description: "The sale has been successfully revoked.",
        });
        fetchSalesHistory(); // Refresh the sales history after deletion
      } else {
        notification.error({
          message: "Failed to Revoke Sale",
          description: result.message,
        });
      }
    } catch (err) {
      console.error("Error revoking sale:", err);
      notification.error({
        message: "Error revoking sale",
        description: "An error occurred while revoking the sale.",
      });
    }
  };

  return (
    <div className="sales-history-container">
      {loading ? (
        <div>Loading sales data...</div>
      ) : error ? (
        <div>{error}</div>
      ) : sales.length === 0 ? (
        <div>No sales data available.</div>
      ) : (
        <Table dataSource={sales} columns={columns} rowKey="id" />
      )}
      
      <div className="button-container">
        <button onClick={() => navigate("/")} className='homeBtn'>Home</button>
      </div>
    </div>
  );
  
};

export default SalesHistory;
