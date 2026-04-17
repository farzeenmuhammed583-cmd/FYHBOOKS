// --- KHATA DEMO MODE FLAG ---
// Set to true to use mock data from /js/demo.js
// Set to false to use the live backend API
const DEMO_MODE = true;
window.KHATA_DEMO_MODE = DEMO_MODE;

// --- API-backed application store ---

const KHATA_TOKEN_KEY = "khata_auth_token";
const KHATA_USER_KEY = "currentUser";
const KHATA_API_BASE_KEY = "khata_api_base";
const KHATA_API_TIMEOUT_MS = 15000;
const KHATA_SKIP_AUTO_LOGIN_KEY = "khata_skip_auto_login";

/**
 * ACTION REQUIRED:
 * Replace the URL below with your REAL Render backend URL.
 * Example: https://khata-backend-abc.onrender.com/api
 */
const PRODUCTION_API_URL = "https://your-backend-url.onrender.com/api";

const appState = {
    user: null,
    token: null,
    companies: [],
    expenses: [],
    transactions: [],
    loadPromise: null,
    loaded: false,
};

function getApiBaseUrl() {
    // 1. Check if a URL is manually set in localStorage (useful for debugging)
    const configuredBase = window.KHATA_API_BASE || localStorage.getItem(KHATA_API_BASE_KEY);
    if (configuredBase) {
        return configuredBase.replace(/\/+$/, "");
    }

    // 2. Automatic Environment Detection
    const host = (window.location.hostname || "").toLowerCase();
    const isLocal = host === "localhost" || host === "127.0.0.1" || host.includes("192.168.");

    if (isLocal) {
        // Use local backend when developing locally
        return "http://localhost:5000/api";
    }

    // 3. Fallback to Production URL
    return PRODUCTION_API_URL;
}

function getAppHomePath() {
    return window.location.pathname.includes("/Pages/") ? "../index.html" : "./index.html";
}

function setLoggedOutRedirectFlag() {
    localStorage.setItem(KHATA_SKIP_AUTO_LOGIN_KEY, "true");
}

function clearLoggedOutRedirectFlag() {
    localStorage.removeItem(KHATA_SKIP_AUTO_LOGIN_KEY);
}

function cloneArray(items) {
    if (!Array.isArray(items)) {
        // Return an empty array if the input is not a valid array
        return [];
    }
    return items.map((item) => ({ ...item }));
}

function getStoredToken() {
    return localStorage.getItem(KHATA_TOKEN_KEY) || "";
}

function getStoredUser() {
    const raw = localStorage.getItem(KHATA_USER_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function setSession(token, user) {
    appState.token = token;
    appState.user = user;
    localStorage.setItem(KHATA_TOKEN_KEY, token);
    localStorage.setItem(KHATA_USER_KEY, JSON.stringify(user));
}

function resetAppState() {
    appState.companies = [];
    appState.expenses = [];
    appState.transactions = [];
    appState.loaded = false;
    appState.loadPromise = null;
}

function clearSession() {
    appState.user = null;
    appState.token = null;
    resetAppState();
    localStorage.removeItem(KHATA_TOKEN_KEY);
    localStorage.removeItem(KHATA_USER_KEY);
}

appState.token = getStoredToken();
appState.user = getStoredUser();

async function apiRequest(path, options = {}) {
    // If Demo Mode is enabled, use the mock service instead of a real API call
    if (DEMO_MODE) {
        if (typeof mockApiRequest !== "function") {
            throw new Error("Demo mode is enabled but the mock API service is not loaded.");
        }
        return mockApiRequest(path, options);
    }

    const headers = new Headers(options.headers || {});
    const token = appState.token || getStoredToken();
    const apiBaseUrl = getApiBaseUrl();
    const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : KHATA_API_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    let response;

    try {
        response = await fetch(`${apiBaseUrl}${path}`, {
            method: options.method || "GET",
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
            signal: controller.signal,
        });
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("Request timed out. Please check that the API server is running and try again.");
        }

        throw new Error(`Unable to reach the API at ${apiBaseUrl}. Please verify the backend server is running.`);
    } finally {
        window.clearTimeout(timeoutId);
    }

    let payload = null;
    const isJson = response.headers.get("content-type")?.includes("application/json");
    if (isJson) {
        payload = await response.json();
    }

    if (!response.ok) {
        const message = payload && payload.message ? payload.message : "Request failed.";
        const error = new Error(message);
        error.status = response.status;

        if (response.status === 401) {
            clearSession();
        }

        throw error;
    }

    return payload;
}

function getCurrentUser() {
    return appState.user || getStoredUser();
}

function getAuthToken() {
    return appState.token || getStoredToken();
}

function isAuthenticated() {
    return Boolean(getCurrentUser() && getAuthToken());
}

function requireCurrentUser() {
    const user = getCurrentUser();
    if (!user || !getAuthToken()) {
        window.location.href = getAppHomePath();
        return null;
    }

    return user;
}

function getCurrentUserEmail() {
    const user = getCurrentUser();
    return user ? user.email : null;
}

function getMigrationMarkerKey(user) {
    return `khata_migration_done_${String(user.email || "").toLowerCase()}`;
}

function readJsonArray(value) {
    if (!value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function getStores() {
    return cloneArray(appState.companies);
}

function getExpenses() {
    return cloneArray(appState.expenses);
}

function getTransactions() {
    return cloneArray(appState.transactions);
}

function getReports() {
    return [];
}

function saveReports() {
    return [];
}

async function refreshCompanies() {
    appState.companies = await apiRequest("/companies");
    return getStores();
}

async function refreshExpenses() {
    appState.expenses = await apiRequest("/expenses");
    return getExpenses();
}

async function refreshTransactions() {
    appState.transactions = await apiRequest("/transactions");
    return getTransactions();
}

async function ensureAppDataLoaded(force = false) {
    requireCurrentUser();

    if (appState.loaded && !force) {
        return {
            companies: getStores(),
            expenses: getExpenses(),
            transactions: getTransactions(),
        };
    }

    if (appState.loadPromise && !force) {
        return appState.loadPromise;
    }

    appState.loadPromise = Promise.all([
        refreshCompanies(),
        refreshExpenses(),
        refreshTransactions(),
    ]).then(() => {
        appState.loaded = true;
        appState.loadPromise = null;
        return {
            companies: getStores(),
            expenses: getExpenses(),
            transactions: getTransactions(),
        };
    }).catch((error) => {
        appState.loaded = false;
        appState.loadPromise = null;
        throw error;
    });

    return appState.loadPromise;
}

async function createCompanyRecord(payload) {
    const company = await apiRequest("/companies", {
        method: "POST",
        body: payload,
    });

    appState.companies = [company, ...appState.companies.filter((item) => item.id !== company.id)];
    return { ...company };
}

async function updateCompanyRecord(companyId, payload) {
    const company = await apiRequest(`/companies/${companyId}`, {
        method: "PATCH",
        body: payload,
    });

    appState.companies = appState.companies.map((item) => item.id === company.id ? company : item);
    return { ...company };
}

async function deleteCompanyRecord(companyId) {
    await apiRequest(`/companies/${companyId}`, {
        method: "DELETE",
    });

    appState.companies = appState.companies.filter((item) => item.id !== companyId);
    appState.transactions = appState.transactions.filter((item) => item.companyId !== companyId);
    appState.expenses = appState.expenses.filter((item) => item.companyId !== companyId);
}

async function createExpenseRecord(payload) {
    const expense = await apiRequest("/expenses", {
        method: "POST",
        body: payload,
    });

    appState.expenses = [expense, ...appState.expenses.filter((item) => item.id !== expense.id)];
    return { ...expense };
}

async function deleteExpenseRecord(expenseId) {
    await apiRequest(`/expenses/${expenseId}`, {
        method: "DELETE",
    });

    appState.expenses = appState.expenses.filter((item) => item.id !== expenseId);
}

async function createTransactionRecord(payload) {
    const transaction = await apiRequest("/transactions", {
        method: "POST",
        body: payload,
    });

    appState.transactions = [transaction, ...appState.transactions.filter((item) => item.id !== transaction.id)];
    return { ...transaction };
}

async function deleteTransactionRecord(transactionId) {
    await apiRequest(`/transactions/${transactionId}`, {
        method: "DELETE",
    });

    appState.transactions = appState.transactions.filter((item) => item.id !== transactionId);
}

async function resetUserDataRemote() {
    await apiRequest("/data/reset", {
        method: "DELETE",
    });
    resetAppState();
}

async function deleteCurrentUserRemote() {
    await apiRequest("/auth/me", {
        method: "DELETE",
    });
    const user = getCurrentUser();
    if (user) {
        localStorage.removeItem(getMigrationMarkerKey(user));
    }
    setLoggedOutRedirectFlag();
    clearSession();
}

window.ensureAppDataLoaded = ensureAppDataLoaded;
window.getAppHomePath = getAppHomePath;
window.setLoggedOutRedirectFlag = setLoggedOutRedirectFlag;
window.clearLoggedOutRedirectFlag = clearLoggedOutRedirectFlag;
