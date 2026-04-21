function loadAccountInfo() {
    const user = getCurrentUser();
    if (!user) {
        return;
    }

    const name = document.getElementById("accountName");
    const email = document.getElementById("accountEmail");

    if (name) {
        name.innerText = `Name: ${user.name}`;
    }

    if (email) {
        email.innerText = `Email: ${user.email}`;
    }
}

async function resetUserData() {
    const user = getCurrentUser();
    if (!user) {
        return;
    }

    const confirmReset = confirm("Reset all your stores, transactions and expenses?");
    if (!confirmReset) {
        return;
    }

    try {
        await resetUserDataRemote();
        localStorage.removeItem(getMigrationMarkerKey(user));
        showSuccess("All data cleared");
    } catch (error) {
        showError(error.message || "Unable to clear data.");
    }
}

async function deleteAccount() {
    const user = getCurrentUser();
    if (!user) {
        return;
    }

    const confirmDelete = confirm("Delete your account permanently?");
    if (!confirmDelete) {
        return;
    }

    try {
        await deleteCurrentUserRemote();
        showSuccess("Account deleted");
        window.location.href = typeof getAppHomePath === "function"
            ? getAppHomePath()
            : "../index.html";
    } catch (error) {
        showError(error.message || "Unable to delete account.");
    }
}

function resetOnboardingWizard() {
    if (typeof resetOnboarding !== "function") {
        showError("Onboarding module not loaded.");
        return;
    }

    const confirmReset = confirm("Reset onboarding wizard? You will see the welcome screen on next visit.");
    if (!confirmReset) {
        return;
    }

    resetOnboarding();
    showInfo("Onboarding reset. Refresh the app to see the welcome screen.");
}

document.addEventListener("DOMContentLoaded", loadAccountInfo);
