let salesChartInstance = null;
let financeDonutChartInstance = null;
let financeTrendChartInstance = null;

function getReportTotals() {
    const transactions = getTransactions();
    const expenses = getExpenses();

    let sales = 0;
    let transactionExpenses = 0;

    transactions.forEach((transaction) => {
        if (transaction.type === "credit") {
            sales += Number(transaction.amount || 0);
        } else if (transaction.type === "debit") {
            transactionExpenses += Number(transaction.amount || 0);
        }
    });

    const standaloneExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
        sales,
        expenses: transactionExpenses + standaloneExpenses,
    };
}

function renderReports() {
    const ctx = document.getElementById("salesChart");
    if (!ctx) return;

    const totals = getReportTotals();

    if (salesChartInstance) {
        salesChartInstance.destroy();
    }

    salesChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Sales", "Expenses"],
            datasets: [{
                label: "FIXYOURHUB BOOKS Financial Report",
                data: [totals.sales, totals.expenses],
                backgroundColor: [
                    "#3B82F6",
                    "#8B5CF6"
                ]
            }],
            borderRadius: 8
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: "#ffffff" }
                }
            },
            scales: {
                y: {
                    ticks: { color: "#aaa" },
                    grid: { color: "rgba(31,42,68,0.9)" }
                },
                x: {
                    ticks: { color: "#aaa" },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderFinanceDonutChart() {
    const ctx = document.getElementById("financeDonutChart");
    if (!ctx) return;

    const totals = getReportTotals();

    if (financeDonutChartInstance) {
        financeDonutChartInstance.destroy();
    }

    financeDonutChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Sales", "Expenses"],
            datasets: [{
                data: [totals.sales, totals.expenses],
                backgroundColor: [
                    "#3b82f6",
                    "#ef4444"
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#ffffff"
                    }
                }
            }
        }
    });
}

function getFinanceTrendData() {
    const transactions = getTransactions();
    const expenses = getExpenses();
    const revenueMap = {};
    const expenseMap = {};
    const revenueData = [];
    const expenseData = [];
    const labels = [];

    transactions.forEach((transaction) => {
        const rawDate = transaction.date;
        if (!rawDate || typeof rawDate !== "string") return;

        const date = rawDate.split("T")[0];
        const amount = Number(transaction.amount || 0);

        if (transaction.type === "credit") {
            if (!revenueMap[date]) revenueMap[date] = 0;
            revenueMap[date] += amount;
        } else if (transaction.type === "debit") {
            if (!expenseMap[date]) expenseMap[date] = 0;
            expenseMap[date] += amount;
        }
    });

    expenses.forEach((expense) => {
        const rawDate = expense.date;
        if (!rawDate || typeof rawDate !== "string") return;

        const date = rawDate.split("T")[0];
        const amount = Number(expense.amount || 0);

        if (!expenseMap[date]) expenseMap[date] = 0;
        expenseMap[date] += amount;
    });

    const allDates = new Set([
        ...Object.keys(revenueMap),
        ...Object.keys(expenseMap)
    ]);

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));

    sortedDates.forEach((date) => {
        labels.push(date);
        revenueData.push(revenueMap[date] || 0);
        expenseData.push(expenseMap[date] || 0);
    });

    return {
        labels,
        revenueData,
        expenseData
    };
}

function renderFinanceTrendChart() {
    const ctx = document.getElementById("financeTrendChart");
    if (!ctx) return;

    const trendData = getFinanceTrendData();

    if (financeTrendChartInstance) {
        financeTrendChartInstance.destroy();
    }

    financeTrendChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: trendData.labels,
            datasets: [
                {
                    label: "Revenue",
                    data: trendData.revenueData,
                    borderColor: "#00ffd0",
                    backgroundColor: "rgba(0,255,200,0.15)",
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4
                },
                {
                    label: "Expenses",
                    data: trendData.expenseData,
                    borderColor: "#ff4d4f",
                    backgroundColor: "rgba(255,77,79,0.15)",
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4
                }
            ]
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

document.addEventListener("DOMContentLoaded", () => {
    const reportPage = document.getElementById("salesChart");
    if (!reportPage) {
        return;
    }

    ensureAppDataLoaded()
        .then(() => {
            renderReports();
            renderFinanceDonutChart();
            renderFinanceTrendChart();
        })
        .catch((error) => {
            showError(error.message || "Unable to load reports.");
        });
});
