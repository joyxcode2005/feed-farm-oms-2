import prisma from "../config/prisma";

interface CreateAnimalTypeInput {
  name: string;
}

export async function createAnimalTypeDB(
  input: CreateAnimalTypeInput
) {
  const { name } = input;

  return prisma.animalType.create({
    data: { name }
  });
}

export async function getAnimalTypesDB() {
  return prisma.animalType.findMany({
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true
    }
  });
}
