const numberFormatter = new Intl.NumberFormat("en-US");
const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function ProductTable({ products, loading, searchTerm }) {
  if (loading) {
    return <p className="table-message">Loading products...</p>;
  }

  if (products.length === 0) {
    return (
      <p className="table-message">
        {searchTerm ? "No products match your search." : "No products found."}
      </p>
    );
  }

  return (
    <div className="table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Category</th>
            <th scope="col">Price</th>
            <th scope="col">Quantity</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <span className="product-name">{product.name}</span>
                {product.slug && (
                  <span className="product-slug">{product.slug}</span>
                )}
              </td>
              <td>{product.category || "Uncategorized"}</td>
              <td>{priceFormatter.format(Number(product.price) || 0)}</td>
              <td>{numberFormatter.format(Number(product.quantity) || 0)}</td>
              <td>
                <span className="product-status">{product.status || "—"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductTable;
