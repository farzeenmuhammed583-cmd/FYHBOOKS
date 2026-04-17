
// --- KHATA DEMO MODE MOCK SERVICE ---
// This file simulates the backend API for frontend-only demonstrations.

const MOCK_DATA = {
  user: {
    id: "user-demo-01",
    name: "Demo User",
    email: "demo@khata.app",
  },
  token: "jwt-demo-token-string-for-local-auth-simulation",
  companies: [
    { id: "comp-01", name: "FELLA ORNAMENTS LLP" },
    { id: "comp-02", name: "Personal" },
  ],
  transactions: [
    { id: "txn-01", companyId: "comp-01", customer: "Aarav Sharma", amount: 15000, type: "credit", date: "2024-07-28" },
    { id: "txn-02", companyId: "comp-01", customer: "Priya Patel", amount: 8500, type: "credit", date: "2024-07-27" },
    { id: "txn-03", companyId: "comp-02", customer: "Zomato", amount: 450, type: "debit", date: "2024-07-26" },
    { id: "txn-04", companyId: "comp-01", customer: "Office Supplies", amount: 1200, type: "debit", date: "2024-07-25" },
  ],
  expenses: [
      { id: "exp-01", companyId: "comp-01", category: "Rent", amount: 5000, date: "2024-07-01" },
      { id: "exp-02", companyId: "comp-01", category: "Utilities", amount: 750, date: "2024-07-15" },
  ]
};

const DEMO_STORAGE_KEYS = {
    companies: "khata_demo_companies",
    transactions: "khata_demo_transactions",
    expenses: "khata_demo_expenses",
};

function getMockData(key) {
    const stored = localStorage.getItem(`khata_demo_${key}`);
    if (stored) {
        return JSON.parse(stored);
    }
    // On first load, initialize from MOCK_DATA
    localStorage.setItem(`khata_demo_${key}`, JSON.stringify(MOCK_DATA[key]));
    return MOCK_DATA[key];
}

function setMockData(key, data) {
    localStorage.setItem(`khata_demo_${key}`, JSON.stringify(data));
}

function clearAllDemoData() {
    Object.values(DEMO_STORAGE_KEYS).forEach((storageKey) => {
        localStorage.removeItem(storageKey);
    });
}

// --- Mock API Endpoints ---

async function mockApiRequest(path, options = {}) {
    console.log(`%cDEMO MODE: Mocking ${options.method || "GET"} ${path}`, "color: #7c3aed; font-weight: bold;");

    await new Promise(resolve => setTimeout(resolve, 300));

    const method = options.method || "GET";

    if (path === "/auth/login") {
        localStorage.removeItem("khata_skip_auto_login");
        return { token: MOCK_DATA.token, user: MOCK_DATA.user };
    }

    if (path === "/auth/register") {
        return { message: "Account created successfully in demo mode." };
    }

    if (path === "/data/all") {
        return {
            companies: getMockData("companies"),
            transactions: getMockData("transactions"),
            expenses: getMockData("expenses"),
        };
    }

    if (path === "/companies") {
        if (method === "POST") {
            const newCompany = { ...options.body, id: `comp-${Date.now()}` };
            const companies = getMockData("companies");
            companies.push(newCompany);
            setMockData("companies", companies);
            return newCompany;
        }
        return getMockData("companies");
    }

    if (path.startsWith("/companies/")) {
        const companyId = path.split("/companies/")[1];
        const companies = getMockData("companies");
        const index = companies.findIndex(c => c.id === companyId);

        if (method === "PATCH" && index !== -1) {
            companies[index] = { ...companies[index], ...options.body };
            setMockData("companies", companies);
            return companies[index];
        }

        if (method === "DELETE" && index !== -1) {
            companies.splice(index, 1);
            setMockData("companies", companies);
            setMockData("transactions", getMockData("transactions").filter((transaction) => transaction.companyId !== companyId));
            setMockData("expenses", getMockData("expenses").filter((expense) => expense.companyId !== companyId));
            return { message: "Company deleted successfully" };
        }
    }

    if (path === "/expenses") {
        if (method === "POST") {
            const newExpense = { ...options.body, id: `exp-${Date.now()}` };
            const expenses = getMockData("expenses");
            expenses.push(newExpense);
            setMockData("expenses", expenses);
            return newExpense;
        }
        return getMockData("expenses");
    }

    if (path.startsWith("/expenses/")) {
        const expenseId = path.split("/expenses/")[1];
        const expenses = getMockData("expenses");
        const index = expenses.findIndex(e => e.id === expenseId);

        if (method === "DELETE" && index !== -1) {
            expenses.splice(index, 1);
            setMockData("expenses", expenses);
            return { message: "Expense deleted successfully" };
        }
    }

    if (path === "/transactions") {
        if (method === "POST") {
            const newTxn = { ...options.body, id: `txn-${Date.now()}` };
            const transactions = getMockData("transactions");
            transactions.unshift(newTxn);
            setMockData("transactions", transactions);
            return newTxn;
        }
        return getMockData("transactions");
    }

    if (path.startsWith("/transactions/")) {
        const transactionId = path.split("/transactions/")[1];
        const transactions = getMockData("transactions");
        const index = transactions.findIndex((transaction) => transaction.id === transactionId);

        if (method === "DELETE" && index !== -1) {
            transactions.splice(index, 1);
            setMockData("transactions", transactions);
            return { message: "Transaction deleted successfully" };
        }
    }

    if (path === "/data/reset" && method === "DELETE") {
        setMockData("companies", []);
        setMockData("transactions", []);
        setMockData("expenses", []);
        return { message: "Demo data reset successfully" };
    }

    if (path === "/auth/me" && method === "DELETE") {
        clearAllDemoData();
        return { message: "Demo account deleted successfully" };
    }

    console.warn(`No mock handler for path: ${path}`);
    return null;
}
