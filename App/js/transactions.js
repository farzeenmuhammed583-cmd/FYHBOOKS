// --- Transaction Management ---

function getTransactionCompanyName(transaction) {
    if (transaction.companyName) {
        return transaction.companyName;
    }

    const company = getStores().find((store) => store.id === transaction.companyId);
    return company ? company.name : "N/A";
}

function closeTransactionModal() {
    const overlay = document.getElementById("transactionModalOverlay");
    if (overlay) {
        overlay.remove();
    }
    document.removeEventListener("keydown", transactionModalEscapeHandler);
    document.body.style.overflow = "";
}

let transactionModalEscapeHandler = null;

function showAddTransactionModal() {
    closeTransactionModal();

    const stores = getStores();
    if (stores.length === 0) {
        showError("Error: No stores found. Please create a store first.");
        return;
    }

    const overlay = document.createElement("div");
    overlay.id = "transactionModalOverlay";
    overlay.className = "transaction-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "transaction-modal";

    const storeOptions = stores.map((store) => 
        `<option value="${escapeHtml(store.id)}">${escapeHtml(store.name)}</option>`
    ).join("");

    const todayDate = new Date().toISOString().split("T")[0];

    modal.innerHTML = `
        <div class="transaction-modal-header">
            <div>
                <h3>Add Transaction</h3>
                <p>Record a new credit or debit transaction.</p>
            </div>
            <button type="button" class="transaction-modal-close" aria-label="Close form">Close</button>
        </div>
        <form id="transactionForm" class="transaction-form">
            <div class="transaction-form-grid">
                <label class="transaction-field transaction-field-full">
                    <span>Customer Name</span>
                    <input id="transactionCustomer" type="text" placeholder="Enter customer name" autocomplete="off" />
                </label>
                <label class="transaction-field transaction-field-full">
                    <span>Amount</span>
                    <div class="amount-field">
                        <span class="amount-symbol">&#8377;</span>
                        <input id="transactionAmount" type="number" min="0.01" step="0.01" placeholder="Enter amount" />
                    </div>
                </label>
                <label class="transaction-field transaction-field-full">
                    <span>Transaction Type</span>
                    <div class="transaction-type-buttons">
                        <button type="button" class="type-btn type-credit selected" data-type="credit">Credit</button>
                        <button type="button" class="type-btn type-debit" data-type="debit">Debit</button>
                    </div>
                    <input id="transactionType" type="hidden" value="credit" />
                </label>
                <label class="transaction-field transaction-field-full">
                    <span>Store / Company</span>
                    <select id="transactionStore">
                        ${storeOptions}
                    </select>
                </label>
                <label class="transaction-field transaction-field-full">
                    <span>Date</span>
                    <input id="transactionDate" type="date" value="${todayDate}" />
                </label>
            </div>
            <div class="transaction-form-actions">
                <button type="submit" class="btn-primary">Save Transaction</button>
                <button type="button" id="transactionCancelBtn" class="secondary">Cancel</button>
            </div>
        </form>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const customerInput = modal.querySelector("#transactionCustomer");
    const amountInput = modal.querySelector("#transactionAmount");
    const typeInput = modal.querySelector("#transactionType");
    const storeSelect = modal.querySelector("#transactionStore");
    const dateInput = modal.querySelector("#transactionDate");
    const form = modal.querySelector("#transactionForm");
    const closeButton = modal.querySelector(".transaction-modal-close");
    const cancelButton = modal.querySelector("#transactionCancelBtn");
    const typeCreditBtn = modal.querySelector(".type-credit");
    const typeDebitBtn = modal.querySelector(".type-debit");

    transactionModalEscapeHandler = (event) => {
        if (event.key === "Escape") {
            closeTransactionModal();
        }
    };

    const updateTypeButtons = (selectedType) => {
        typeCreditBtn.classList.toggle("selected", selectedType === "credit");
        typeDebitBtn.classList.toggle("selected", selectedType === "debit");
        typeInput.value = selectedType;
    };

    typeCreditBtn.addEventListener("click", () => updateTypeButtons("credit"));
    typeDebitBtn.addEventListener("click", () => updateTypeButtons("debit"));

    closeButton.addEventListener("click", closeTransactionModal);
    cancelButton.addEventListener("click", closeTransactionModal);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeTransactionModal();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const customer = customerInput.value.trim();
        const amount = Number(amountInput.value);
        const type = typeInput.value;
        const companyId = storeSelect.value;
        const date = dateInput.value;

        if (!customer) {
            showWarning("Customer name is required.");
            customerInput.focus();
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            showWarning("Please enter a valid, positive amount.");
            amountInput.focus();
            return;
        }

        if (!date) {
            showWarning("Please select a valid date.");
            dateInput.focus();
            return;
        }

        if (!companyId) {
            showWarning("Please select a store.");
            storeSelect.focus();
            return;
        }

        try {
            await createTransactionRecord({
                customer,
                amount,
                type,
                companyId,
                date: new Date(`${date}T00:00:00`).toISOString(),
                createdAt: new Date().toISOString(),
            });

            closeTransactionModal();
            renderTransactions();
            if (typeof updateDashboardStats === "function") {
                updateDashboardStats();
            }
            showSuccess("Transaction created successfully!");
        } catch (error) {
            showError(error.message || "Unable to create transaction.");
        }
    });

    document.addEventListener("keydown", transactionModalEscapeHandler);
    document.body.style.overflow = "hidden";
    customerInput.focus();
}

async function addTransaction() {
    await ensureAppDataLoaded();
    showAddTransactionModal();
}

function renderTransactions() {
    const table = document.getElementById("transactionTable");
    if (!table) return;

    const tableBody = table.tBodies[0] || table.createTBody();

    const transactions = getTransactions().slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    tableBody.innerHTML = "";

    if (transactions.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = "No transactions recorded yet.";
        cell.style.textAlign = "center";
        return;
    }

    transactions.forEach((transaction) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${new Date(transaction.date).toLocaleString()}</td>
            <td>${escapeHtml(transaction.customer)}</td>
            <td>${formatCurrency(transaction.amount)}</td>
            <td>
                <span class="status status-${transaction.type === "credit" ? "credit" : "debit"}">${transaction.type}</span>
            </td>
            <td>${escapeHtml(getTransactionCompanyName(transaction))}</td>
        `;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const table = document.getElementById("transactionTable");
    if (!table) {
        return;
    }

    ensureAppDataLoaded()
        .then(renderTransactions)
        .catch((error) => {
            showError(error.message || "Unable to load transactions.");
        });
});
