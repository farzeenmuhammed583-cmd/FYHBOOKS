const { jsPDF } = window.jspdf;

function getAllDataForPDF() {
    const companies = JSON.parse(localStorage.getItem("khata_demo_companies") || "[]");
    const transactions = JSON.parse(localStorage.getItem("khata_demo_transactions") || "[]");
    const expenses = JSON.parse(localStorage.getItem("khata_demo_expenses") || "[]");
    const businessName = localStorage.getItem("khata_business_name") || "My Business";
    
    return { companies, transactions, expenses, businessName };
}

function formatCurrency(amount) {
    return "₹" + (Number(amount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch { return "-"; }
}

async function exportToPDF() {
    const { companies, transactions, expenses, businessName } = getAllDataForPDF();
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    
    doc.setFillColor(2, 6, 23);
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(0, 255, 208);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("FIXYOURHUB BOOKS", 20, 25);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(businessName, 20, 33);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Business Report - Generated on " + new Date().toLocaleDateString("en-IN"), pageWidth - 70, 33);
    
    y = 55;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", 20, y);
    y += 10;
    
    const totalRevenue = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalExpenses = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + Number(t.amount || 0), 0) + expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netBalance = totalRevenue - totalExpenses;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    const summaryData = [
        ["Total Companies", companies.length.toString()],
        ["Total Transactions", transactions.length.toString()],
        ["Total Revenue", formatCurrency(totalRevenue)],
        ["Total Expenses", formatCurrency(totalExpenses)],
        ["Net Balance", formatCurrency(netBalance)]
    ];
    
    doc.setFillColor(245, 247, 250);
    doc.rect(20, y, pageWidth - 40, summaryData.length * 8 + 10, "F");
    
    summaryData.forEach((row, i) => {
        doc.text(row[0], 25, y + 8 + (i * 8));
        doc.text(row[1], 120, y + 8 + (i * 8));
    });
    
    y += summaryData.length * 8 + 20;
    
    if (y > 250) {
        doc.addPage();
        y = 20;
    }
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Companies", 20, y);
    y += 10;
    
    if (companies.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 150);
        doc.text("No companies found", 20, y + 5);
        y += 15;
    } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(0, 255, 208);
        doc.rect(20, y, pageWidth - 40, 8, "F");
        doc.setTextColor(2, 6, 23);
        doc.text("Name", 22, y + 5.5);
        doc.text("Location", 70, y + 5.5);
        doc.text("Status", 120, y + 5.5);
        doc.text("Balance", 160, y + 5.5);
        y += 8;
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        
        companies.forEach((c, i) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.setFillColor(i % 2 === 0 ? 255 : 250, 255, 255);
            doc.rect(20, y, pageWidth - 40, 7, "F");
            doc.text(c.name || "-", 22, y + 5);
            doc.text(c.location || "-", 70, y + 5);
            doc.text(c.status || "offline", 120, y + 5);
            doc.text(formatCurrency(c.balance || 0), 160, y + 5);
            y += 7;
        });
        y += 10;
    }
    
    if (y > 230) {
        doc.addPage();
        y = 20;
    }
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Recent Transactions", 20, y);
    y += 10;
    
    if (transactions.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 150);
        doc.text("No transactions found", 20, y + 5);
    } else {
        const recentTx = transactions.slice(0, 15);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(0, 255, 208);
        doc.rect(20, y, pageWidth - 40, 8, "F");
        doc.setTextColor(2, 6, 23);
        doc.text("Date", 22, y + 5.5);
        doc.text("Customer", 50, y + 5.5);
        doc.text("Type", 100, y + 5.5);
        doc.text("Amount", 140, y + 5.5);
        doc.text("Company", 170, y + 5.5);
        y += 8;
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        
        recentTx.forEach((t, i) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            const comp = companies.find(c => c.id === t.companyId);
            doc.setFillColor(i % 2 === 0 ? 255 : 250, 255, 255);
            doc.rect(20, y, pageWidth - 40, 7, "F");
            doc.text(formatDate(t.date), 22, y + 5);
            doc.text((t.customer || "-").substring(0, 20), 50, y + 5);
            doc.text(t.type === "credit" ? "Credit" : "Debit", 100, y + 5);
            doc.setTextColor(t.type === "credit" ? 34 : 220, t.type === "credit" ? 197 : 50, t.type === "credit" ? 94 : 50);
            doc.text(formatCurrency(t.amount), 140, y + 5);
            doc.setTextColor(60, 60, 60);
            doc.text((comp?.name || "-").substring(0, 15), 170, y + 5);
            y += 7;
        });
    }
    
    y += 15;
    
    if (y > 240) {
        doc.addPage();
        y = 20;
    }
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Expenses", 20, y);
    y += 10;
    
    if (expenses.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 150);
        doc.text("No expenses found", 20, y + 5);
    } else {
        const categoryTotals = {};
        expenses.forEach(e => {
            const cat = e.category || "Other";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount || 0);
        });
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(0, 255, 208);
        doc.rect(20, y, pageWidth - 40, 8, "F");
        doc.setTextColor(2, 6, 23);
        doc.text("Category", 22, y + 5.5);
        doc.text("Amount", 120, y + 5.5);
        y += 8;
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        
        Object.entries(categoryTotals).forEach(([cat, amt], i) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.setFillColor(i % 2 === 0 ? 255 : 250, 255, 255);
            doc.rect(20, y, pageWidth - 40, 7, "F");
            doc.text(cat, 22, y + 5);
            doc.setTextColor(220, 50, 50);
            doc.text(formatCurrency(amt), 120, y + 5);
            doc.setTextColor(60, 60, 60);
            y += 7;
        });
        
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Total: " + formatCurrency(expenses.reduce((s, e) => s + Number(e.amount || 0), 0)), 22, y + 5);
    }
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Page " + i + " of " + pageCount, pageWidth / 2, 290, { align: "center" });
    }
    
    const dateStr = new Date().toISOString().split("T")[0];
    doc.save("khata-report-" + dateStr + ".pdf");
    
    if (typeof showSuccess === "function") {
        showSuccess("PDF report exported successfully!");
    }
}