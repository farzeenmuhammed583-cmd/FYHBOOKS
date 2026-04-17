function getAuthRedirectPath(pageName) {
    return window.location.pathname.includes("/Pages/") ? pageName : `Pages/${pageName}`;
}

const DEMO_MODE_KEY = "khata_demo_mode";

function isApiUnavailableError(error) {
    const message = String(error?.message || "");
    return message.includes("Unable to reach the API") || message.includes("Request timed out");
}

function isDemoModeActive() {
    // Use global demo flag when available, fallback to explicit localStorage key.
    return window.KHATA_DEMO_MODE === true || localStorage.getItem(DEMO_MODE_KEY) === "true";
}

function enableDemoModeSession() {
    localStorage.setItem(DEMO_MODE_KEY, "true");
    if (typeof clearLoggedOutRedirectFlag === "function") {
        clearLoggedOutRedirectFlag();
    }
    console.warn("DEMO MODE ACTIVE - NOT RECOMMENDED FOR PRODUCTION");
}

function clearDemoModeSession() {
    localStorage.removeItem("token");
    localStorage.removeItem(DEMO_MODE_KEY);
}

async function signupUser(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !password) {
        showWarning("Please fill all fields");
        return;
    }

    try {
        await apiRequest("/auth/register", {
            method: "POST",
            body: { name, email, password },
        });

        showSuccess("Account created successfully");
        setTimeout(() => {
            window.location.href = typeof getAppHomePath === "function"
                ? getAppHomePath()
                : "index.html";
        }, 600);
    } catch (error) {
        showError(error.message || "Unable to create account.");
    }
}

async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    const errorEl = document.getElementById("loginError");
    if (errorEl) {
        errorEl.innerText = "";
    }

    try {
        const response = await apiRequest("/auth/login", {
            method: "POST",
            body: { email, password },
        });

        if (typeof clearLoggedOutRedirectFlag === "function") {
            clearLoggedOutRedirectFlag();
        }

        setSession(response.token, response.user);
        await ensureAppDataLoaded(true);
        window.location.href = getAuthRedirectPath("dashboard.html");
    } catch (error) {
        if (errorEl) {
            errorEl.innerText = error.message || "An unknown error occurred.";
        }
    }
}

function logoutUser() {
    if (typeof setLoggedOutRedirectFlag === "function") {
        setLoggedOutRedirectFlag();
    }

    clearSession();
    clearDemoModeSession();
    window.location.href = typeof getAppHomePath === "function"
        ? getAppHomePath()
        : "index.html";
}

function initAuthPage() {
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", signupUser);
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", loginUser);
    }
}

window.logoutUser = logoutUser;

document.addEventListener("DOMContentLoaded", initAuthPage);
