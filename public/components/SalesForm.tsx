import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";

interface Product {
  id: number;
  name: string;
  selling_price: number;
  stock_level: number;
}

interface GetProductsResponse {
  success: boolean;
  products?: Product[];
}

interface SelectedProduct {
  productId: number;
  quantity: number;
  discount: number;
  totalPrice: number;
}

interface ShopOwner {
  id?: number;
  shopName: string;
  kraPin: string;
  postalAddress: string;
  email: string;
  phone: string;
}

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

const SalesForm: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [currentSale, setCurrentSale] = useState<SelectedProduct>({
    productId: 0,
    quantity: 1,
    discount: 0,
    totalPrice: 0,
  });
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [shopOwner, setShopOwner] = useState<ShopOwner | null>(null);
  const [receiptVisible, setReceiptVisible] = useState<boolean>(false);
  const [vatRate, setVatRate] = useState<number>(0); // VAT rate in percentage (0%, 8%, 16%)
  const receiptRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response: GetProductsResponse = await window.electron.getProducts();
        if (response.success && Array.isArray(response.products)) {
          setProducts(response.products);
        } else {
          setError("Error: Unable to fetch products.");
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Error fetching product list.");
      }
    };

    const fetchShopOwnerDetails = async () => {
      try {
        const response = await window.electron.ipcRenderer.invoke("get-shop-owner-details");
        console.log("Shop Owner Response:", response);

        if (response && response.success && response.shopOwner) {
          setShopOwner(response.shopOwner);
        } else {
          const message = response?.message || "Failed to load shop owner details.";
          setError(message);
        }
      } catch (error) {
        setError("Error fetching shop owner details.");
        console.error("Fetch Error:", error);
      }
    };

    fetchProducts();
    fetchShopOwnerDetails();
  }, []);

  const handleInputChange = (field: keyof SelectedProduct, value: any) => {
    setError(""); // Clear previous errors

    let numericValue = Number(value);
    if (isNaN(numericValue) || numericValue < 0) {
      numericValue = 0;
    }

    if (field === "quantity" && currentSale.productId) {
      const product = products.find((p) => p.id === currentSale.productId);
      if (product) {
        const totalSelectedQuantity = selectedProducts
          .filter((item) => item.productId === currentSale.productId)
          .reduce((sum, item) => sum + item.quantity, 0);

        const remainingStock = product.stock_level - totalSelectedQuantity;

        if (numericValue > remainingStock) {
          setError(`Quantity exceeds available stock (${remainingStock}).`);
          return;
        }
      }
    }

    setCurrentSale((prev) => ({
      ...prev,
      [field]: field === "quantity" || field === "discount" ? numericValue : value,
    }));
  };

  useEffect(() => {
    if (!currentSale.productId) return;

    const product = products.find((p) => p.id === currentSale.productId);
    if (product) {
      const priceBeforeVat =
        product.selling_price *
        currentSale.quantity *
        (1 - currentSale.discount / 100);

      const priceWithVat = priceBeforeVat * (1 + vatRate / 100); // Include VAT
      setCurrentSale((prev) => ({
        ...prev,
        totalPrice: parseFloat(priceWithVat.toFixed(2)),
      }));
    }
  }, [currentSale.productId, currentSale.quantity, currentSale.discount, vatRate, products]);

  const addProduct = () => {
    if (!currentSale.productId || currentSale.quantity < 1) {
      setError("Please select a valid product and quantity.");
      return;
    }

    const product = products.find((p) => p.id === currentSale.productId);
    if (!product) {
      setError("Selected product does not exist.");
      return;
    }

    const totalSelectedQuantity = selectedProducts
      .filter((item) => item.productId === currentSale.productId)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (product.stock_level < currentSale.quantity + totalSelectedQuantity) {
      setError(
        `Insufficient stock for ${product.name}. Remaining stock: ${product.stock_level - totalSelectedQuantity}`
      );
      return;
    }

    const updatedSelectedProducts = [...selectedProducts];
    const existingProductIndex = updatedSelectedProducts.findIndex(
      (item) => item.productId === currentSale.productId
    );

    if (existingProductIndex >= 0) {
      updatedSelectedProducts[existingProductIndex].quantity += currentSale.quantity;
      updatedSelectedProducts[existingProductIndex].totalPrice += currentSale.totalPrice;
    } else {
      updatedSelectedProducts.push(currentSale);
    }

    setSelectedProducts(updatedSelectedProducts);
    setCurrentSale({
      productId: 0,
      quantity: 1,
      discount: 0,
      totalPrice: 0,
    });
    setError("");
    setSearchTerm(""); // Clear the search term after adding the product
  };

  const calculateTotalCost = () =>
    selectedProducts.reduce((acc, item) => acc + item.totalPrice, 0);

  const handleCompleteSale = useCallback(async () => {
    if (selectedProducts.length === 0) {
      setError("No products selected for sale.");
      return;
    }

    try {
      const totalSales = selectedProducts.reduce((acc, item) => acc + item.totalPrice, 0);

      for (const item of selectedProducts) {
        const saleData: SaleData = {
          productId: item.productId,
          quantity: item.quantity,
          discount: item.discount,
          totalPrice: item.totalPrice,
          paymentMethod,
          totalSales,
        };

        await window.electron.recordSale(saleData);
      }

      const updatedProducts = products.map((product) => {
        const soldItem = selectedProducts.find((item) => item.productId === product.id);
        return soldItem ? { ...product, stock_level: product.stock_level - soldItem.quantity } : product;
      });

      setProducts(updatedProducts);
      setSelectedProducts([]);
      setSuccessMessage("Sale completed successfully.");
    } catch (err) {
      console.error("Error completing sale:", err);
      setError("An error occurred while processing the sale.");
    }
  }, [selectedProducts, products, paymentMethod]);

  const handlePrintReceipt = () => {
    if (receiptRef.current) {
      const receipt = receiptRef.current;

      // Hide buttons before printing
      const buttons = receipt.querySelectorAll("button");
      buttons.forEach((button) => (button.style.display = "none"));

      window.print();

      // Revert button display after printing
      buttons.forEach((button) => (button.style.display = "inline-block"));
    }
  };

  const handleDownloadReceipt = () => {
    // Set the page size to A5 (148mm x 210mm)
    const doc = new jsPDF("p", "mm", "a5");

    // Set margins
    const margin = 10; // 10mm margin on all sides
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    if (shopOwner) {
      // Set font size for the header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");

      // Center the shop name
      const shopName = shopOwner.shopName;
      const textWidth = doc.getTextWidth(shopName);
      const centerX = (pageWidth - textWidth) / 2;
      doc.text(shopName, centerX, margin);

      // Add other shop details below the shop name
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`KRA Pin: ${shopOwner.kraPin}`, margin, margin + 15);
      doc.text(`Address: ${shopOwner.postalAddress}`, margin, margin + 25);
      doc.text(`Phone: ${shopOwner.phone}`, margin, margin + 35);

      // Add a separator line
      doc.setLineWidth(0.2);
      doc.line(margin, margin + 40, pageWidth - margin, margin + 40);

      // Add the receipt content
      let startY = margin + 45; // Start the receipt content below the header

      // Table headers
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Product", margin, startY);
      doc.text("Quantity", margin + 60, startY);
      doc.text("Total", margin + 100, startY);

      // Table rows
      doc.setFont("helvetica", "normal");
      startY += 10;
      selectedProducts.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          doc.text(product.name, margin, startY);
          doc.text(item.quantity.toString(), margin + 60, startY);
          doc.text(`$${item.totalPrice.toFixed(2)}`, margin + 100, startY);
          startY += 10; // Move to the next row
        }
      });

      // Add total cost
      doc.setFont("helvetica", "bold");
      doc.text(`Total: $${calculateTotalCost().toFixed(2)}`, margin, startY + 10);

      // Save the PDF
      doc.save("receipt.pdf");
    } else {
      setError("Error: Missing shop owner details for receipt.");
    }
  };

  return (
    <div className="sales">
      <div className="nav_header">
        <button onClick={() => navigate("/")}>Back</button>
      </div>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}
      <div className="sale-parent-container">
        <div className="sales-form">
          <div className="product-selection">
            <h2>Process Sale</h2>
            <label htmlFor="productId">Select Product</label>
            <input
              id="productId"
              list="productList"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                const selectedProduct = products.find(
                  (product) => product.name === e.target.value
                );
                if (selectedProduct) {
                  handleInputChange("productId", selectedProduct.id);
                } else {
                  handleInputChange("productId", 0); // Reset if no product is selected
                }
              }}
              placeholder="Search or select a product"
              required
            />
            <datalist id="productList">
              {products.map((product) => (
                <option key={product.id} value={product.name}>
                  {product.name}
                </option>
              ))}
            </datalist>
            {products.length === 0 && <p>No products available. Please add products first.</p>}
            <label htmlFor="quantity">Quantity</label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={currentSale.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
            />
            <label htmlFor="discount">Discount (%)</label>
            <input
              type="number"
              id="discount"
              min="0"
              max="100"
              value={currentSale.discount}
              onChange={(e) => handleInputChange("discount", e.target.value)}
            />
            <label htmlFor="vatRate">VAT Rate (%)</label>
            <select
              id="vatRate"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
            >
              <option value={0}>0%</option>
              <option value={8}>8%</option>
              <option value={16}>16%</option>
            </select>
            <div>
              <strong>Total Price: Kshs{currentSale.totalPrice}</strong>
            </div>
            <button onClick={addProduct}>Add Product</button>
          </div>

          {selectedProducts.length > 0 && (
            <div className="selected-products">
              <h3>Selected Products</h3>
              <ul>
                {selectedProducts.map((item, index) => (
                  <li key={index}>
                    {products.find((p) => p.id === item.productId)?.name} -{" "}
                    {item.quantity} x ${item.totalPrice.toFixed(2)}
                  </li>
                ))}
              </ul>
              <div>
                <strong>Total Sales: ${calculateTotalCost()}</strong>
              </div>
            </div>
          )}

          <div className="payment-method">
            <label htmlFor="paymentMethod">Payment Method</label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Mpesa">Mpesa</option>
            </select>
          </div>
        </div>

        <div className="receipt-container">
          <div ref={receiptRef} className="receipt">
            <h3>Receipt</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((item, index) => (
                  <tr key={index}>
                    <td>{products.find((p) => p.id === item.productId)?.name}</td>
                    <td>{item.quantity}</td>
                    <td>${item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div>
              <strong>Total: ${calculateTotalCost()}</strong>
            </div>
          </div>
          <div className="receipt-footer">
            <button onClick={handleCompleteSale}>Complete Sale</button>
            <button onClick={handlePrintReceipt}>Print Receipt</button>
            <button onClick={handleDownloadReceipt}>Download Receipt</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesForm;