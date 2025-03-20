import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Define the expected response type for categories
interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  category_id: number;
  purchase_price: number;
  selling_price: number;
  stock_level: number;
  supplier_name: string;
  vat: number;
}

const ProductManagement: React.FC = () => {
  const [product, setProduct] = useState<Product>({
    id: 0,
    name: "",
    category_id: 0, // Initialize category_id as 0
    purchase_price: 0,
    selling_price: 0,
    vat: 0,
    stock_level: 0,
    supplier_name: "",
  });

  const [categories, setCategories] = useState<Category[]>([]); // Store categories here
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();

  // Fetch available product categories from the backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await window.electron.getCategories();
        if (response.success && response.categories) {
          setCategories(
            response.categories.map((category) => ({
              id: category.id ?? 0,
              name: category.name,
            }))
          );
        } else {
          setError(response.message || "Failed to load categories.");
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("An error occurred while loading categories.");
      }
    };

    fetchCategories();
  }, []);

  // Handle input changes for form fields
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "purchase_price" || name === "selling_price" || name === "stock_level") {
      setProduct((prevState) => ({
        ...prevState,
        [name]: parseFloat(value),  // Ensure values are numbers
      }));
    } else {
      setProduct((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  // Handle category change (when a category is selected)
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = parseInt(e.target.value, 10); // Get category ID
    setProduct((prevState) => ({
      ...prevState,
      category_id: categoryId, // Store the category_id in state
    }));
  };

  // Validate product before submission
  const validateProduct = () => {
    const { name, category_id, purchase_price, selling_price, stock_level } = product;

    if (!name || category_id === 0 || !purchase_price || !selling_price || !stock_level) {
      setError("All fields are required.");
      return false;
    }

    if (isNaN(purchase_price) || isNaN(selling_price)) {
      setError("Purchase and Selling prices must be numeric.");
      return false;
    }

    if (purchase_price < 0 || selling_price < 0) {
      setError("Prices cannot be negative.");
      return false;
    }

    if (isNaN(stock_level) || stock_level < 0) {
      setError("Stock Level must be a non-negative number.");
      return false;
    }

    // Check if category_id is a valid value
    if (category_id === 0) {
      setError("Please select a valid category.");
      return false;
    }

    setError(""); // Clear existing error messages
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!validateProduct()) return;
  
    const { name, category_id, purchase_price, selling_price, vat, stock_level, supplier_name } = product;
  
    try {      
      const categoryIdValid = category_id; 
  
      // Make sure the value of category_id is a valid integer
      const categoryIdRounded = Math.round(categoryIdValid);
  
      const response = await window.electron.addProduct({
        name,
        category_id: categoryIdRounded, // Use category_id after ensuring it's valid
        purchase_price,
        selling_price,
        vat,
        stock_level,
        supplier_name,
        id: 0,
      });
  
      if (response.success) {
        alert("Product saved successfully!");
        setProduct({
          id: 0,
          name: "",
          category_id: 0,
          purchase_price: 0,
          selling_price: 0,
          vat: 0,
          stock_level: 0,
          supplier_name: "",
        });
      } else {
        setError(response.message || "Failed to save the product.");
      }
    } catch (err) {
      console.error("Error saving product:", err);
      setError("An unexpected error occurred.");
    }
  };
  

  return (
    <div className="product-container">      
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <h1>Product Inventory</h1>
        <div>
          <label>Product Name</label>
          <input
            type="text"
            name="name"
            value={product.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label>Category</label>
          <select
            name="category_id"
            value={product.category_id}
            onChange={handleCategoryChange}
            required
          >
            <option value={0}>Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Purchase Price</label>
          <input
            type="number"
            name="purchase_price"
            value={product.purchase_price}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label>Selling Price</label>
          <input
            type="number"
            name="selling_price"
            value={product.selling_price}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label>VAT</label>
          <select
            name="vat"
            value={product.vat}
            onChange={handleInputChange}
            required
          >
            <option value="0">0%</option>
            <option value="8">8%</option>
            <option value="16">16%</option>
          </select>
        </div>

        <div>
          <label>Stock Level</label>
          <input
            type="number"
            name="stock_level"
            value={product.stock_level}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label>Supplier Name</label>
          <input
            type="text"
            name="supplier_name"
            value={product.supplier_name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="prod-btns">
        <button type="submit">Save Product</button>
        <button onClick={() => navigate("/")}>Back</button>
      </div>
        
      </form>
    </div>
  );
};

export default ProductManagement;
