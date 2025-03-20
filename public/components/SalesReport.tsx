import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

const SalesReport: React.FC = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [salesReport, setSalesReport] = useState<any[]>([]); // Always an array
  const [error, setError] = useState("");

  const fetchSalesReport = async () => {
    try {
      const response = await window.electron.generateSalesReport(startDate, endDate);
      
      if (response.success && Array.isArray(response.sales)) {
        setSalesReport(response.sales); // Set the sales data to state
        setError(""); // Clear any previous error
      } else {
        setError(response.message || "Failed to fetch sales report.");
        setSalesReport([]); // Ensure salesReport is an empty array if there's an error
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
      setSalesReport([]); // Ensure salesReport is an empty array in case of an error
    }
  };

  const exportToPDF = () => {
    if (salesReport.length === 0) {
      alert("No data to export!");
      return;
    }

    // Create a new PDF document in A4 size, landscape orientation
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Set margins
    const margin = 10; // 10mm margin on all sides
    const pageWidth = doc.internal.pageSize.getWidth() - 2 * margin;
    const pageHeight = doc.internal.pageSize.getHeight() - 2 * margin;

    // Add a title
    doc.setFontSize(18);
    doc.text("Sales Report", margin, margin);

    // Define table columns and their widths
    const columns = [
      { header: "Sale ID", width: 20 },
      { header: "Date", width: 30 },
      { header: "Product", width: 50 },
      { header: "Quantity", width: 20 },
      { header: "Total Price", width: 30 },
    ];

    // Calculate starting position for the table
    let startY = margin + 10; // Start below the title

    // Draw table headers
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    let currentX = margin;
    columns.forEach((col, index) => {
      doc.text(col.header, currentX, startY);
      currentX += col.width;
    });

    // Draw a line below the headers
    startY += 5;
    doc.setLineWidth(0.2);
    doc.line(margin, startY, margin + pageWidth, startY);

    // Draw table rows
    doc.setFont("helvetica", "normal");
    salesReport.forEach((sale) => {
      startY += 7; // Move to the next row
      currentX = margin;
      doc.text(sale.id.toString(), currentX, startY);
      currentX += columns[0].width;
      doc.text(sale.saleDate, currentX, startY);
      currentX += columns[1].width;
      doc.text(sale.productName, currentX, startY);
      currentX += columns[2].width;
      doc.text(sale.quantity.toString(), currentX, startY);
      currentX += columns[3].width;
      doc.text(sale.totalPrice.toString(), currentX, startY);
    });

    // Save the PDF
    doc.save("SalesReport.pdf");
  };

  return (
    <div className="SalesReport_container">
      <h2>Sales Report</h2>
      <button onClick={() => navigate("/")}>Back</button>
      <div className="date_container">
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button onClick={fetchSalesReport}>Generate Report</button>
        {salesReport.length > 0 && (
          <button onClick={exportToPDF}>Export to PDF</button>
        )}
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Sale ID</th>
            <th>Date</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Total Price</th>
          </tr>
        </thead>
        <tbody>
          {salesReport.length > 0 ? (
            salesReport.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td>{sale.saleDate}</td>
                <td>{sale.productName}</td>
                <td>{sale.quantity}</td>
                <td>{sale.totalPrice}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>No sales data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SalesReport;