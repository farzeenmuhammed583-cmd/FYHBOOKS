// --- Expense Management ---

const EXPENSE_DEFAULT_CATEGORIES = ["Salary", "Rent", "Travel", "Utilities", "Misc"];
let expenseModalCleanup = null;

function createExpenseId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `exp_${crypto.randomUUID()}`;
    }

    return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getTodayDateInputValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getLocalDateKey(dateInput) {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return getTodayDateInputValue(date);
}

function formatExpenseCurrency(amount) {
    if (typeof formatCurrency === "function") {
        return formatCurrency(Number(amount || 0));
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount || 0));
}

function formatExpenseDate(dateInput) {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function normalizeExpense(expense) {
    const normalizedDate = expense.date || expense.createdAt || "";
    const companyId = expense.companyId || expense.storeId || "";
    const companyName = expense.company || expense.companyName || expense.storeName || "";

    return {
        id: expense.id || createExpenseId(),
        title: String(expense.title || "").trim(),
        amount: Number(expense.amount || 0),
        category: String(expense.category || "").trim(),
        companyId,
        company: String(companyName || "").trim(),
        date: normalizedDate,
        notes: String(expense.notes || "").trim(),
        createdAt: expense.createdAt || expense.date || ""
    };
}

function getNormalizedExpenses() {
    return getExpenses().map(normalizeExpense);
}

function getExpenseCompanyLabel(expense) {
    if (expense.company) {
        return expense.company;
    }

    if (expense.companyId && typeof getStores === "function") {
        const company = getStores().find((store) => store.id === expense.companyId);
        if (company) {
            return company.name;
        }
    }

    return "";
}

function getExpenseFilterValues() {
    const searchInput = document.getElementById("expenseSearchInput");
    const categoryFilter = document.getElementById("expenseCategoryFilter");
    const startDateFilter = document.getElementById("expenseStartDateFilter");
    const endDateFilter = document.getElementById("expenseEndDateFilter");

    const startDate = startDateFilter && startDateFilter.value ? startDateFilter.value : "";
    const endDate = endDateFilter && endDateFilter.value ? endDateFilter.value : "";

    return {
        search: searchInput ? searchInput.value.trim().toLowerCase() : "",
        category: categoryFilter ? categoryFilter.value : "",
        startDate,
        endDate
    };
}

function matchesExpenseFilters(expense, filters) {
    const searchTarget = [
        expense.title,
        expense.category,
        getExpenseCompanyLabel(expense)
    ].join(" ").toLowerCase();

    if (filters.search && !searchTarget.includes(filters.search)) {
        return false;
    }

    if (filters.category && expense.category !== filters.category) {
        return false;
    }

    const expenseDateKey = getLocalDateKey(expense.date || expense.createdAt);
    const startDate = filters.startDate;
    const endDate = filters.endDate;
    const normalizedStart = startDate && endDate && startDate > endDate ? endDate : startDate;
    const normalizedEnd = startDate && endDate && startDate > endDate ? startDate : endDate;

    if (normalizedStart && expenseDateKey < normalizedStart) {
        return false;
    }

    if (normalizedEnd && expenseDateKey > normalizedEnd) {
        return false;
    }

    return true;
}

function getFilteredExpenses(expenses) {
    const filters = getExpenseFilterValues();
    return expenses.filter((expense) => matchesExpenseFilters(expense, filters)).sort((a, b) => {
        return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
    });
}

function populateExpenseCategoryFilter(expenses) {
    const select = document.getElementById("expenseCategoryFilter");
    if (!select) {
        return;
    }

    const currentValue = select.value;
    const categories = new Set(EXPENSE_DEFAULT_CATEGORIES);

    expenses.forEach((expense) => {
        if (expense.category) {
            categories.add(expense.category);
        }
    });

    const sortedCategories = [
        ...EXPENSE_DEFAULT_CATEGORIES.filter((category) => categories.has(category)),
        ...Array.from(categories)
            .filter((category) => !EXPENSE_DEFAULT_CATEGORIES.includes(category))
            .sort((a, b) => a.localeCompare(b))
    ];

    select.innerHTML = `<option value="">All Categories</option>`;

    sortedCategories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });

    if (sortedCategories.includes(currentValue)) {
        select.value = currentValue;
    }
}

function renderExpenseSummary(expenses) {
    const monthlyTotalEl = document.getElementById("expenseMonthlyTotal");
    const transactionCountEl = document.getElementById("expenseTransactionCount");
    const breakdownEl = document.getElementById("expenseCategoryBreakdown");

    if (!monthlyTotalEl || !transactionCountEl || !breakdownEl) {
        return;
    }

    const now = new Date();
    const monthlyExpenses = expenses.filter((expense) => {
        const date = new Date(expense.date || expense.createdAt);
        return !Number.isNaN(date.getTime()) &&
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth();
    });

    const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    monthlyTotalEl.textContent = formatExpenseCurrency(monthlyTotal);
    transactionCountEl.textContent = String(monthlyExpenses.length);

    const breakdown = new Map();
    monthlyExpenses.forEach((expense) => {
        const category = expense.category || "Uncategorized";
        breakdown.set(category, (breakdown.get(category) || 0) + Number(expense.amount || 0));
    });

    const sortedBreakdown = Array.from(breakdown.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

    breakdownEl.innerHTML = "";

    if (sortedBreakdown.length === 0) {
        const empty = document.createElement("span");
        empty.className = "expense-breakdown-empty";
        empty.textContent = "No monthly expense data yet.";
        breakdownEl.appendChild(empty);
        return;
    }

    sortedBreakdown.forEach(([category, total]) => {
        const chip = document.createElement("span");
        chip.className = "expense-breakdown-chip";
        chip.textContent = `${category} ${formatExpenseCurrency(total)}`;
        breakdownEl.appendChild(chip);
    });
}

function populateExpenseCompanyOptions(select) {
    if (!select) {
        return;
    }

    const stores = typeof getStores === "function" ? getStores() : [];
    select.innerHTML = "";

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = stores.length === 0 ? "No company selected" : "No company selected";
    select.appendChild(emptyOption);

    stores.forEach((store) => {
        const option = document.createElement("option");
        option.value = store.id;
        option.textContent = store.name || "Unnamed Company";
        select.appendChild(option);
    });
}

function closeExpenseModal() {
    const overlay = document.getElementById("expenseModalOverlay");
    if (overlay) {
        overlay.remove();
    }

    if (expenseModalCleanup) {
        expenseModalCleanup();
        expenseModalCleanup = null;
    }
}

function showExpenseModal() {
    closeExpenseModal();

    const overlay = document.createElement("div");
    overlay.id = "expenseModalOverlay";
    overlay.className = "expense-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "expense-modal";

    modal.innerHTML = `
        <div class="expense-modal-header">
            <div>
                <h3>Add Expense</h3>
                <p>Record a new company or operational expense.</p>
            </div>
            <button type="button" class="expense-modal-close" aria-label="Close expense form">Close</button>
        </div>
        <form id="expenseForm" class="expense-form">
            <div class="expense-form-grid">
                <label class="expense-field expense-field-full">
                    <span>Title</span>
                    <input id="expenseTitle" type="text" placeholder="e.g. Salary" autocomplete="off" />
                </label>
                <label class="expense-field">
                    <span>Amount</span>
                    <input id="expenseAmount" type="number" min="0.01" step="0.01" placeholder="0.00" />
                </label>
                <label class="expense-field">
                    <span>Category</span>
                    <select id="expenseCategorySelect">
                        <option value="">Select category</option>
                        ${EXPENSE_DEFAULT_CATEGORIES.map((category) => `<option value="${category}">${category}</option>`).join("")}
                        <option value="__other__">Other</option>
                    </select>
                </label>
                <label class="expense-field expense-field-hidden" id="expenseCustomCategoryWrapper">
                    <span>Custom Category</span>
                    <input id="expenseCustomCategory" type="text" placeholder="Enter custom category" />
                </label>
                <label class="expense-field">
                    <span>Company</span>
                    <select id="expenseCompanySelect">
                        <option value="">No company selected</option>
                    </select>
                </label>
                <label class="expense-field">
                    <span>Date</span>
                    <input id="expenseDate" type="date" />
                </label>
                <label class="expense-field expense-field-full">
                    <span>Notes</span>
                    <textarea id="expenseNotes" rows="3" placeholder="Optional notes"></textarea>
                </label>
            </div>
            <div class="expense-form-actions">
                <button type="submit" class="btn-primary">Save Expense</button>
                <button type="button" id="expenseCancelBtn" class="secondary">Cancel</button>
            </div>
        </form>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const titleInput = modal.querySelector("#expenseTitle");
    const amountInput = modal.querySelector("#expenseAmount");
    const categorySelect = modal.querySelector("#expenseCategorySelect");
    const customCategoryWrapper = modal.querySelector("#expenseCustomCategoryWrapper");
    const customCategoryInput = modal.querySelector("#expenseCustomCategory");
    const companySelect = modal.querySelector("#expenseCompanySelect");
    const dateInput = modal.querySelector("#expenseDate");
    const notesInput = modal.querySelector("#expenseNotes");
    const form = modal.querySelector("#expenseForm");
    const closeButton = modal.querySelector(".expense-modal-close");
    const cancelButton = modal.querySelector("#expenseCancelBtn");

    populateExpenseCompanyOptions(companySelect);
    dateInput.value = getTodayDateInputValue();

    const toggleCustomCategory = () => {
        const isCustom = categorySelect.value === "__other__";
        customCategoryWrapper.classList.toggle("expense-field-hidden", !isCustom);
        customCategoryInput.required = isCustom;
        if (!isCustom) {
            customCategoryInput.value = "";
        }
    };

    const handleEscape = (event) => {
        if (event.key === "Escape") {
            closeExpenseModal();
        }
    };

    categorySelect.addEventListener("change", toggleCustomCategory);
    closeButton.addEventListener("click", closeExpenseModal);
    cancelButton.addEventListener("click", closeExpenseModal);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeExpenseModal();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const title = titleInput.value.trim();
        const amount = Number(amountInput.value);
        const categoryValue = categorySelect.value;
        const customCategory = customCategoryInput.value.trim();
        const selectedDate = dateInput.value;
        const notes = notesInput.value.trim();
        const selectedCompany = companySelect.selectedOptions[0];

        if (!title) {
            showWarning("Title is required.");
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            showWarning("Please enter a valid, positive amount.");
            return;
        }

        const category = categoryValue === "__other__" ? customCategory : categoryValue;
        if (!category) {
            showWarning("Please select a category.");
            return;
        }

        if (!selectedDate) {
            showWarning("Please select a valid date.");
            return;
        }

        const newExpense = normalizeExpense({
            id: createExpenseId(),
            title,
            amount,
            category,
            companyId: companySelect.value || "",
            company: companySelect.value ? (selectedCompany ? selectedCompany.textContent.trim() : "") : "",
            date: new Date(`${selectedDate}T00:00:00`).toISOString(),
            notes,
            createdAt: new Date().toISOString()
        });

        try {
            await createExpenseRecord({
                title: newExpense.title,
                amount: newExpense.amount,
                category: newExpense.category,
                companyId: newExpense.companyId,
                date: newExpense.date,
                notes: newExpense.notes,
                createdAt: newExpense.createdAt
            });

            closeExpenseModal();
            renderExpenses();

            if (typeof updateDashboardStats === "function") {
                updateDashboardStats();
            }
        } catch (error) {
            showError(error.message || "Unable to save expense.");
        }
    });

    expenseModalCleanup = () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    toggleCustomCategory();

    window.setTimeout(() => {
        titleInput.focus();
    }, 0);
}

function addExpense() {
    showExpenseModal();
}

function renderExpenseRow(expense) {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = formatExpenseDate(expense.date || expense.createdAt);

    const titleCell = document.createElement("td");
    titleCell.className = "expense-title-cell";
    const titleText = document.createElement("div");
    titleText.className = "expense-title-text";
    titleText.textContent = expense.title || "-";
    titleCell.appendChild(titleText);

    if (expense.notes) {
        const notesText = document.createElement("div");
        notesText.className = "expense-note-text";
        notesText.textContent = expense.notes;
        titleCell.appendChild(notesText);
    }

    const categoryCell = document.createElement("td");
    categoryCell.textContent = expense.category || "-";

    const companyCell = document.createElement("td");
    companyCell.className = "expense-company-cell";
    companyCell.textContent = getExpenseCompanyLabel(expense) || "-";

    const amountCell = document.createElement("td");
    amountCell.className = "expense-amount-cell";
    amountCell.textContent = formatExpenseCurrency(expense.amount);

    row.appendChild(dateCell);
    row.appendChild(titleCell);
    row.appendChild(categoryCell);
    row.appendChild(companyCell);
    row.appendChild(amountCell);

    return row;
}

function renderExpenses() {
    const table = document.getElementById("expenseTable");
    const tableBody = table ? table.querySelector("tbody") : null;
    const tableShell = document.querySelector(".expense-table-shell");
    const emptyState = document.getElementById("expenseEmptyState");

    if (!tableBody || !emptyState || !tableShell) {
        return;
    }

    const expenses = getNormalizedExpenses();
    populateExpenseCategoryFilter(expenses);

    const filteredExpenses = getFilteredExpenses(expenses);
    const hasAnyExpenses = expenses.length > 0;

    renderExpenseSummary(expenses);

    tableBody.innerHTML = "";

    if (filteredExpenses.length === 0) {
        tableShell.hidden = true;
        emptyState.hidden = false;

        const heading = emptyState.querySelector("h3");
        const description = emptyState.querySelector("p");
        if (heading && description) {
            if (hasAnyExpenses) {
                heading.textContent = "No expenses match your filters.";
                description.textContent = "Try broadening the search, category, or date range.";
            } else {
                heading.textContent = "No expenses yet. Add your first expense.";
                description.textContent = "Use the button above to record salary, transport, rent, or any other expense.";
            }
        }

        return;
    }

    emptyState.hidden = true;
    tableShell.hidden = false;

    filteredExpenses.forEach((expense) => {
        tableBody.appendChild(renderExpenseRow(expense));
    });
}

async function initExpensePage() {
    const table = document.getElementById("expenseTable");
    const searchInput = document.getElementById("expenseSearchInput");
    const categoryFilter = document.getElementById("expenseCategoryFilter");
    const startDateFilter = document.getElementById("expenseStartDateFilter");
    const endDateFilter = document.getElementById("expenseEndDateFilter");
    const clearButton = document.getElementById("clearExpenseFilters");

    if (!table || !searchInput || !categoryFilter || !startDateFilter || !endDateFilter || !clearButton) {
        return;
    }

    await ensureAppDataLoaded();

    const rerender = () => renderExpenses();

    searchInput.addEventListener("input", rerender);
    categoryFilter.addEventListener("change", rerender);
    startDateFilter.addEventListener("change", rerender);
    endDateFilter.addEventListener("change", rerender);

    clearButton.addEventListener("click", () => {
        searchInput.value = "";
        categoryFilter.value = "";
        startDateFilter.value = "";
        endDateFilter.value = "";
        renderExpenses();
    });

    renderExpenses();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initExpensePage().catch((error) => {
            showError(error.message || "Unable to load expenses.");
        });
    });
} else {
    initExpensePage().catch((error) => {
        showError(error.message || "Unable to load expenses.");
    });
}
