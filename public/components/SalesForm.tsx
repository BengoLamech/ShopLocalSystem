import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

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
  const [vatRate, setVatRate] = useState<number>(0);
  const [showReceiptPopup, setShowReceiptPopup] = useState<boolean>(false);
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
    setError("");

    let numericValue: number = Number(value);
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

      const priceWithVat = priceBeforeVat * (1 + vatRate / 100);
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
    setSearchTerm("");
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
      setSuccessMessage("Sale completed successfully.");
      setShowReceiptPopup(true);
    } catch (err) {
      console.error("Error completing sale:", err);
      setError("An error occurred while processing the sale.");
    }
  }, [selectedProducts, products, paymentMethod]);

  const handlePrintReceipt = () => {
    if (receiptRef.current) {
      const receipt = receiptRef.current;
      const buttons = receipt.querySelectorAll("button");
      buttons.forEach((button) => (button.style.display = "none"));
      
      receipt.style.display = "block";
      window.print();
      receipt.style.display = "none";
      
      buttons.forEach((button) => (button.style.display = "inline-block"));
    }
  };

  const handleDownloadReceipt = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a5"
    });

    // Add shop header
    if (shopOwner) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(shopOwner.shopName, 105, 15, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`KRA Pin: ${shopOwner.kraPin}`, 105, 22, { align: "center" });
      doc.text(`Address: ${shopOwner.postalAddress}`, 105, 27, { align: "center" });
      doc.text(`Phone: ${shopOwner.phone}`, 105, 32, { align: "center" });
    }

    // Add receipt title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SALES RECEIPT", 105, 42, { align: "center" });
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 48, { align: "center" });

    // Prepare table data
    const tableData = selectedProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      return [
        product?.name || "Unknown",
        item.quantity.toString(),
        `$${item.totalPrice.toFixed(2)}`
      ];
    });

    // Add table using autoTable
    (doc as any).autoTable({
      startY: 55,
      head: [['Product', 'Qty', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 10,
        cellPadding: 3,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' }
      }
    });

    // Add totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: $${calculateTotalCost().toFixed(2)}`, 140, finalY);

    // Add payment method
    doc.setFont("helvetica", "normal");
    doc.text(`Payment Method: ${paymentMethod}`, 15, finalY + 10);

    // Add footer
    doc.setFontSize(10);
    doc.text("Thank you for your business!", 105, finalY + 20, { align: "center" });

    // Save the PDF
    doc.save(`receipt_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const closeReceiptPopup = () => {
    setShowReceiptPopup(false);
    setSelectedProducts([]);
  };

  return (
    <div className="sales">
      <div className="nav_header">
        <button onClick={() => navigate("/")}>Back</button>
      </div>
      
      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

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
                  handleInputChange("productId", 0);
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
              <strong>Total Price: ${currentSale.totalPrice.toFixed(2)}</strong>
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
                <strong>Total Sales: ${calculateTotalCost().toFixed(2)}</strong>
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
            {shopOwner && (
              <div className="receipt-header">
                <h2>{shopOwner.shopName}</h2>
                <p>KRA Pin: {shopOwner.kraPin}</p>
                <p>Address: {shopOwner.postalAddress}</p>
                <p>Phone: {shopOwner.phone}</p>
              </div>
            )}
            
            <h3>SALES RECEIPT</h3>
            <p>Date: {new Date().toLocaleDateString()}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((item, index) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <tr key={index}>
                      <td>{product?.name || "Unknown"}</td>
                      <td>{item.quantity}</td>
                      <td>${item.totalPrice.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="receipt-total">
              <strong>Total: ${calculateTotalCost().toFixed(2)}</strong>
            </div>
            
            <div className="payment-method-receipt">
              <p>Payment Method: {paymentMethod}</p>
            </div>
            
            <div className="receipt-footer">
              <p>Thank you for your business!</p>
            </div>
          </div>
          
          <div className="receipt-actions">
            <button onClick={handleCompleteSale}>Complete Sale</button>
          </div>
        </div>
      </div>

      {showReceiptPopup && (
        <div className="receipt-popup-overlay">
          <div className="receipt-popup">
            <h3>Sale Completed Successfully!</h3>
            <div className="receipt-popup-buttons">
              <button onClick={handlePrintReceipt}>Print Receipt</button>
              <button onClick={handleDownloadReceipt}>Download Receipt</button>
              <button onClick={closeReceiptPopup}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesForm;