function getCompanyIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function formatDisplayDate(dateInput) {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function openAddSaleForCurrentCompany() {
    const companyId = getCompanyIdFromUrl();
    if (!companyId) {
        alert("Invalid company.");
        return;
    }
    showAddSaleModal(companyId);
}

function renderCompanyDetails() {
    const companyId = getCompanyIdFromUrl();
    const heading = document.getElementById("companyNameHeading");
    const revenueEl = document.getElementById("companyTotalRevenue");
    const transactionsEl = document.getElementById("companyTotalTransactions");
    const todaySalesEl = document.getElementById("companyTodaySales");
    const tableBody = document.querySelector("#companySalesTable tbody");

    if (!companyId || !heading || !revenueEl || !transactionsEl || !todaySalesEl || !tableBody) {
        return;
    }

    const companies = getCompanies();
    syncCompanyTransactionsFromGlobal(companies);

    const company = companies.find(c => c.id === companyId);
    if (!company) {
        heading.textContent = "Company Not Found";
        revenueEl.textContent = formatCurrency(0);
        transactionsEl.textContent = "0";
        todaySalesEl.textContent = formatCurrency(0);
        tableBody.innerHTML = `
            <tr>
                <td colspan="2" style="text-align:center;">No sales recorded yet.</td>
            </tr>
        `;
        return;
    }

    const normalizedCompany = ensureCompanyTransactions(company);
    const sales = normalizedCompany.transactions.slice().sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    heading.textContent = normalizedCompany.name || "Company Details";
    revenueEl.textContent = formatCurrency(calculateCompanyRevenue(normalizedCompany));
    transactionsEl.textContent = String(getCompanyTransactionCount(normalizedCompany));
    todaySalesEl.textContent = formatCurrency(getTodaySales(normalizedCompany));

    tableBody.innerHTML = "";

    if (sales.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="2" style="text-align:center;">No sales recorded yet.</td>
            </tr>
        `;
        return;
    }

    sales.forEach((sale) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${formatDisplayDate(sale.date)}</td>
            <td>${formatCurrency(Number(sale.amount || 0))}</td>
        `;
    });
}

document.addEventListener("DOMContentLoaded", renderCompanyDetails);
