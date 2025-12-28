// frontend/src/config/index.ts

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
  "Refunds",
  "Customers",
  "Expenses",
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

export const DISTRICT_STYLES: Record<string, string> = {
  Darjeeling: "fill-cyan-400",
  Kalimpong: "fill-sky-400",
  Jalpaiguri: "fill-yellow-400",
  Alipurduar: "fill-teal-400",
  "Cooch Behar": "fill-orange-400",
  "Uttar Dinajpur": "fill-indigo-400",
  "Dakshin Dinajpur": "fill-fuchsia-400",
  Maldah: "fill-rose-300",
  Murshidabad: "fill-yellow-300",
  Birbhum: "fill-blue-400",
  Nadia: "fill-green-400",
  "Purba Bardhaman": "fill-orange-300",
  "Paschim Bardhaman": "fill-amber-400",
  Hooghly: "fill-cyan-300",
  "North 24 Parganas": "fill-pink-400",
  "South 24 Parganas": "fill-lime-300",
  Kolkata: "fill-red-500",
  Howrah: "fill-green-300",
  Bankura: "fill-emerald-400",
  Purulia: "fill-violet-400",
  "Medinipur West": "fill-blue-500", // Paschim Medinipur in your JSON
  "Medinipur East": "fill-orange-500", // Purba Medinipur in your JSON
  Jhargram: "fill-purple-400",
};


