"use server";

import prisma from "@/lib/prisma";

// Utility function to serialize Prisma data (handling Decimal and Date)
function serializeData(data) {
  return data.map((item) => {
    const serializedItem = {};
    Object.keys(item).forEach((key) => {
      const value = item[key];
      if (value instanceof Date) {
        serializedItem[key] = value.toISOString().split("T")[0];
      } else if (value && value.toNumber) {
        serializedItem[key] = value.toNumber();
      } else {
        serializedItem[key] = value;
      }
    });
    return serializedItem;
  });
}

// Add pagination parameters to the function
export async function getData(tableName, page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize;

    // Dynamically fetch the data based on the table name
    let data;
    if (tableName === "CM_Output") {
      data = await prisma.cM_Output.findMany({
        skip,
        take: pageSize,
      });
    } else if (tableName === "FnO_Output") {
      data = await prisma.fnO_Output.findMany({
        skip,
        take: pageSize,
      });
    } else {
      throw new Error("Invalid table name");
    }

    // Serialize the data before returning it to the client
    const serializedData = serializeData(data);

    // Count total rows for pagination (optional, for total pages calculation)
    const totalRows =
      tableName === "CM_Output"
        ? await prisma.cM_Output.count()
        : await prisma.fnO_Output.count();

    return {
      data: serializedData,
      totalRows,
    };
  } catch (error) {
    console.error("Error fetching paginated data:", error);
    throw new Error("Failed to fetch data");
  }
}
