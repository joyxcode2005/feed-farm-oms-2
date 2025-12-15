import axios from "axios";

const BACKEND_URL = "http://localhost:8080/api/v1/admin";

export const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

export type AdminRole = "SUPER_ADMIN" | "ADMIN";

export const SidebarPages = [
  "Dashboard",
  "Raw Material Stock",
  "Finished Feed Stock",
  "Orders",
  "Admins",
  "Settings",
  "Map",
] as const;

export type SidebarPageType = (typeof SidebarPages)[number];

export interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
}
