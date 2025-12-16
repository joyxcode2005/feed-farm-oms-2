import prisma from "../config/prisma";

interface CreateFeedCategoryInput {
  animalTypeId: string;
  name: string;
  unitSizeKg: number;
  defaultPrice: number;
}

export async function createFeedCategoryDB(
  input: CreateFeedCategoryInput
) {
  const { animalTypeId, name, unitSizeKg, defaultPrice } = input;

  return prisma.feedCategory.create({
    data: {
      animalTypeId,
      name,
      unitSizeKg,
      defaultPrice
    }
  });
}

export async function getFeedCategoriesDB() {
  return prisma.feedCategory.findMany({
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true,
      unitSizeKg: true,
      defaultPrice: true,
      animalType: {
        select: {
          id: true,
          name: true
        }
      },
      createdAt: true,
      updatedAt: true
    }
  });
}
