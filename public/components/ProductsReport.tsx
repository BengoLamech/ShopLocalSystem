import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const ProductsReport: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]); // Always an array
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProductsReport = async () => {
      try {
        const response = await window.electron.generateProductsReport();
        
        if (response.success && Array.isArray(response.products)) {
          setProducts(response.products); // Set products if they are valid
        } else {
          setError(response.message || "Failed to fetch products report.");
          setProducts([]); // Ensure products is always an array
        }
      } catch (err) {
        setError("An unexpected error occurred.");
        console.error(err);
        setProducts([]); // Ensure products is always an array in case of error
      }
    };

    fetchProductsReport();
  }, []);

  return (
    <div className="SalesReport_container">
      <h2>Products Report</h2>
      <button onClick={() => navigate("/")}>Home</button>
      {error && <p style={{ color: "red", marginBottom: 10}}>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Stock Level</th>
            <th>Selling Price</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.category_id}</td>
                <td>{product.stock_level}</td>
                <td>{product.selling_price}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>No products available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsReport;
