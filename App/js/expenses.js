// --- Expense Management ---

function addExpense() {
    // 1. Input and Validation
    const title = prompt("Enter expense title:");
    if (!title || title.trim() === "") {
        alert("Title is required.");
        return;
    }

    const category = prompt("Enter category (e.g., rent, salary, supplies):");
    if (!category || category.trim() === "") {
        alert("Category is required.");
        return;
    }

    const amount = parseFloat(prompt("Enter the amount:"));
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid, positive amount.");
        return;
    }

    // 2. Create and Save Expense
    const newExpense = {
        id: 'exp_' + Date.now(),
        title: title.trim(),
        category: category.trim(),
        amount,
        date: new Date().toISOString()
    };

    const expenses = getExpenses();
    expenses.push(newExpense);
    saveExpenses(expenses);

    // 3. Update UI
    renderExpenses();
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
}

// --- UI Rendering ---

function renderExpenses() {
    const tableBody = document.querySelector("#expenseTable tbody");
    if (!tableBody) return;

    const expenses = getExpenses();
    tableBody.innerHTML = ""; // Clear existing rows

    if (expenses.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 4;
        cell.textContent = "No expenses recorded yet.";
        cell.style.textAlign = "center";
        return;
    }

    expenses.slice().reverse().forEach(e => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${new Date(e.date).toLocaleString()}</td>
            <td>${e.title}</td>
            <td>${e.category}</td>
            <td>₹${e.amount.toFixed(2)}</td>
        `;
    });
}

document.addEventListener("DOMContentLoaded", renderExpenses);