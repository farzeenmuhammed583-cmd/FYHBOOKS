// --- Core Application Logic ---

function isProtectedPage(pathname) {
    const protectedPages = ["dashboard", "stores", "company", "reports", "expenses", "settings", "transactions"];
    return protectedPages.some((page) => pathname.includes(page));
}

document.addEventListener("DOMContentLoaded", async () => {
    const currentPage = window.location.pathname;
    if (!isProtectedPage(currentPage)) {
        return;
    }

    const user = typeof window.requireCurrentUser === "function"
        ? window.requireCurrentUser()
        : null;
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const userNameEl = document.getElementById("userName");
    if (userNameEl) {
        userNameEl.innerText = user.name;
    }

    try {
        await window.ensureAppDataLoaded();
    } catch (error) {
        console.error("Data load error:", error);
        if (typeof window.clearSession === "function") {
            window.clearSession();
        }
        window.location.href = window.getAppHomePath();
        return;
    }

    if (typeof window.initOnboarding === "function") {
        window.initOnboarding();
    }

    if (currentPage.includes("dashboard")) {
        updateDashboardStats();
    }
});

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
}

function getTotalTransactions() {
    return getTransactions().length;
}

let revenueChartInstance = null;

function getRevenueTrendData() {
    const transactions = getTransactions()
        .filter((transaction) => transaction.type === "credit")
        .map((transaction) => ({
            date: transaction.date,
            amount: Number(transaction.amount || 0),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = [];
    const revenueData = [];
    let runningTotal = 0;

    transactions.forEach((transaction) => {
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
            labels,
            datasets: [{
                label: "Revenue",
                data: revenueData,
                borderColor: "#00ffd0",
                backgroundColor: gradient,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: "#00ffd0",
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: "#ffffff" },
                },
            },
            scales: {
                x: {
                    ticks: { color: "#aaa" },
                    grid: { color: "rgba(255,255,255,0.05)" },
                },
                y: {
                    ticks: { color: "#aaa" },
                    grid: { color: "rgba(255,255,255,0.05)" },
                },
            },
        },
    });
}

function updateDashboardStats() {
    const salesEl = document.getElementById("totalSales");
    if (!salesEl) {
        return;
    }

    const transactions = window.getTransactions();
    const expenses = window.getExpenses();
    const stores = window.getStores();

    let totalSales = 0;
    let totalTransactionExpenses = 0;

    transactions.forEach((transaction) => {
        if (transaction.type === "credit") {
            totalSales += Number(transaction.amount || 0);
        } else if (transaction.type === "debit") {
            totalTransactionExpenses += Number(transaction.amount || 0);
        }
    });

    const totalStandaloneExpenses = expenses.reduce((acc, expense) => acc + Number(expense.amount || 0), 0);
    const netBalance = totalSales - (totalTransactionExpenses + totalStandaloneExpenses);

    document.getElementById("totalSales").innerText = formatCurrency(totalSales);
    document.getElementById("totalExpenses").innerText = formatCurrency(totalTransactionExpenses + totalStandaloneExpenses);
    document.getElementById("totalTransactions").innerText = String(getTotalTransactions());
    document.getElementById("netBalance").innerText = formatCurrency(netBalance);
    document.getElementById("storeCount").innerText = String(stores.length);
    renderRevenueChart();
}

window.getTotalTransactions = getTotalTransactions;
window.renderRevenueChart = renderRevenueChart;
window.updateDashboardStats = updateDashboardStats;
