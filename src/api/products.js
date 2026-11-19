import api from "./axios";

export const getProducts = () => api.get("/products");

export const getProductQueries = () => api.get("/v1/products/queries");
