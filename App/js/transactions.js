// --- Transaction Management ---

function addTransaction() {
    // 1. Get Core Transaction Details
    const customer = prompt("Enter customer's name:");
    if (!customer) return;

    const amount = parseFloat(prompt("Enter transaction amount:"));
    if (isNaN(amount) || amount <= 0) {
        alert("Invalid amount. Please enter a positive number.");
        return;
    }

    let type;
    while (true) {
        type = prompt("Enter transaction type (credit/debit):")?.trim().toLowerCase();
        if (type === "credit" || type === "debit") break;
        alert("Invalid type. Please enter 'credit' or 'debit'.");
    }

    // 2. Select a Store
    const stores = getStores();
    if (stores.length === 0) {
        alert("Error: No stores found. Please create a store first.");
        return;
    }

    let storeSelectionPrompt = "Select a store for this transaction:\n\n";
    stores.forEach((s, i) => {
        storeSelectionPrompt += `${i + 1}. ${s.name}\n`;
    });
    storeSelectionPrompt += "\nEnter the store number or name.";

    let selectedStore = null;
    while (!selectedStore) {
        const selection = prompt(storeSelectionPrompt);
        if (selection === null) return; // User cancelled

        const index = parseInt(selection, 10) - 1;
        if (!isNaN(index) && stores[index]) {
            selectedStore = stores[index];
        } else {
            selectedStore = stores.find(s => s.name.toLowerCase() === selection.trim().toLowerCase());
        }

        if (!selectedStore) {
            alert("Invalid selection. Please try again.");
        }
    }

    // 3. Create and Save the Transaction
    const newTransaction = {
        id: 'txn_' + Date.now(),
        customer,
        amount,
        type,
        storeId: selectedStore.id, // Link by ID
        storeName: selectedStore.name, // Denormalize for easy display
        date: new Date().toISOString()
    };

    const transactions = getTransactions();
    transactions.push(newTransaction);
    saveTransactions(transactions);

    // 4. Update UI
    renderTransactions();
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
}

// --- UI Rendering ---

function renderTransactions() {
    const tableBody = document.querySelector("#transactionTable tbody");
    if (!tableBody) return;

    const transactions = getTransactions();
    tableBody.innerHTML = ""; // Clear existing rows

    if (transactions.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = "No transactions recorded yet.";
        cell.style.textAlign = "center";
        return;
    }

    transactions.slice().reverse().forEach(t => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${new Date(t.date).toLocaleString()}</td>
            <td>${t.customer}</td>
            <td>₹${t.amount.toFixed(2)}</td>
            <td>
                <span class="status status-${t.type === 'credit' ? 'credit' : 'debit'}">${t.type}</span>
            </td>
            <td>${t.storeName || 'N/A'}</td>
        `;
    });
}

document.addEventListener("DOMContentLoaded", renderTransactions);