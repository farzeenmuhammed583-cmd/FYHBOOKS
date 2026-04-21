const KHATA_ONBOARDING_KEY = "khata_onboarding_complete";
const KHATA_BUSINESS_NAME_KEY = "khata_business_name";
const KHATA_CURRENCY_KEY = "khata_currency";
const KHATA_BUSINESS_TYPE_KEY = "khata_business_type";

const CURRENCIES = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
    { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
];

const BUSINESS_TYPES = ["Retail", "Service", "Manufacturing", "Other"];

function isOnboardingComplete() {
    return localStorage.getItem(KHATA_ONBOARDING_KEY) === "true";
}

function markOnboardingComplete() {
    localStorage.setItem(KHATA_ONBOARDING_KEY, "true");
}

function resetOnboarding() {
    localStorage.removeItem(KHATA_ONBOARDING_KEY);
    localStorage.removeItem(KHATA_BUSINESS_NAME_KEY);
    localStorage.removeItem(KHATA_CURRENCY_KEY);
    localStorage.removeItem(KHATA_BUSINESS_TYPE_KEY);
}

function saveBusinessSettings(settings) {
    if (settings.businessName) {
        localStorage.setItem(KHATA_BUSINESS_NAME_KEY, settings.businessName);
    }
    if (settings.currency) {
        localStorage.setItem(KHATA_CURRENCY_KEY, settings.currency);
    }
    if (settings.businessType) {
        localStorage.setItem(KHATA_BUSINESS_TYPE_KEY, settings.businessType);
    }
}

function getBusinessSettings() {
    return {
        businessName: localStorage.getItem(KHATA_BUSINESS_NAME_KEY) || "",
        currency: localStorage.getItem(KHATA_CURRENCY_KEY) || "INR",
        businessType: localStorage.getItem(KHATA_BUSINESS_TYPE_KEY) || "",
    };
}

function createOnboardingModal() {
    const overlay = document.createElement("div");
    overlay.id = "onboarding-overlay";
    overlay.innerHTML = `
        <div class="onboarding-card">
            <div class="onboarding-progress">
                <div class="onboarding-dots"></div>
            </div>
            <div class="onboarding-content"></div>
            <div class="onboarding-footer">
                <button type="button" class="onboarding-back" hidden>Back</button>
                <button type="button" class="onboarding-next">Get Started</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function renderStep(modal, stepIndex) {
    const content = modal.querySelector(".onboarding-content");
    const dotsContainer = modal.querySelector(".onboarding-dots");
    const backBtn = modal.querySelector(".onboarding-back");
    const nextBtn = modal.querySelector(".onboarding-next");

    const totalSteps = 4;
    dotsContainer.innerHTML = Array.from({ length: totalSteps }, (_, i) =>
        `<div class="onboarding-dot ${i <= stepIndex ? "active" : ""} ${i < stepIndex ? "completed" : ""}"></div>`
    ).join("");

    backBtn.hidden = stepIndex === 0;

    switch (stepIndex) {
        case 0:
            content.innerHTML = `
                <div class="onboarding-icon">📒</div>
                <h1>Welcome to FIXYOURHUB BOOKS</h1>
                <p>Your simple business accounting tool. Track companies, manage transactions, and monitor expenses with ease.</p>
            `;
            nextBtn.textContent = "Get Started";
            break;

        case 1:
            content.innerHTML = `
                <div class="onboarding-icon">🏢</div>
                <h1>Business Setup</h1>
                <p>Tell us about your business to get started.</p>
                <div class="onboarding-form">
                    <div class="onboarding-field">
                        <label for="businessName">Business Name *</label>
                        <input type="text" id="businessName" placeholder="Enter your business name" required>
                    </div>
                    <div class="onboarding-field">
                        <label for="currency">Currency</label>
                        <select id="currency">
                            ${CURRENCIES.map(c => `<option value="${c.code}" ${c.code === "INR" ? "selected" : ""}>${c.symbol} ${c.code} - ${c.name}</option>`).join("")}
                        </select>
                    </div>
                    <div class="onboarding-field">
                        <label for="businessType">Business Type</label>
                        <select id="businessType">
                            <option value="">Select type (optional)</option>
                            ${BUSINESS_TYPES.map(t => `<option value="${t}">${t}</option>`).join("")}
                        </select>
                    </div>
                </div>
            `;
            nextBtn.textContent = "Next";
            break;

        case 2:
            content.innerHTML = `
                <div class="onboarding-icon">🏗️</div>
                <h1>Create Your First Company</h1>
                <p>Add a company to start tracking transactions.</p>
                <div class="onboarding-form">
                    <div class="onboarding-field">
                        <label for="companyName">Company Name *</label>
                        <input type="text" id="companyName" placeholder="Enter company name">
                    </div>
                    <div class="onboarding-field">
                        <label for="companyLocation">Location</label>
                        <input type="text" id="companyLocation" placeholder="Enter location (optional)">
                    </div>
                </div>
                <button type="button" class="onboarding-skip">I'll add companies later</button>
            `;
            nextBtn.textContent = "Next";
            const skipBtn = content.querySelector(".onboarding-skip");
            skipBtn.addEventListener("click", () => handleStepCompletion(modal, stepIndex, true));
            break;

        case 3:
            content.innerHTML = `
                <div class="onboarding-icon">✨</div>
                <h1>All Set!</h1>
                <p>You're ready to start managing your business accounts. Let's go!</p>
            `;
            nextBtn.textContent = "Start Using FYHBOOKS";
            break;
    }

    if (stepIndex === 1) {
        const businessSettings = getBusinessSettings();
        const nameInput = content.querySelector("#businessName");
        const currencySelect = content.querySelector("#currency");
        const typeSelect = content.querySelector("#businessType");

        if (businessSettings.businessName) nameInput.value = businessSettings.businessName;
        if (businessSettings.currency) currencySelect.value = businessSettings.currency;
        if (businessSettings.businessType) typeSelect.value = businessSettings.businessType;
    }
}

function handleStepCompletion(modal, stepIndex, skipped = false) {
    const nextBtn = modal.querySelector(".onboarding-next");

    if (stepIndex === 1) {
        const businessName = modal.querySelector("#businessName").value.trim();
        const currency = modal.querySelector("#currency").value;
        const businessType = modal.querySelector("#businessType").value;

        if (!businessName) {
            modal.querySelector("#businessName").focus();
            return;
        }

        saveBusinessSettings({ businessName, currency, businessType });
    }

    if (stepIndex === 2 && !skipped) {
        const companyName = modal.querySelector("#companyName").value.trim();
        const companyLocation = modal.querySelector("#companyLocation").value.trim();

        if (companyName) {
            createFirstCompany(companyName, companyLocation);
        }
    }

    if (stepIndex === 3) {
        completeOnboarding(modal);
        return;
    }

    nextBtn.style.pointerEvents = "none";
    nextBtn.style.opacity = "0.5";

    setTimeout(() => {
        modal.dataset.step = stepIndex + 1;
        renderStep(modal, stepIndex + 1);
        nextBtn.style.pointerEvents = "";
        nextBtn.style.opacity = "";
    }, 200);
}

async function createFirstCompany(name, location) {
    const company = {
        name: name,
        location: location || "",
        balance: 0,
        phone: "",
        email: "",
        status: "offline",
    };

    if (typeof createCompanyRecord === "function") {
        try {
            await createCompanyRecord(company);
        } catch (error) {
            console.warn("Could not create company via API:", error);
        }
    }

    if (typeof mockCreateCompany === "function") {
        mockCreateCompany(company);
    }
}

function completeOnboarding(modal) {
    markOnboardingComplete();

    modal.classList.add("onboarding-exit");

    setTimeout(() => {
        modal.remove();
        window.location.href = window.location.pathname.includes("/Pages/")
            ? "dashboard.html"
            : "Pages/dashboard.html";
    }, 400);
}

function initOnboarding() {
    if (isOnboardingComplete()) {
        return;
    }

    const modal = createOnboardingModal();
    modal.dataset.step = "0";
    renderStep(modal, 0);

    const backBtn = modal.querySelector(".onboarding-back");
    const nextBtn = modal.querySelector(".onboarding-next");

    backBtn.addEventListener("click", () => {
        const currentStep = parseInt(modal.dataset.step);
        if (currentStep > 0) {
            modal.dataset.step = currentStep - 1;
            renderStep(modal, currentStep - 1);
        }
    });

    nextBtn.addEventListener("click", () => {
        const currentStep = parseInt(modal.dataset.step);
        handleStepCompletion(modal, currentStep);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT") {
            const currentStep = parseInt(modal.dataset.step);
            handleStepCompletion(modal, currentStep);
        }
    });
}

const onboardingStyles = document.createElement("style");
onboardingStyles.textContent = `
    #onboarding-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: radial-gradient(circle at top, rgba(31, 41, 55, 0.95) 0%, rgba(15, 23, 42, 0.98) 55%, rgba(2, 6, 23, 0.99) 100%);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: onboardingFadeIn 0.4s ease;
    }

    @keyframes onboardingFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    #onboarding-overlay.onboarding-exit {
        animation: onboardingFadeOut 0.4s ease forwards;
    }

    @keyframes onboardingFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    .onboarding-card {
        width: min(92vw, 480px);
        background: rgba(15, 23, 42, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 24px;
        padding: 36px;
        box-shadow: 0 24px 70px rgba(2, 6, 23, 0.6);
        animation: onboardingSlideUp 0.4s ease;
    }

    @keyframes onboardingSlideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    .onboarding-progress {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 32px;
    }

    .onboarding-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(148, 163, 184, 0.25);
        transition: all 0.3s ease;
    }

    .onboarding-dot.active {
        background: #3b82f6;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
        transform: scale(1.15);
    }

    .onboarding-dot.completed {
        background: #22c55e;
    }

    .onboarding-content {
        text-align: center;
        min-height: 280px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .onboarding-icon {
        font-size: 56px;
        margin-bottom: 20px;
        animation: onboardingBounce 0.6s ease;
    }

    @keyframes onboardingBounce {
        0% { transform: scale(0.5); opacity: 0; }
        60% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
    }

    .onboarding-content h1 {
        margin: 0 0 12px;
        font-size: 1.75rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        background: linear-gradient(135deg, #e2e8f0, #94a3b8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .onboarding-content p {
        margin: 0;
        color: #94a3b8;
        font-size: 1rem;
        line-height: 1.6;
        max-width: 360px;
    }

    .onboarding-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 24px;
        text-align: left;
    }

    .onboarding-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .onboarding-field label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #94a3b8;
    }

    .onboarding-field input,
    .onboarding-field select {
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(15, 23, 42, 0.8);
        color: #e2e8f0;
        font-size: 1rem;
        font-family: inherit;
        outline: none;
        transition: all 0.25s ease;
    }

    .onboarding-field input:focus,
    .onboarding-field select:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .onboarding-field input::placeholder {
        color: #64748b;
    }

    .onboarding-skip {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 0.9rem;
        font-family: inherit;
        cursor: pointer;
        margin-top: 16px;
        padding: 8px;
        transition: color 0.2s ease;
    }

    .onboarding-skip:hover {
        color: #94a3b8;
    }

    .onboarding-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 32px;
        gap: 16px;
    }

    .onboarding-back {
        background: transparent;
        border: 1px solid rgba(148, 163, 184, 0.25);
        color: #94a3b8;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: 600;
        font-family: inherit;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow: none;
    }

    .onboarding-back:hover {
        border-color: rgba(148, 163, 184, 0.4);
        color: #e2e8f0;
        background: rgba(148, 163, 184, 0.08);
    }

    .onboarding-next {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border: none;
        color: #fff;
        padding: 14px 28px;
        border-radius: 12px;
        font-weight: 700;
        font-family: inherit;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35);
        margin-left: auto;
    }

    .onboarding-next:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(59, 130, 246, 0.45);
    }

    @media (max-width: 520px) {
        .onboarding-card {
            padding: 28px 24px;
        }

        .onboarding-content h1 {
            font-size: 1.5rem;
        }

        .onboarding-icon {
            font-size: 48px;
        }

        .onboarding-footer {
            flex-direction: column-reverse;
        }

        .onboarding-back,
        .onboarding-next {
            width: 100%;
            text-align: center;
        }
    }
`;
document.head.appendChild(onboardingStyles);

window.KHATA_ONBOARDING_KEY = KHATA_ONBOARDING_KEY;
window.resetOnboarding = resetOnboarding;
window.initOnboarding = initOnboarding;
window.isOnboardingComplete = isOnboardingComplete;
