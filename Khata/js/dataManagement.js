const DATA_STORAGE_KEYS = {
    companies: "khata_demo_companies",
    transactions: "khata_demo_transactions",
    expenses: "khata_demo_expenses",
    user: "currentUser",
};

const EXPORT_VERSION = "1.0";

function getAllData() {
    const data = {
        companies: [],
        transactions: [],
        expenses: [],
        user: null,
    };

    try {
        const companies = localStorage.getItem(DATA_STORAGE_KEYS.companies);
        data.companies = companies ? JSON.parse(companies) : [];
    } catch (e) { data.companies = []; }

    try {
        const transactions = localStorage.getItem(DATA_STORAGE_KEYS.transactions);
        data.transactions = transactions ? JSON.parse(transactions) : [];
    } catch (e) { data.transactions = []; }

    try {
        const expenses = localStorage.getItem(DATA_STORAGE_KEYS.expenses);
        data.expenses = expenses ? JSON.parse(expenses) : [];
    } catch (e) { data.expenses = []; }

    try {
        const user = localStorage.getItem(DATA_STORAGE_KEYS.user);
        data.user = user ? JSON.parse(user) : null;
    } catch (e) { data.user = null; }

    return data;
}

function exportAllData() {
    const data = getAllData();
    const exportObj = {
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        data: data,
    };

    const jsonStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const filename = `khata-backup-${date}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Data exported successfully!", "success");
}

function importDataFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const imported = JSON.parse(e.target.result);

                if (!imported.version || !imported.data) {
                    showToast("Invalid backup file format.", "error");
                    reject(new Error("Invalid format"));
                    return;
                }

                const data = imported.data;
                const companiesCount = Array.isArray(data.companies) ? data.companies.length : 0;
                const transactionsCount = Array.isArray(data.transactions) ? data.transactions.length : 0;
                const expensesCount = Array.isArray(data.expenses) ? data.expenses.length : 0;

                const confirmMsg = `Import backup?\n\nThis will replace:\n- ${companiesCount} companies\n- ${transactionsCount} transactions\n- ${expensesCount} expenses\n\nCurrent data will be overwritten. Continue?`;

                if (!confirm(confirmMsg)) {
                    showToast("Import cancelled.", "info");
                    resolve(null);
                    return;
                }

                localStorage.setItem(DATA_STORAGE_KEYS.companies, JSON.stringify(data.companies || []));
                localStorage.setItem(DATA_STORAGE_KEYS.transactions, JSON.stringify(data.transactions || []));
                localStorage.setItem(DATA_STORAGE_KEYS.expenses, JSON.stringify(data.expenses || []));
                if (data.user) {
                    localStorage.setItem(DATA_STORAGE_KEYS.user, JSON.stringify(data.user));
                }

                showToast("Data imported successfully! Please refresh.", "success");
                resolve(true);
            } catch (err) {
                showToast("Failed to parse backup file.", "error");
                reject(err);
            }
        };
        reader.onerror = function() {
            showToast("Failed to read file.", "error");
            reject(new Error("File read error"));
        };
        reader.readAsText(file);
    });
}

function showImportDialog() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";

    input.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (file) {
            importDataFromFile(file).catch(() => {});
        }
        document.body.removeChild(input);
    });

    document.body.appendChild(input);
    input.click();
}

function clearAllData() {
    const confirmClear = confirm("Are you sure you want to CLEAR ALL DATA?\n\nThis will delete all companies, transactions, and expenses. This action cannot be undone.");
    if (!confirmClear) {
        showToast("Clear cancelled.", "info");
        return;
    }

    const confirm2 = confirm("Really delete ALL data? This is permanent.");
    if (!confirm2) {
        showToast("Clear cancelled.", "info");
        return;
    }

    Object.values(DATA_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });

    showToast("All data cleared.", "success");
}

function showToast(message, type = "info") {
    if (typeof window.showToast === "function") {
        window.showToast(message, type);
        return;
    }
    const existing = document.querySelector(".toast-notification");
    if (existing) {
        existing.remove();
    }

    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    const style = document.createElement("style");
    style.textContent = `
        .toast-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            background: #333;
            color: #fff;
            font-family: system-ui, sans-serif;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: toast-in 0.3s ease;
        }
        .toast-success { background: #16a34a; }
        .toast-error { background: #dc2626; }
        .toast-info { background: #333; }
        @keyframes toast-in {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    if (!document.querySelector("style[data-toast]")) {
        style.setAttribute("data-toast", "true");
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toast-in 0.3s ease reverse";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}