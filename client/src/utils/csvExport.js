/**
 * Exports transaction list to a CSV file download
 */
export const exportToCSV = (transactions) => {
  if (!transactions || transactions.length === 0) {
    alert("No transactions to export.");
    return;
  }

  // Headers
  const baseHeaders = ["Date", "Description", "Category", "Amount", "Type", "Source"];
  
  const csvRows = [];
  csvRows.push(baseHeaders.join(",")); // Add headers

  transactions.forEach(tx => {
    // Format amount and determine type
    const amount = Math.abs(tx.amount);
    const type = tx.amount > 0 ? "Income" : "Expense";
    
    // Escape description quotes to prevent CSV breaking
    const description = `"${tx.description.replace(/"/g, '""')}"`;

    const row = [
      tx.date,
      description,
      tx.category,
      amount,
      type,
      tx.source
    ];
    
    csvRows.push(row.join(","));
  });

  // Create Blob and trigger download
  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `fintrack_export_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
