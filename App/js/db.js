// --- Centralized Database Functions ---

function getCurrentUser() {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
        return JSON.parse(currentUser);
    }

    // Backward compatibility: migrate legacy auth key.
    const legacyUser = localStorage.getItem("khata_current_user") || localStorage.getItem("khata_user");
    if (legacyUser) {
        localStorage.setItem("currentUser", legacyUser);
        localStorage.removeItem("khata_current_user");
        return JSON.parse(legacyUser);
    }

    return null;
}

function requireCurrentUser() {
    const user = getCurrentUser();
    if (!user) {
        // If no user is logged in, redirect to the login page.
        if (window.location.pathname.includes("Pages")) {
            window.location.href = "../index.html";
        } else {
            window.location.href = "index.html";
        }
        return null;
    }
    return user;
}

function getCurrentUserEmail() {
    const user = requireCurrentUser();
    return user ? user.email : null;
}

function getStorageKey(type) {
    const email = getCurrentUserEmail();
    if (!email) return null;
    return `${type}_${email}`;
}

function getLegacyDB() {
    const email = getCurrentUserEmail();
    if (!email) return null;

    const legacyKey = `khata_data_${email}`;
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function readArrayWithLegacyFallback(type, legacyField) {
    const key = getStorageKey(type);
    if (!key) return [];

    const raw = localStorage.getItem(key);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    const legacy = getLegacyDB();
    if (!legacy || !Array.isArray(legacy[legacyField])) {
        return [];
    }

    // Read-through migration into the new per-user key.
    const migrated = legacy[legacyField];
    localStorage.setItem(key, JSON.stringify(migrated));
    return migrated;
}

function writeArray(type, value) {
    const key = getStorageKey(type);
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
}

function buildReportSnapshot() {
    const transactions = getTransactions();
    const expenses = getExpenses();

    let sales = 0;
    let debitExpenses = 0;

    transactions.forEach((transaction) => {
        if (transaction.type === "credit") {
            sales += transaction.amount;
        } else if (transaction.type === "debit") {
            debitExpenses += transaction.amount;
        }
    });

    const standaloneExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalExpenses = debitExpenses + standaloneExpenses;

    return {
        id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        generatedAt: new Date().toISOString(),
        sales: sales,
        expenses: totalExpenses,
        netBalance: sales - totalExpenses,
        transactionCount: transactions.length,
        expenseCount: expenses.length
    };
}

function appendReportSnapshot() {
    const reports = getReports();
    reports.push(buildReportSnapshot());
    saveReports(reports);
}

// --- Data-specific Accessor Functions ---

function getStores() {
    return readArrayWithLegacyFallback("companies", "stores");
}

function saveStores(stores) {
    writeArray("companies", stores);
}

function getTransactions() {
    return readArrayWithLegacyFallback("transactions", "transactions");
}

function saveTransactions(transactions) {
    writeArray("transactions", transactions);
    appendReportSnapshot();
}

function getExpenses() {
    return readArrayWithLegacyFallback("expenses", "expenses");
}

function saveExpenses(expenses) {
    writeArray("expenses", expenses);
    appendReportSnapshot();
}

function getReports() {
    return readArrayWithLegacyFallback("reports", "reports");
}

function saveReports(reports) {
    writeArray("reports", reports);
}
