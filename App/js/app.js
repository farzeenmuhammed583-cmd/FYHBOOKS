// --- Core Application Logic ---

document.addEventListener("DOMContentLoaded", () => {
    // Protect pages that require a logged-in user
    const protectedPages = ["dashboard", "stores", "company", "reports", "expenses", "settings", "transactions"];
    const currentPage = window.location.pathname;

    if (protectedPages.some(page => currentPage.includes(page))) {
        const user = getCurrentUser();
        if (!user) {
            // Redirect to login if no user is found
            window.location.href = window.location.pathname.includes("/Pages/") ? "../index.html" : "index.html";
            return; // Stop further execution
        }

        // Set user name in the header
        const userNameEl = document.getElementById("userName");
        if (userNameEl) {
            userNameEl.innerText = user.name;
        }
    }

    // Initial update for dashboard stats on relevant pages
    if (currentPage.includes("dashboard")) {
        updateDashboardStats();
        renderRevenueChart();
    }
});

// --- Currency Formatting Utility ---

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function getTotalTransactions(companies) {
    return companies.reduce((total, company) => {
        if (!company.transactions) {
            return total;
        }

        return total + company.transactions.length;
    }, 0);
}

let revenueChartInstance = null;

function getRevenueTrendData() {
    const companies = getStores();
    const allTransactions = [];

    companies.forEach((company) => {
        if (!company.transactions) {
            return;
        }

        company.transactions.forEach((transaction) => {
            allTransactions.push({
                date: transaction.date,
                amount: Number(transaction.amount || 0)
            });
        });
    });

    allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = [];
    const revenueData = [];
    let runningTotal = 0;

    allTransactions.forEach((transaction) => {
        runningTotal += transaction.amount;
        labels.push(new Date(transaction.date).toLocaleDateString("en-IN"));
        revenueData.push(runningTotal);
    });

    return { labels, revenueData };
}

function renderRevenueChart() {
    const chartCanvas = document.getElementById("revenueChart");
    if (!chartCanvas || typeof Chart === "undefined") {
        return;
    }

    const ctx = chartCanvas.getContext("2d");
    const { labels, revenueData } = getRevenueTrendData();

    if (revenueChartInstance) {
        revenueChartInstance.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(0,255,200,0.4)");
    gradient.addColorStop(1, "rgba(0,255,200,0.02)");

    revenueChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Revenue",
                data: revenueData,
                borderColor: "#00ffd0",
                backgroundColor: gradient,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: "#00ffd0"
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: "#ffffff" }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#aaa" },
                    grid: { color: "rgba(255,255,255,0.05)" }
                },
                y: {
                    ticks: { color: "#aaa" },
                    grid: { color: "rgba(255,255,255,0.05)" }
                }
            }
        }
    });
}

// --- Dashboard Statistics ---

function updateDashboardStats() {
    // Ensure this function only runs on pages where the elements exist
    const salesEl = document.getElementById("totalSales");
    if (!salesEl) return;

    const transactions = getTransactions();
    const expenses = getExpenses();
    const stores = getStores();
    const totalTransactions = getTotalTransactions(stores);

    let totalSales = 0;
    let totalTransactionExpenses = 0;

    transactions.forEach(t => {
        if (t.type === "credit") {
            totalSales += t.amount;
        } else if (t.type === "debit") {
            totalTransactionExpenses += t.amount;
        }
    });

    const totalStandaloneExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netBalance = totalSales - (totalTransactionExpenses + totalStandaloneExpenses);

    // Update UI elements
    document.getElementById("totalSales").innerText = formatCurrency(totalSales);
    document.getElementById("totalExpenses").innerText = formatCurrency(totalTransactionExpenses + totalStandaloneExpenses);
    document.getElementById("totalTransactions").innerText = totalTransactions;
    document.getElementById("netBalance").innerText = formatCurrency(netBalance);
    document.getElementById("storeCount").innerText = stores.length;
    renderRevenueChart();
}
