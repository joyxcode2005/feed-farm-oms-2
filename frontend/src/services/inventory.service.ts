/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "../config";
import { AnimalType, FeedCategory, FeedStock, RawMaterial } from "../types";

export const InventoryService = {
  // Raw Materials
  getRawMaterials: async () => {
    const res = await api.get("/raw-materials");
    return res.data.data as RawMaterial[];
  },
  createRawMaterial: async (payload: any) => {
    return await api.post("/raw-materials", payload);
  },

  // Finished Feed
  getFeedStock: async () => {
    const res = await api.get("/finished-feed/stock");
    return res.data.data as FeedStock[];
  },
  getFeedCategories: async () => {
    const res = await api.get("/feed-categories");
    return res.data.data as FeedCategory[];
  },
  getAnimalTypes: async () => {
    const res = await api.get("/animal-types");
    return res.data.data as AnimalType[];
  },
};
