// --- Company Management ---

function getCompanyInitials(companyName) {
    if (!companyName) return "CO";
    const words = companyName.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getAvatarColor(companyName) {
    const palette = [
        "linear-gradient(135deg,#0ea5e9,#2563eb)",
        "linear-gradient(135deg,#10b981,#059669)",
        "linear-gradient(135deg,#f59e0b,#d97706)",
        "linear-gradient(135deg,#ef4444,#dc2626)",
        "linear-gradient(135deg,#14b8a6,#0d9488)",
        "linear-gradient(135deg,#f97316,#ea580c)"
    ];
    const text = (companyName || "").trim();
    const hash = text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return palette[hash % palette.length];
}

function getCompanies() {
    return getStores().map(ensureCompanyTransactions);
}

function saveCompanies(companies) {
    saveStores(companies.map(ensureCompanyTransactions));
}

function ensureCompanyTransactions(company) {
    return {
        ...company,
        transactions: Array.isArray(company.transactions) ? company.transactions : []
    };
}

function toDateInputValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function toSaleIsoDate(selectedDate) {
    // Store sales in ISO format while preserving the selected local date.
    return new Date(`${selectedDate}T00:00:00`).toISOString();
}

function openCompanyDetails(companyId) {
    window.location.href = `company.html?id=${encodeURIComponent(companyId)}`;
}

function getCompanyRevenue(company) {
    if (!company.transactions) return 0;

    return company.transactions.reduce((sum, transaction) => {
        return sum + Number(transaction.amount || 0);
    }, 0);
}

function getCompanyTransactionCount(company) {
    if (!company.transactions) return 0;

    return company.transactions.length;
}

function getRevenue(company) {
    return getCompanyRevenue(company);
}

function getTransactionCount(company) {
    return getCompanyTransactionCount(company);
}

function getTxnCount(company) {
    return getCompanyTransactionCount(company);
}

function calculateCompanyRevenue(company) {
    return getCompanyRevenue(company);
}

function calculateTransactionCount(company) {
    return getCompanyTransactionCount(company);
}

function getTodaySales(company) {
    const transactions = Array.isArray(company.transactions) ? company.transactions : [];
    const today = toDateInputValue(new Date());

    return transactions.reduce((sum, transaction) => {
        const txnDate = transaction.date ? toDateInputValue(new Date(transaction.date)) : "";
        return txnDate === today ? sum + Number(transaction.amount || 0) : sum;
    }, 0);
}

function getTodayCompanyRevenue(company) {
    return getTodaySales(company);
}

function syncCompanyTransactionsFromGlobal(companies) {
    const allTransactions = getTransactions();
    let didMigrate = false;

    companies.forEach((company, index) => {
        const normalized = ensureCompanyTransactions(company);
        companies[index] = normalized;

        if (normalized.transactions.length > 0) {
            return;
        }

        const historicalSales = allTransactions
            .filter(txn => txn.storeId === normalized.id && txn.type === "credit")
            .map(txn => ({
                id: `sale_${txn.id || Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                date: txn.date || new Date().toISOString(),
                amount: Number(txn.amount || 0)
            }));

        if (historicalSales.length > 0) {
            normalized.transactions = historicalSales;
            didMigrate = true;
        }
    });

    if (didMigrate) {
        saveCompanies(companies);
    }
}

const companyRevenueChartInstances = new Map();

function getCompanyRevenueTrendData(company) {
    const transactions = (company.transactions || []).slice().sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });

    const labels = [];
    const revenueData = [];
    let runningTotal = 0;

    transactions.forEach((transaction) => {
        runningTotal += Number(transaction.amount || 0);
        labels.push(transaction.date);
        revenueData.push(runningTotal);
    });

    return { labels, revenueData };
}

function renderCompanyRevenueCharts() {
    if (typeof Chart === "undefined") {
        return;
    }

    document.querySelectorAll(".company-revenue-chart").forEach((canvas) => {
        const companyId = canvas.dataset.companyId;
        const company = getCompanies().find((entry) => entry.id === companyId);

        if (!company) {
            return;
        }

        const chartKey = companyId;
        const existingChart = companyRevenueChartInstances.get(chartKey);
        if (existingChart) {
            existingChart.destroy();
        }

        const trendData = getCompanyRevenueTrendData(company);
        const chart = new Chart(canvas, {
            type: "line",
            data: {
                labels: trendData.labels,
                datasets: [{
                    data: trendData.revenueData,
                    borderColor: "#00ffd0",
                    backgroundColor: "rgba(0,255,200,0.15)",
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });

        companyRevenueChartInstances.set(chartKey, chart);
    });
}

function showAddSaleModal(companyId) {
    const existing = document.getElementById("saleModalOverlay");
    if (existing) {
        existing.remove();
    }

    const overlay = document.createElement("div");
    overlay.id = "saleModalOverlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(2, 6, 23, 0.55)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1000";

    const card = document.createElement("div");
    card.className = "card";
    card.style.width = "min(92vw, 420px)";
    card.style.padding = "18px";
    card.style.borderRadius = "14px";

    card.innerHTML = `
        <h3 style="margin:0 0 12px 0;">Add Sale</h3>
        <label style="display:block; margin-bottom:6px;">Date</label>
        <input id="saleDate" type="date" style="width:100%; margin-bottom:12px; padding:12px 14px; border-radius:10px; border:1px solid #334155; background:var(--card, #121a2b); color:#e6eef8; font-size:16px; font-weight:600; color-scheme:dark;" />
        <label style="display:block; margin-bottom:6px;">Amount</label>
        <div id="amountField" class="amount-field" style="display:flex; align-items:center; gap:10px; width:100%; margin-bottom:14px; padding:12px 14px; border-radius:10px; border:1px solid #334155; background:var(--card, #121a2b); transition:border-color 0.2s ease, box-shadow 0.2s ease;">
            <span style="color:#e6eef8; font-size:22px; font-weight:700; line-height:1;">₹</span>
            <input id="saleAmount" type="number" placeholder="Enter amount" min="1" step="1" style="width:100%; border:none; background:transparent; color:#e6eef8; font-size:20px; font-weight:700; outline:none;" />
        </div>
        <div style="display:flex; gap:10px;">
            <button id="saleSaveBtn" class="btn-primary" style="flex:1;">Save</button>
            <button id="saleCancelBtn" class="secondary" style="flex:1;">Cancel</button>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const saleDateInput = document.getElementById("saleDate");
    const saleAmountInput = document.getElementById("saleAmount");
    const amountField = document.getElementById("amountField");

    saleDateInput.value = new Date().toISOString().split("T")[0];

    const applyFocusStyle = (element) => {
        element.style.borderColor = "#3b82f6";
        element.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.18)";
    };

    const clearFocusStyle = (element) => {
        element.style.borderColor = "#334155";
        element.style.boxShadow = "none";
    };

    saleDateInput.addEventListener("focus", () => applyFocusStyle(saleDateInput));
    saleDateInput.addEventListener("blur", () => clearFocusStyle(saleDateInput));
    saleAmountInput.addEventListener("focus", () => applyFocusStyle(amountField));
    saleAmountInput.addEventListener("blur", () => clearFocusStyle(amountField));

    const close = () => overlay.remove();

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            close();
        }
    });

    document.getElementById("saleCancelBtn").addEventListener("click", close);

    document.getElementById("saleSaveBtn").addEventListener("click", () => {
        const amountRaw = document.getElementById("saleAmount").value.trim();
        const date = document.getElementById("saleDate").value;
        const amount = Number(amountRaw);

        if (!date) {
            alert("Please select a valid date.");
            return;
        }

        if (!amountRaw || !Number.isFinite(amount) || amount <= 0) {
            alert("Please enter a valid sale amount.");
            return;
        }

        addSale(companyId, amount, date);
        close();
    });
}

function addSale(companyId, amount, date) {
    const companies = getCompanies();
    const companyIndex = companies.findIndex(company => company.id === companyId);

    if (companyIndex === -1) {
        alert("Error: Company not found.");
        return;
    }

    const company = ensureCompanyTransactions(companies[companyIndex]);
    const sale = {
        id: `sale_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        date: toSaleIsoDate(date),
        amount: Number(amount)
    };

    company.transactions.push(sale);
    companies[companyIndex] = company;
    saveCompanies(companies);

    // Keep existing dashboard/reports behavior in sync.
    const transactions = getTransactions();
    transactions.push({
        id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        customer: "Daily Sale",
        amount: Number(amount),
        type: "credit",
        storeId: company.id,
        storeName: company.name,
        date: toSaleIsoDate(date)
    });
    saveTransactions(transactions);

    renderCompanies();
    if (typeof renderCompanyDetails === "function") {
        renderCompanyDetails();
    }
    if (typeof updateDashboardStats === "function") {
        updateDashboardStats();
    }
}

function addCompany() {
    const companyName = prompt("Enter the new company name:");
    if (!companyName || companyName.trim() === "") {
        alert("Company name is required. Please try again.");
        return;
    }

    const companyLocation = prompt(`Enter the location for ${companyName}:`);
    const existingCompanies = getCompanies();
    const newCompany = {
        id: "company_" + Date.now() + Math.random().toString(36).substring(2, 9),
        name: companyName.trim(),
        location: companyLocation ? companyLocation.trim() : "",
        status: "online",
        createdAt: new Date().toISOString(),
        transactions: []
    };

    existingCompanies.push(newCompany);
    saveCompanies(existingCompanies);

    renderCompanies();
    if (typeof updateDashboardStats === "function") {
        updateDashboardStats();
    }
}

function editCompany(companyId) {
    const existingCompanies = getCompanies();
    const companyIndex = existingCompanies.findIndex(company => company.id === companyId);

    if (companyIndex === -1) {
        alert("Error: Company not found.");
        return;
    }

    const existingCompany = existingCompanies[companyIndex];
    const updatedName = prompt("Enter the new company name:", existingCompany.name);
    if (!updatedName || updatedName.trim() === "") {
        alert("Company name cannot be empty.");
        return;
    }

    let updatedStatus;
    while (true) {
        updatedStatus = prompt("Enter the status (online/offline):", existingCompany.status);
        if (updatedStatus === null) return;
        updatedStatus = updatedStatus.trim().toLowerCase();
        if (updatedStatus === "online" || updatedStatus === "offline") {
            break;
        }
        alert("Invalid status. Please enter 'online' or 'offline'.");
    }

    const updatedLocation = prompt("Enter the new location:", existingCompany.location);

    existingCompanies[companyIndex] = {
        ...existingCompany,
        name: updatedName.trim(),
        location: updatedLocation ? updatedLocation.trim() : "",
        status: updatedStatus
    };

    saveCompanies(existingCompanies);
    renderCompanies();
}

function deleteCompany(companyId) {
    if (!confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
        return;
    }

    const existingCompanies = getCompanies();
    const remainingCompanies = existingCompanies.filter(company => company.id !== companyId);

    if (existingCompanies.length === remainingCompanies.length) {
        alert("Error: Company not found for deletion.");
        return;
    }

    saveCompanies(remainingCompanies);
    renderCompanies();
    if (typeof updateDashboardStats === "function") {
        updateDashboardStats();
    }
}

// --- UI Rendering ---

function createCompanyCard(company, metrics) {
    const card = document.createElement("article");
    card.className = "company-card";
    card.style.cursor = "pointer";
    card.setAttribute("onclick", `openCompanyDetails('${company.id}')`);

    const initials = getCompanyInitials(company.name);
    const avatarColor = getAvatarColor(company.name);
    const statusClass = company.status === "online" ? "status-online" : "status-offline";
    const statusText = company.status === "online" ? "Online" : "Offline";
    const formattedRevenue = `₹${Number(metrics.revenue || 0).toLocaleString("en-IN")}`;
    const formattedTodaySales = `₹${Number(metrics.todayRevenue || 0).toLocaleString("en-IN")}`;

    card.innerHTML = `
        <div class="company-card-content">
            <div class="company-header">
                <div class="company-info">
                    <div class="company-avatar" style="background:${avatarColor};">${initials}</div>
                    <div class="company-meta">
                        <h3>${company.name}</h3>
                        <p>${company.location || "No location"}</p>
                    </div>
                </div>
                <span class="status-pill ${statusClass}">${statusText}</span>
            </div>
            <div class="company-stats">
                <div class="stat-box">
                    <span class="stat-label">Revenue</span>
                    <span class="stat-value">${formattedRevenue}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Transactions</span>
                    <span class="stat-value">${metrics.transactionCount}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Today Sales</span>
                    <span class="stat-value">${formattedTodaySales}</span>
                </div>
            </div>
            <div class="company-chart">
                <canvas class="company-revenue-chart" data-company-id="${company.id}"></canvas>
            </div>
        </div>
        <div class="company-actions-layout">
            <div class="company-actions company-actions-stack">
                <button onclick="event.stopPropagation();showAddSaleModal('${company.id}')" class="secondary">Add Sale</button>
                <button onclick="event.stopPropagation();editCompany('${company.id}')" class="secondary">Edit</button>
                <button onclick="event.stopPropagation();deleteCompany('${company.id}')" class="danger">Delete</button>
            </div>
            <div class="company-extra-actions company-actions">
                <button onclick="event.stopPropagation();openCompanyDetails('${company.id}')" class="secondary btn-secondary">View Details</button>
                <button onclick="event.stopPropagation();window.location.href='reports.html'" class="secondary btn-secondary">Reports</button>
            </div>
        </div>
    `;

    return card;
}

function getRevenue(company) {
    if (!company.transactions) return 0;
    return company.transactions.reduce((t, s) => t + Number(s.amount || 0), 0);
}

function getTxnCount(company) {
    if (!company.transactions) return 0;
    return company.transactions.length;
}

function renderCompanies() {
    const container = document.getElementById("companiesContainer");
    if (!container) return;

    let companies = getCompanies();
    syncCompanyTransactionsFromGlobal(companies);
    companies = getCompanies(); // Re-fetch after sync

    container.innerHTML = "";

    if (companies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No companies yet</h3>
                <p>Click "+ Add Company" to get started.</p>
            </div>
        `;
        return;
    }

    companies.forEach(company => {
        const metrics = {
            revenue: getRevenue(company),
            transactionCount: getTxnCount(company),
            todayRevenue: getTodaySales(company)
        };
        const card = createCompanyCard(company, metrics);
        container.appendChild(card);
    });

    renderCompanyRevenueCharts();
}

document.addEventListener("DOMContentLoaded", renderCompanies);
