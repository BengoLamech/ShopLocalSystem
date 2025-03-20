import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Define types for product and categories
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

const EditProduct: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [updatedProduct, setUpdatedProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch the list of products and categories
  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        const [productResponse, categoryResponse] = await Promise.all([
          window.electron.getProducts(),
          window.electron.getCategories(),
        ]);

        if (productResponse.success && productResponse.products) {
          setProducts(productResponse.products);
        } else {
          setError(productResponse.message || "Failed to fetch products.");
        }

        if (categoryResponse.success && categoryResponse.categories) {
          // Ensure category id is always a number
          const validCategories = categoryResponse.categories.filter(
            (category) => category.id !== undefined
          );

          setCategories(validCategories as Category[]); // Ensure type is Category[]
        } else {
          setError(categoryResponse.message || "Failed to fetch categories.");
        }
      } catch (err) {
        setError("An unexpected error occurred.");
        console.error(err);
      }
    };

    fetchProductsAndCategories();
  }, []);

  // Handle product selection
  const handleProductSelection = (productId: number) => {
    const product = products.find((prod) => prod.id === productId);
    setSelectedProduct(product || null);
    setUpdatedProduct(product || null);
  };

  // Handle updating product details
  const handleUpdateProduct = async () => {
    if (updatedProduct) {
      try {
        const response = await window.electron.updateProductDetails(updatedProduct);
        if (response.success) {
          setSuccess("Product updated successfully.");
          setError("");
        } else {
          setError(response.message || "Failed to update product.");
          setSuccess("");
        }
      } catch (err) {
        setError("An unexpected error occurred.");
        console.error(err);
      }
    }
  };

  // Handle input change for the updated product
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Product) => {
    if (updatedProduct) {
      setUpdatedProduct({
        ...updatedProduct,
        [field]: e.target.value,
      });
    }
  };

  // Handle category selection
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (updatedProduct) {
      const categoryId = parseInt(e.target.value, 10);
      setUpdatedProduct({
        ...updatedProduct,
        category_id: categoryId, // Set the selected category_id
      });
    }
  };

  return (
    <div className="edit-parent">
      <div className="edit-container">
        <h2>Edit Product</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        {/* Product selection dropdown */}
        <div>
          <label>Select Product to Edit:</label>
          <select onChange={(e) => handleProductSelection(Number(e.target.value))} value={selectedProduct?.id || ""}>
            <option value="" disabled>
              -- Select Product --
            </option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* If a product is selected, show the edit form */}
        {selectedProduct && (
          <div>
            <label>
              Product Name:
              <input
                type="text"
                value={updatedProduct?.name || ""}
                onChange={(e) => handleInputChange(e, "name")}
              />
            </label>

            {/* Category selection dropdown */}
            <div>
              <label>Category:</label>
              <select
                value={updatedProduct?.category_id || ""}
                onChange={handleCategoryChange}
                required
              >
                <option value="" disabled>
                  -- Select Category --
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <label>
              Purchase Price:
              <input
                type="number"
                value={updatedProduct?.purchase_price || 0}
                onChange={(e) => handleInputChange(e, "purchase_price")}
              />
            </label>
            <label>
              Selling Price:
              <input
                type="number"
                value={updatedProduct?.selling_price || 0}
                onChange={(e) => handleInputChange(e, "selling_price")}
              />
            </label>
            <label>
              Stock Level:
              <input
                type="number"
                value={updatedProduct?.stock_level || 0}
                onChange={(e) => handleInputChange(e, "stock_level")}
              />
            </label>
            <label>
              Supplier Name:
              <input
                type="text"
                value={updatedProduct?.supplier_name || ""}
                onChange={(e) => handleInputChange(e, "supplier_name")}
              />
            </label>
            <button onClick={handleUpdateProduct}>Update Product</button>
            <button onClick={() => navigate("/")}>Back</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProduct;
