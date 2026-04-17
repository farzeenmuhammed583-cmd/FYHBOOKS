// --- Company Management ---

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

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

function normalizeCompanySale(transaction) {
    return {
        id: transaction.id,
        date: transaction.date,
        amount: Number(transaction.amount || 0),
        customer: transaction.customer || "Daily Sale",
    };
}

function ensureCompanyTransactions(company) {
    const companyTransactions = getTransactions()
        .filter((transaction) => transaction.companyId === company.id && transaction.type === "credit")
        .map(normalizeCompanySale);

    return {
        ...company,
        transactions: companyTransactions,
    };
}

function getCompanies() {
    return getStores().map(ensureCompanyTransactions);
}

function toDateInputValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function toSaleIsoDate(selectedDate) {
    return new Date(`${selectedDate}T00:00:00`).toISOString();
}

function openCompanyDetails(companyId) {
    window.location.href = `company.html?id=${encodeURIComponent(companyId)}`;
}

function getCompanyRevenue(company) {
    return (company.transactions || []).reduce((sum, transaction) => {
        return sum + Number(transaction.amount || 0);
    }, 0);
}

function getCompanyTransactionCount(company) {
    return (company.transactions || []).length;
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
    return companies.map(ensureCompanyTransactions);
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

        const existingChart = companyRevenueChartInstances.get(companyId);
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

        companyRevenueChartInstances.set(companyId, chart);
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
            <span style="color:#e6eef8; font-size:22px; font-weight:700; line-height:1;">&#8377;</span>
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

    document.getElementById("saleSaveBtn").addEventListener("click", async () => {
        const amountRaw = document.getElementById("saleAmount").value.trim();
        const date = document.getElementById("saleDate").value;
        const amount = Number(amountRaw);

        if (!date) {
            showWarning("Please select a valid date.");
            return;
        }

        if (!amountRaw || !Number.isFinite(amount) || amount <= 0) {
            showWarning("Please enter a valid sale amount.");
            return;
        }

        try {
            await addSale(companyId, amount, date);
            close();
            showSuccess("Sale added successfully!");
        } catch (error) {
            showError(error.message || "Unable to save sale.");
        }
    });
}

async function addSale(companyId, amount, date) {
    const company = getStores().find((entry) => entry.id === companyId);
    if (!company) {
        throw new Error("Error: Company not found.");
    }

    await createTransactionRecord({
        customer: "Daily Sale",
        amount: Number(amount),
        type: "credit",
        companyId: company.id,
        date: toSaleIsoDate(date),
        createdAt: new Date().toISOString(),
    });

    renderCompanies();
    if (typeof renderCompanyDetails === "function") {
        renderCompanyDetails();
    }
    if (typeof updateDashboardStats === "function") {
        updateDashboardStats();
    }
}

function closeCompanyModal() {
    const overlay = document.getElementById("companyModalOverlay");
    if (overlay) {
        overlay.remove();
    }
    document.removeEventListener("keydown", companyModalEscapeHandler);
    document.body.style.overflow = "";
}

let companyModalEscapeHandler = null;

function showAddCompanyModal() {
    closeCompanyModal();

    const overlay = document.createElement("div");
    overlay.id = "companyModalOverlay";
    overlay.className = "company-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "company-modal";

    modal.innerHTML = `
        <div class="company-modal-header">
            <div>
                <h3>Add Company</h3>
                <p>Create a new company record.</p>
            </div>
            <button type="button" class="company-modal-close" aria-label="Close form">Close</button>
        </div>
        <form id="companyForm" class="company-form">
            <div class="company-form-grid">
                <label class="company-field company-field-full">
                    <span>Company Name</span>
                    <input id="companyName" type="text" placeholder="Enter company name" autocomplete="off" required />
                </label>
                <label class="company-field company-field-full">
                    <span>Location</span>
                    <input id="companyLocation" type="text" placeholder="Enter location (optional)" />
                </label>
                <label class="company-field company-field-full">
                    <span>Status</span>
                    <select id="companyStatus">
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                    </select>
                </label>
            </div>
            <div class="company-form-actions">
                <button type="submit" class="btn-primary">Save Company</button>
                <button type="button" id="companyCancelBtn" class="secondary">Cancel</button>
            </div>
        </form>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const nameInput = modal.querySelector("#companyName");
    const locationInput = modal.querySelector("#companyLocation");
    const statusSelect = modal.querySelector("#companyStatus");
    const form = modal.querySelector("#companyForm");
    const closeButton = modal.querySelector(".company-modal-close");
    const cancelButton = modal.querySelector("#companyCancelBtn");

    companyModalEscapeHandler = (event) => {
        if (event.key === "Escape") {
            closeCompanyModal();
        }
    };

    closeButton.addEventListener("click", closeCompanyModal);
    cancelButton.addEventListener("click", closeCompanyModal);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeCompanyModal();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const companyNameVal = nameInput.value.trim();
        const companyLocationVal = locationInput.value.trim();
        const companyStatusVal = statusSelect.value;

        if (!companyNameVal) {
            showWarning("Company name is required.");
            nameInput.focus();
            return;
        }

        try {
            await createCompanyRecord({
                name: companyNameVal,
                location: companyLocationVal,
                status: companyStatusVal,
                createdAt: new Date().toISOString(),
            });

            closeCompanyModal();
            renderCompanies();
            if (typeof updateDashboardStats === "function") {
                updateDashboardStats();
            }
            showSuccess("Company added successfully!");
        } catch (error) {
            showError(error.message || "Unable to add company.");
        }
    });

    document.addEventListener("keydown", companyModalEscapeHandler);
    document.body.style.overflow = "hidden";
    nameInput.focus();
}

async function addCompany() {
    showAddCompanyModal();
}

function showEditCompanyModal(companyId) {
    const existingCompany = getStores().find((company) => company.id === companyId);

    if (!existingCompany) {
        showError("Error: Company not found.");
        return;
    }

    closeCompanyModal();

    const overlay = document.createElement("div");
    overlay.id = "companyModalOverlay";
    overlay.className = "company-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "company-modal";

    modal.innerHTML = `
        <div class="company-modal-header">
            <div>
                <h3>Edit Company</h3>
                <p>Update company information.</p>
            </div>
            <button type="button" class="company-modal-close" aria-label="Close form">Close</button>
        </div>
        <form id="companyForm" class="company-form">
            <div class="company-form-grid">
                <label class="company-field company-field-full">
                    <span>Company Name</span>
                    <input id="companyName" type="text" placeholder="Enter company name" autocomplete="off" required value="${escapeHtml(existingCompany.name)}" />
                </label>
                <label class="company-field company-field-full">
                    <span>Location</span>
                    <input id="companyLocation" type="text" placeholder="Enter location (optional)" value="${escapeHtml(existingCompany.location || "")}" />
                </label>
                <label class="company-field company-field-full">
                    <span>Status</span>
                    <select id="companyStatus">
                        <option value="online" ${existingCompany.status === "online" ? "selected" : ""}>Online</option>
                        <option value="offline" ${existingCompany.status === "offline" ? "selected" : ""}>Offline</option>
                    </select>
                </label>
            </div>
            <div class="company-form-actions">
                <button type="submit" class="btn-primary">Update Company</button>
                <button type="button" id="companyCancelBtn" class="secondary">Cancel</button>
            </div>
        </form>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const nameInput = modal.querySelector("#companyName");
    const locationInput = modal.querySelector("#companyLocation");
    const statusSelect = modal.querySelector("#companyStatus");
    const form = modal.querySelector("#companyForm");
    const closeButton = modal.querySelector(".company-modal-close");
    const cancelButton = modal.querySelector("#companyCancelBtn");

    companyModalEscapeHandler = (event) => {
        if (event.key === "Escape") {
            closeCompanyModal();
        }
    };

    closeButton.addEventListener("click", closeCompanyModal);
    cancelButton.addEventListener("click", closeCompanyModal);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeCompanyModal();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const updatedName = nameInput.value.trim();
        const updatedLocation = locationInput.value.trim();
        const updatedStatus = statusSelect.value;

        if (!updatedName) {
            showWarning("Company name cannot be empty.");
            nameInput.focus();
            return;
        }

        try {
            await updateCompanyRecord(companyId, {
                name: updatedName,
                location: updatedLocation,
                status: updatedStatus,
            });
            closeCompanyModal();
            renderCompanies();
            showSuccess("Company updated successfully!");
        } catch (error) {
            showError(error.message || "Unable to update company.");
        }
    });

    document.addEventListener("keydown", companyModalEscapeHandler);
    document.body.style.overflow = "hidden";
    nameInput.focus();
}

async function editCompany(companyId) {
    showEditCompanyModal(companyId);
}

async function deleteCompany(companyId) {
    if (!confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
        return;
    }

    try {
        await deleteCompanyRecord(companyId);
        renderCompanies();
        if (typeof updateDashboardStats === "function") {
            updateDashboardStats();
        }
        if (typeof renderCompanyDetails === "function") {
            renderCompanyDetails();
        }
        showSuccess("Company deleted successfully!");
    } catch (error) {
        showError(error.message || "Unable to delete company.");
    }
}

function createCompanyCard(company, metrics) {
    const card = document.createElement("article");
    card.className = "company-card";
    card.style.cursor = "pointer";
    card.addEventListener("click", () => openCompanyDetails(company.id));

    const initials = getCompanyInitials(company.name);
    const avatarColor = getAvatarColor(company.name);
    const statusClass = company.status === "online" ? "status-online" : "status-offline";
    const statusText = company.status === "online" ? "Online" : "Offline";
    const formattedRevenue = `&#8377;${Number(metrics.revenue || 0).toLocaleString("en-IN")}`;
    const formattedTodaySales = `&#8377;${Number(metrics.todayRevenue || 0).toLocaleString("en-IN")}`;

    card.innerHTML = `
        <div class="company-card-content">
            <div class="company-header">
                <div class="company-info">
                    <div class="company-avatar" style="background:${avatarColor};">${escapeHtml(initials)}</div>
                    <div class="company-meta">
                        <h3>${escapeHtml(company.name)}</h3>
                        <p>${escapeHtml(company.location || "No location")}</p>
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
                <canvas class="company-revenue-chart" data-company-id="${escapeHtml(company.id)}"></canvas>
            </div>
        </div>
        <div class="company-actions-layout">
            <div class="company-actions company-actions-stack">
                <button onclick="event.stopPropagation();showAddSaleModal('${escapeHtml(company.id)}')" class="secondary">Add Sale</button>
                <button onclick="event.stopPropagation();showEditCompanyModal('${escapeHtml(company.id)}')" class="secondary">Edit</button>
                <button onclick="event.stopPropagation();deleteCompany('${escapeHtml(company.id)}')" class="danger">Delete</button>
            </div>
            <div class="company-extra-actions company-actions">
                <button onclick="event.stopPropagation();openCompanyDetails('${escapeHtml(company.id)}')" class="secondary btn-secondary">View Details</button>
                <button onclick="event.stopPropagation();window.location.href='reports.html'" class="secondary btn-secondary">Reports</button>
            </div>
        </div>
    `;

    return card;
}

function renderCompanies() {
    const container = document.getElementById("companiesContainer");
    if (!container) return;

    const companies = syncCompanyTransactionsFromGlobal(getStores());
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

    companies.forEach((company) => {
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

async function initStoresPage() {
    const container = document.getElementById("companiesContainer");
    if (!container) {
        return;
    }

    await ensureAppDataLoaded();
    renderCompanies();
}

document.addEventListener("DOMContentLoaded", () => {
    initStoresPage().catch((error) => {
        showError(error.message || "Unable to load companies.");
    });
});
