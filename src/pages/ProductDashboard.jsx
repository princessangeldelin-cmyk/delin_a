import { useCallback, useEffect, useMemo, useState } from "react";
import { getProductQueries, getProducts } from "../api/products";
import ProductTable from "../components/dashboard/ProductTable";
import QueryVisualizations from "../components/dashboard/QueryVisualizations";
import SummaryCard from "../components/dashboard/SummaryCard";
import "./ProductDashboard.css";

const numberFormatter = new Intl.NumberFormat("en-US");
const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const PAGE_SIZE = 10;

function getErrorMessage(error) {
  if (error.code === "ERR_NETWORK") {
    return "Cannot connect to Laravel. Start the backend with `php artisan serve` from the Laravel project folder, then refresh.";
  }

  return (
    error.response?.data?.message ||
    error.message ||
    "Could not load products. Check that the Laravel server is running."
  );
}

function ProductDashboard() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [queryResults, setQueryResults] = useState(null);
  const [queryLoading, setQueryLoading] = useState(true);
  const [queryError, setQueryError] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getProducts();
      const productList = response.data?.data;
      const total = response.data?.total;

      if (!Array.isArray(productList)) {
        throw new Error("The product API returned an unexpected response.");
      }

      if (Number.isInteger(total) && total !== productList.length) {
        throw new Error(
          `The API returned ${productList.length} of ${total} products.`
        );
      }

      setProducts(productList);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQueryResults = useCallback(async () => {
    setQueryLoading(true);
    setQueryError("");

    try {
      const response = await getProductQueries();
      const results = response.data?.data;

      if (!results || typeof results !== "object" || Array.isArray(results)) {
        throw new Error("The product queries API returned an unexpected response.");
      }

      setQueryResults(results);
    } catch (requestError) {
      setQueryError(getErrorMessage(requestError));
    } finally {
      setQueryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadQueryResults();
  }, [loadProducts, loadQueryResults]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.category, product.status, product.slug]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [products, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleProducts = filteredProducts.slice(pageStart, pageStart + PAGE_SIZE);
  const firstVisibleProduct = filteredProducts.length ? pageStart + 1 : 0;
  const lastVisibleProduct = Math.min(
    pageStart + PAGE_SIZE,
    filteredProducts.length
  );
  const refreshing = loading || queryLoading;

  const categoryCount = new Set(
    products.map((product) => product.category).filter(Boolean)
  ).size;
  const totalQuantity = products.reduce(
    (total, product) => total + (Number(product.quantity) || 0),
    0
  );
  const inventoryValue = products.reduce(
    (total, product) =>
      total +
      (Number(product.price) || 0) * (Number(product.quantity) || 0),
    0
  );

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">INVENTORY</p>
          <h1>Product dashboard</h1>
          <p className="dashboard-subtitle">
            A quick overview of your products and stock.
          </p>
        </div>
        <button
          className="refresh-button"
          onClick={() => {
            loadProducts();
            loadQueryResults();
          }}
          type="button"
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="dashboard-error" role="alert">
          <span>{error}</span>
          <button onClick={loadProducts} type="button" disabled={loading}>
            Try again
          </button>
        </div>
      )}

      {queryError && (
        <div className="dashboard-error" role="alert">
          <span>Could not load query visualizations. {queryError}</span>
          <button onClick={loadQueryResults} type="button" disabled={queryLoading}>
            Try again
          </button>
        </div>
      )}

      <section className="summary-grid" aria-label="Product summary">
        <SummaryCard
          label="Products"
          value={loading ? "—" : numberFormatter.format(products.length)}
          detail="In your catalog"
        />
        <SummaryCard
          label="Categories"
          value={loading ? "—" : numberFormatter.format(categoryCount)}
          detail="Across your catalog"
        />
        <SummaryCard
          label="Units in stock"
          value={loading ? "—" : numberFormatter.format(totalQuantity)}
          detail="Total product quantity"
        />
        <SummaryCard
          label="Inventory value"
          value={loading ? "—" : priceFormatter.format(inventoryValue)}
          detail="Price multiplied by quantity"
        />
      </section>

      <QueryVisualizations
        results={queryResults}
        loading={queryLoading}
      />

      <section className="products-panel" aria-labelledby="products-heading">
        <div className="products-panel-header">
          <div>
            <h2 id="products-heading">Products</h2>
            <p>
              {loading
                ? "Loading your catalog..."
                : `Showing ${firstVisibleProduct}-${lastVisibleProduct} of ${filteredProducts.length} products${searchTerm ? " matching your search" : ""}.`}
            </p>
          </div>
          <label className="search-label">
            <span className="visually-hidden">Search products</span>
            <input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
            />
          </label>
        </div>

        <ProductTable
          products={visibleProducts}
          loading={loading}
          searchTerm={searchTerm}
        />
        {!loading && pageCount > 1 && (
          <nav className="pagination" aria-label="Product pages">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span aria-live="polite">
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={currentPage === pageCount}
            >
              Next
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}

export default ProductDashboard;
