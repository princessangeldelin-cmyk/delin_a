import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { getProductQueries, getProducts } from "./api/products";

jest.mock("./api/products", () => ({
  getProducts: jest.fn(),
  getProductQueries: jest.fn(),
}));

test("loads product data into the dashboard and filters products", async () => {
  const products = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    name: `Product ${index + 1}`,
    slug: `product-${index + 1}`,
    category: index % 2 === 0 ? "Lighting" : "Furniture",
    price: "25.50",
    quantity: 1,
    status: "Available",
  }));
  products[0].name = "Desk Lamp";
  products[1].name = "Office Chair";

  getProducts.mockResolvedValue({
    data: {
      total: products.length,
      data: products,
    },
  });
  getProductQueries.mockResolvedValue({
    data: {
      data: {
        name_and_price: [{ name: "Desk Lamp", price: "25.50" }],
        products_with_category: [
          { name: "Desk Lamp", category: { name: "Lighting" } },
          { name: "Office Chair", category: { name: "Furniture" } },
        ],
        products_ordered_by_price: [
          { id: 1, name: "Desk Lamp" },
          { id: 2, name: "Office Chair" },
        ],
        first_five_products: [{ name: "Desk Lamp", price: "25.50" }],
        price_greater_than_or_equal: [{ name: "Desk Lamp", price: "25.50" }],
        electronics: [{ name: "Desk Lamp", price: "25.50" }],
        total_price: "25.50",
        average_price: "25.50",
        highest_price: "25.50",
        lowest_price: "25.50",
        total_price_per_category: [{ name: "Lighting", total_price: "25.50" }],
        average_price_per_category: [{ name: "Lighting", avg_price: "25.50" }],
        lowest_price_per_category: [{ name: "Lighting", min_price: "25.50" }],
        average_price_sorted: [{ name: "Lighting", avg_price: "25.50" }],
        electronics_and_books: [{ name: "Electronics", avg_price: "25.50" }],
      },
    },
  });

  render(<App />);

  expect(
    await screen.findByRole("heading", { name: "Product dashboard" })
  ).toBeInTheDocument();
  const productTable = within(await screen.findByRole("table"));
  expect(await productTable.findByText("Desk Lamp")).toBeInTheDocument();
  expect(
    await screen.findByRole("heading", { name: "Overview of your data at a glance" })
  ).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(15);
  expect(productTable.getByText("Office Chair")).toBeInTheDocument();
  expect(productTable.queryByText("Product 12")).not.toBeInTheDocument();
  expect(screen.getByText("Showing 1-10 of 12 products.")).toBeInTheDocument();
  expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(await productTable.findByText("Product 12")).toBeInTheDocument();
  expect(screen.getByText("Showing 11-12 of 12 products.")).toBeInTheDocument();

  await userEvent.type(screen.getByRole("searchbox"), "lamp");

  expect(await productTable.findByText("Desk Lamp")).toBeInTheDocument();
  expect(productTable.queryByText("Office Chair")).not.toBeInTheDocument();
  expect(screen.getByText("Showing 1-1 of 1 products matching your search.")).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "Product pages" })).not.toBeInTheDocument();
  expect(getProducts).toHaveBeenCalledTimes(1);
  expect(getProductQueries).toHaveBeenCalledTimes(1);
});
