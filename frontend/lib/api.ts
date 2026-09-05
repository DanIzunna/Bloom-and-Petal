export type Category = {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  images: string[];
  imageUrl: string | null;
  imagePublicId: string | null;
  careInstructions: string | null;
  occasion: string | null;
  category: Category;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
export type ProductList = { items: Product[]; pagination: Pagination };
export type ProductInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  images?: string[];
  imageUrl?: string;
  imagePublicId?: string;
  careInstructions?: string;
  occasion?: string;
  categoryId: string;
};
export type User = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  createdAt?: string;
};
export type AuthResponse = { accessToken: string; user: User };
export type OrderItem = {
  id: string;
  quantity: number;
  price: string;
  product: { id: string; name: string; images: string[] };
};
export type Order = {
  id: string;
  recipientName: string;
  deliveryAddress: string;
  deliveryDate: string;
  totalAmount: string;
  status: "PENDING" | "PROCESSING" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  orderItems: OrderItem[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function messageFor(status: number, fallback?: string) {
  if (status === 400)
    return fallback || "Please check the information you entered.";
  if (status === 401) return "Please sign in to continue.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "We could not find what you requested.";
  if (status === 409)
    return "That already exists. Please use different details.";
  if (status === 429) return "Too many requests. Please try again shortly.";
  return "Something went wrong. Please try again.";
}

function paginatedQuery(query: string) {
  const params = new URLSearchParams(query);
  if (!params.get("page")) params.set("page", "1");
  if (!params.get("limit")) params.set("limit", "12");
  return params.toString();
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    signal,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      response.status,
      messageFor(response.status, body?.message),
    );
  return body as T;
}

export const api = {
  products: (query = "", signal?: AbortSignal) => {
    return apiRequest<ProductList>(
      `/products?${paginatedQuery(query)}`,
      {},
      undefined,
      signal,
    );
  },
  product: (id: string) => apiRequest<Product>(`/products/${id}`),
  categories: () => apiRequest<Category[]>("/categories"),
  createCategory: (data: { name: string; slug: string }, token: string) =>
    apiRequest<Category>(
      "/categories",
      { method: "POST", body: JSON.stringify(data) },
      token,
    ),
  register: (data: { name: string; email: string; password: string }) =>
    apiRequest<{ success: true; data: AuthResponse }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: async (data: { email: string; password: string }) => {
    try {
      return await apiRequest<{ success: true; data: AuthResponse }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(data) },
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new ApiError(401, "Invalid email or password.");
      }
      throw error;
    }
  },
  me: (token: string) =>
    apiRequest<{ success: true; data: User }>("/users/me", {}, token),
  createOrder: (
    data: {
      recipientName: string;
      deliveryAddress: string;
      deliveryDate: string;
      items: { productId: string; quantity: number }[];
    },
    token: string,
  ) =>
    apiRequest<{ success: true; data: Order }>(
      "/orders",
      { method: "POST", body: JSON.stringify(data) },
      token,
    ),
  orders: (token: string, query = "") =>
    apiRequest<{
      success: true;
      data: { items: Order[]; pagination: Pagination };
    }>(`/orders?${paginatedQuery(query)}`, {}, token),
  order: (id: string, token: string) =>
    apiRequest<{ success: true; data: Order }>(`/orders/${id}`, {}, token),
  createProduct: (data: ProductInput, token: string) =>
    apiRequest<Product>(
      "/products",
      { method: "POST", body: JSON.stringify(data) },
      token,
    ),
  updateProduct: (id: string, data: Partial<ProductInput>, token: string) =>
    apiRequest<Product>(
      `/products/${id}`,
      { method: "PATCH", body: JSON.stringify(data) },
      token,
    ),
  deleteProduct: (id: string, token: string) =>
    apiRequest<Product>(`/products/${id}`, { method: "DELETE" }, token),
  adminOrders: (token: string, query = "") =>
    apiRequest<{
      success: true;
      data: { items: Order[]; pagination: Pagination };
    }>(`/admin/orders?${paginatedQuery(query)}`, {}, token),
  updateOrderStatus: (id: string, status: Order["status"], token: string) =>
    apiRequest<{ success: true; data: Order }>(
      `/admin/orders/${id}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      token,
    ),
  uploadProductImage: async (
    file: File,
    token: string,
  ): Promise<{ success: true; data: { url: string; publicId: string } }> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(`${API_URL}/uploads/product-image`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok)
      throw new ApiError(
        response.status,
        messageFor(response.status, body?.message),
      );
    return body;
  },
};

export function imageFor(product: Product) {
  return product.imageUrl || product.images[0] || "/file.svg";
}
