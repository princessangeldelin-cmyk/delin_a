import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { getProducts } from "./api/products";

jest.mock("./api/products", () => ({
  getProducts: jest.fn(),
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

  render(<App />);

  expect(
    await screen.findByRole("heading", { name: "Product dashboard" })
  ).toBeInTheDocument();
  expect(await screen.findByText("Desk Lamp")).toBeInTheDocument();
  expect(screen.getByText("Office Chair")).toBeInTheDocument();
  expect(screen.queryByText("Product 12")).not.toBeInTheDocument();
  expect(screen.getByText("Showing 1-10 of 12 products.")).toBeInTheDocument();
  expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(await screen.findByText("Product 12")).toBeInTheDocument();
  expect(screen.getByText("Showing 11-12 of 12 products.")).toBeInTheDocument();

  await userEvent.type(screen.getByRole("searchbox"), "lamp");

  expect(await screen.findByText("Desk Lamp")).toBeInTheDocument();
  expect(screen.queryByText("Office Chair")).not.toBeInTheDocument();
  expect(screen.getByText("Showing 1-1 of 1 products matching your search.")).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "Product pages" })).not.toBeInTheDocument();
  expect(getProducts).toHaveBeenCalledTimes(1);
});
