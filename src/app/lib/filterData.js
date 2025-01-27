"use server";

import prisma from "@/lib/prisma";
import { json2csv } from "json-2-csv";
import { collectSegments } from "next/dist/build/segment-config/app/app-segments";

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
export async function filterData(
  date,
  symbol,
  tableName,
  page = 1,
  pageSize = 10
) {
  try {
    const skip = (page - 1) * pageSize;
    const whereClause = {};

    // Only add filters if they're not empty
    if (date) whereClause.TradDt = { equals: new Date(date) };
    if (symbol) whereClause.TckrSymb = { equals: symbol };

    // Dynamically fetch the data based on the table name
    let data;
    if (tableName === "CM_Output") {
      data = await prisma.cm_output.findMany({
        where: whereClause,
        skip,
        take: pageSize,
      });
    } else if (tableName === "FnO_Output") {
      data = await prisma.fnO_Output.findMany({
        where: whereClause,
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
        ? await prisma.cm_output.aggregate({
            where: whereClause,
            _count: true,
          })
        : await prisma.fnO_Output.aggregate({
            where: whereClause,
            _count: true,
          });

    console.log(totalRows);

    return {
      data: serializedData,
      totalRows: totalRows._count,
    };
  } catch (error) {
    console.error("Error fetching paginated data:", error);
    throw new Error("Failed to fetch data");
  }
}

export async function downloadFilterData(date, symbol, tableName) {
  try {
    const whereClause = {};

    // Only add filters if they're not empty
    if (date) whereClause.TradDt = { equals: new Date(date) };
    if (symbol) whereClause.TckrSymb = { equals: symbol };

    // Dynamically fetch the data based on the table name
    let data;
    if (tableName === "CM_Output") {
      data = await prisma.cm_output.findMany({
        where: whereClause,
      });
    } else if (tableName === "FnO_Output") {
      data = await prisma.fnO_Output.findMany({
        where: whereClause,
      });
    } else {
      throw new Error("Invalid table name");
    }

    // Serialize the data before returning it to the client
    const serializedData = serializeData(data);

    // Count total rows for pagination (optional, for total pages calculation)
    const totalRows =
      tableName === "CM_Output"
        ? await prisma.cm_output.aggregate({
            where: whereClause,
            _count: true,
          })
        : await prisma.fnO_Output.aggregate({
            where: whereClause,
            _count: true,
          });

    console.log(totalRows);

    return {
      data: serializedData,
      totalRows: totalRows._count,
    };
  } catch (error) {
    console.error("Error fetching download data:", error);
    throw new Error("Failed to fetch data");
  }
}
