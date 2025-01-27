"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterData, downloadFilterData } from "@/app/lib/filterData"; // Import the filterData function
import { Parser } from "json2csv";

export default function DatabaseViewer() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (isAuthenticated !== "true") {
      router.push("/login");
    }
  }, [router]);

  const [tables] = useState(["CM_Output", "FnO_Output"]);
  const [selectedTable, setSelectedTable] = useState("");
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // State for filters
  const [filterDate, setFilterDate] = useState("");
  const [filterSymbol, setFilterSymbol] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50); // Number of rows per page
  const [totalRows, setTotalRows] = useState(0);

  const downloadCsv = async () => {
    try {
      console.log("Starting download...");

      // Fetch ALL data with current filters
      const { data } = await downloadFilterData(
        filterDate || undefined,
        filterSymbol || undefined,
        selectedTable
      );

      if (!data || data.length === 0) {
        console.log("No data to download");
        return;
      }

      // console.log("Downloading CSV data:", data);

      // Create CSV with BOM for Excel compatibility
      const parser = new Parser();
      const csvContent = parser.parse(data);
      const bom = "\uFEFF";
      const blob = new Blob([bom + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      // Create and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedTable}_data.csv`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleResetFilters = async () => {
    setFilterDate("");
    setFilterSymbol("");
    setCurrentPage(1); // Reset to page 1 when filters are applied
    const fetchWithResetValues = async () => {
      try {
        const { data, totalRows } = await filterData(
          undefined, // explicitly pass undefined instead of empty string
          undefined, // explicitly pass undefined instead of empty string
          selectedTable,
          1, // reset to page 1
          pageSize
        );
        setTableData(data);
        setTotalRows(totalRows);

        if (data.length > 0) {
          setColumns(Object.keys(data[0]));
        }
      } catch (error) {
        console.error("Error fetching reset data:", error);
      }
    };

    fetchWithResetValues();
  };

  // Fetch filtered data
  const fetchFilteredData = async () => {
    if (!selectedTable) return;

    try {
      const { data, totalRows } = await filterData(
        filterDate || undefined,
        filterSymbol || undefined,
        selectedTable,
        currentPage,
        pageSize
      );
      setTableData(data);
      setTotalRows(totalRows);

      // Dynamically set columns if the data exists
      if (data.length > 0) {
        setColumns(Object.keys(data[0]));
      }
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    }
  };

  // Fetch filtered data when the selected table, page, or filter changes
  useEffect(() => {
    fetchFilteredData();
  }, [selectedTable, currentPage, pageSize]);

  // Handle Apply Filters button
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to page 1 when filters are applied
    fetchFilteredData();
  };

  // Filtered data (search functionality)
  const filteredData = useMemo(() => {
    return tableData.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [tableData, searchTerm]);

  // Total pages calculation
  const totalPages = Math.ceil(totalRows / pageSize);

  // Pagination handlers
  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const renderSearchInterface = () => {
    return (
      <Card className="mb-4">
        <CardHeader className="space-y-1.5 p-4">
          <CardTitle className="text-lg font-semibold">
            Search {selectedTable}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Input
                type="date"
                pattern="\d{4}-\d{2}-\d{2}"
                placeholder="YYYY-MM-DD"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Symbol</label>
              <Input
                placeholder="Filter by Symbol..."
                value={filterSymbol}
                onChange={(e) => setFilterSymbol(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button className="flex-1" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
            <Button onClick={handleResetFilters} className="flex-1">
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Database Viewer</h1>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Select onValueChange={setSelectedTable} value={selectedTable}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a table" />
          </SelectTrigger>
          <SelectContent>
            {tables.map((table) => (
              <SelectItem key={table} value={table}>
                {table}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search all columns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={downloadCsv}>Download</Button>
      </div>
      {selectedTable && (
        <>
          {renderSearchInterface()}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column} className="px-4 py-2">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column} className="px-4 py-2">
                        {row[column]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="bg-gray-200 px-4 py-2 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="bg-gray-200 px-4 py-2 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
