import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

interface SalesChartProps {
  reportType: "daily" | "monthly" | "yearly";
}

// Using SaleData instead of a separate SalesReportData interface
interface SaleData { 
  totalSales: number; // Total sales amount
  productId?: number; // (Optional) ID of the product sold
  quantity?: number; // (Optional) Quantity sold
  discount?: number; // (Optional) Discount applied
  totalPrice?: number; // (Optional) Total price after discount
  paymentMethod?: string; // (Optional) Payment method used
  sale_date?: string; // Sale date (used for daily reports)
  isBulk?: boolean; // (Optional) If the sale is bulk
  bulkQuantity?: number; // (Optional) Bulk quantity purchased
}

const SalesChart: React.FC<SalesChartProps> = ({ reportType }) => {
  const [salesData, setSalesData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let response;
        if (reportType === "daily") {
          response = await window.electron.getDailySalesReport();
        } else if (reportType === "monthly") {
          response = await window.electron.getMonthlySalesReport();
        } else if (reportType === "yearly") {
          response = await window.electron.getYearlySalesReport();
        }

        console.log("Response from API:", response);

        if (response?.success && response.report && Array.isArray(response.report)) {
          const sales: SaleData[] = response.report.map((item) => ({
            totalSales: item.totalSales || 0, // Ensure totalSales is always a number
            sale_date: item.sale_date || "", // Ensure sale_date exists for labels
          }));

          console.log("Sales report data:", sales);

          if (sales.length === 0) {
            setError("No sales data available.");
            setIsLoading(false);
            return;
          }

          const data = sales.map((sale) => sale.totalSales);
          const labels = sales.map((sale) =>
            sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : "N/A"
          );

          setSalesData(data);
          setLabels(labels);
        } else {
          setError("Invalid response format or empty report.");
        }
      } catch (err) {
        console.error("Error fetching sales data:", err);
        setError("Failed to fetch sales data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [reportType]);

  // Chart data
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: `Total Sales (${reportType})`,
        data: salesData,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true, // Enabled because Filler plugin is registered
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Sales Report (${reportType})`,
      },
    },
  };

  if (isLoading) {
    return <div>Loading sales data...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (salesData.length === 0 || labels.length === 0) {
    return <div>No data available for the selected report type.</div>;
  }

  return (
    <div>
      <h2>{`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Sales Report`}</h2>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default SalesChart;
