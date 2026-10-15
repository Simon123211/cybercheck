/* CyberCheck - main script
Vulnerability data: NIST National Vulnerability Database API 2.0
https://nvd.nist.gov/developers/vulnerabilities */

// === 1. Elements and Settings ===
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.getElementById("site-nav");
const form = document.getElementById("check-form");
const staffSlider = document.getElementById("staff");
const staffValue = document.getElementById("staff-value");
const softwareBoxes = document.querySelectorAll('input[name="software"]');
const statusBox = document.getElementById("status");

const MAX_SOFTWARE = 3;
const HABIT_QUESTIONS = ["mfa", "backups", "updates", "training", "passwords"];


// === 2. Mobile Menu ===
// Reference: MDN – "Element.addEventListener()" (event-driven UI)
// Reference: MDN – "Managing ARIA states in JavaScript" (aria-expanded)
menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
});

// Close menu after a link is chosen
siteNav.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
        menuToggle.setAttribute("aria-expanded", "false");
    }
});

// Close menu with Esc (accessibility)
// Reference: MDN – "Keyboard accessibility" (Escape key handling)
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.focus();
    }
});

// === 3. Staff slider: live value ===
// Reference: MDN – "input event" (live form updates)
function updateStaffValue() {
    const staff = Number(staffSlider.value);
    staffValue.textContent = staff === 1 ? "1 member of staff" : staff + " staff";
}

staffSlider.addEventListener("input", updateStaffValue);
updateStaffValue();


// === Error Message Helpers ===
// Reference: MDN – "aria-invalid" (programmatic accessibility state)
function showError(fieldId, message) {
    document.getElementById(fieldId + "-error").textContent = message;
    const field = document.getElementById(fieldId);
    if (field) {
        field.setAttribute("aria-invalid", "true");
    }
}

function clearError(fieldId) {
    document.getElementById(fieldId + "-error").textContent = "";
    const field = document.getElementById(fieldId);
    if (field) {
        field.removeAttribute("aria-invalid");
    }
}


// === Software: Max of 3 ===
// Reference: MDN – "NodeList.forEach()" (modern DOM iteration)
// Reference: MDN – "querySelectorAll()" with attribute selectors
softwareBoxes.forEach((box) => {
    box.addEventListener("change", () => {
        const checkedCount = document.querySelectorAll('input[name="software"]:checked').length;

        if (checkedCount > MAX_SOFTWARE) {
            box.checked = false;
            showError("software", "You can choose up to " + MAX_SOFTWARE + " products. Untick one to choose another.");
        } else {
            clearError("software"); 
        }
    });
});


// === 6. Clear error once user fixes it ===
// Reference: MDN – "event.target" (event delegation)
form.addEventListener("input", (event) => {
    const target = event.target;

    if (target.name === "software" || target.id === "staff") {
        return;
    }

    const fieldId = target.type === "radio" ? target.name : target.id;
    if (document.getElementById(fieldId + "-error")) {
        clearError(fieldId);
    }
});


// === 7. Validate form ===
// Reference: MDN – "Constraint validation API" (validity.valid)
// Reference: MDN – "HTMLElement.focus()" (focus management)
function validateForm() {
    let firstProblem = null;

    function problem(fieldId, message, elementToFocus) {
        showError(fieldId, message);
        if (firstProblem === null) {
            firstProblem = elementToFocus;
        }
    }

    const nameInput = document.getElementById("business-name");
    if (nameInput.value.trim () === "") {
        problem("business-name", "Enter your business name.", nameInput);
    }

     const emailInput = document.getElementById("email");
    if (emailInput.value.trim () === "") {
        problem("email", "Enter your email address.", emailInput);
    } else if (!emailInput.validity.valid) {
        problem("email", "Enter an email address in the correct format", emailInput);
    }

     const sectorSelect = document.getElementById("sector");
    if (sectorSelect.value.trim () === "") {
        problem("sector", "Choose your business sector.", sectorSelect);
    }

    HABIT_QUESTIONS.forEach((question) => {
        const answered = form.querySelector('input[name="' + question + '"]:checked');
        if (!answered) {
            const firstOption = form.querySelector('input[name="' + question + '"]');
        problem(question, "Choose an answer.", firstOption);
        }
    });

    const softwareCount = document.querySelectorAll('input[name="software"]:checked').length;
    if (softwareCount === 0) {
        problem("software", "Choose at least one product to check.", softwareBoxes[0]);
    }

    const countInput = document.getElementById("results-count");
    const count = Number(countInput.value);

    // Reference: MDN – "Number.isInteger()" (ES6 numeric validation)
    if (!Number.isInteger(count) || count < 1 || count > 5) {
        problem("results-count", "Enter a whole number between 1 and 5.", countInput);
    }

    const consentBox = document.getElementById("consent");
    if (!consentBox.checked) {
        problem("consent", "Tick the box to confirm you understand.", consentBox);
    }

    if (firstProblem !== null) {
        firstProblem.focus();
        return false;
    }
    return true;
}


// === 8. Form submit ===
// Reference: MDN – "Event.preventDefault()" (custom form handling)
form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateForm()) {
        statusBox.textContent = "Please correct the errors highlighted in the form.";
        return;
    }

    statusBox.textContent = "";
    showResults(getAnswers());
});


// === 9. Scoring and Advice Data ===
// Adbice based on NCSC Small Business Guide 
const POINTS = { yes: 2, unsure: 1, no: 0 };

const ADVICE = {
    mfa: "Turn on 2-step verification for email and other important accounts. Even if a password is stolen, it stops most attackers getting in.",
    backups: "Back up important data regularly to a separate location, so you can recover from ransomware or hardware failure.",
    updates: "Switch on automatic updates for software, operating systems and devices. Updates fix the security weaknesses that attackers look for.",
    training: "Give staff basic security awareness training, especially on spotting phishing emails, The NCSC offers free online training for staff.",
    passwords: "Use a unique password for every account, ideally stored in a password manager, so one leaked password can't unlock everything."
};



// === 10. Collect answers from form ===
// Reference: MDN – "Document.querySelector()" with attribute selectors
// Reference: MDN – "NodeList.forEach()" (modern DOM iteration)
function getAnswers() {
    const sectorSelect = document.getElementById("sector");

    const habits = {};
    HABIT_QUESTIONS.forEach((question) => {
        habits[question] = form.querySelector('input[name="' + question + '"]:checked').value;
    });

    const software = [];
    document.querySelectorAll('input[name="software"]:checked').forEach((box) => {
        software.push(box.value);
    });

    return {
        businessName: document.getElementById("business-name").value.trim(),
        email: document.getElementById("email").value.trim(),
        sectorName: sectorSelect.options[sectorSelect.selectedIndex].text,
        staff: Number(staffSlider.value),
        habits: habits,
        software: software,
        severity: document.getElementById("severity").value,
        resultsCount: Number(document.getElementById("results-count").value)
    };
}

// === 11. Calculate score ===
// Reference: MDN – "Computed property access" (dynamic object lookup)
function calculateScore(habits) {
    let total = 0;
    HABIT_QUESTIONS.forEach((question) => {
        total += POINTS[habits[question]];
    });
    return total;
}

function getBand(score) {
    if (score >= 8) {
        return { key: "good", label: "Good" };
    } else if (score >= 5) {
        return { key: "improve", label: "Needs improvement"};
    }
    return { key: "risk", label: "High risk" };
}


// === 12. Display Results ===
const resultsSection = document.getElementById("results");
const resultsHeading = document.getElementById("results-heading");

// Container for everything under "Your results" heading
// Reference: MDN – "Document.createElement()" (programmatic DOM creation)
const resultsContent = document.createElement("div");
resultsSection.appendChild(resultsContent);

// Reference: MDN – "Element.append()" (modern DOM API)
function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (text) {
        element.textContent = text;
    }
    return element;
}

function showResults(answers) {
    resultsContent.innerHTML = "";

    const score = calculateScore(answers.habits);
    const band = getBand(score);

     // Reference: MDN – "Date.toLocaleDateString()" with options
    const today = new Date().toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric"
    });

    // --- Score summary card ---
     // Reference: MDN – "HTMLElement.dataset" (custom data attributes)
    const summary = makeElement("div", "results-summary");
    summary.dataset.band = band.key;

    summary.append(
        makeElement("p", "results-meta",
            "Prepared for " + answers.businessName + " (" + answers.email + ") on " + today +
            ". Sector: " + answers.sectorName + ". Staff: " + answers.staff + "."),
            makeElement("h3", "", "Your score"),
            makeElement("p", "score-value", score + "/10"),
            makeElement("span", "score-band", band.label)
    );
    resultsContent.appendChild(summary);

    // -- Advice for answers that weren't "yes" ---
    resultsContent.appendChild(makeElement("h3", "", "What to improve"));

       // Reference: MDN – "Array.filter()" (functional array processing)
    const toImprove = HABIT_QUESTIONS.filter((question) => answers.habits[question] !== "yes");

    if (toImprove.length === 0) {
        resultsContent.appendChild(
            makeElement("p", "", "Great work: you're following all five good-practice habits. Keep it up!")
        );
    } else {
        const adviceList = makeElement("ul", "advice-list");
        
        // Reference: MDN – "Array.forEach()" (iterating to build DOM)
        toImprove.forEach((question) => {
            adviceList.appendChild(makeElement("li", "", ADVICE[question]));
        });
        resultsContent.appendChild(adviceList);
    }

    // -- Vulnerability results (filled in by API, section 14) --
    const vulnArea = makeElement("div", "vuln-area");
    resultsContent.appendChild(vulnArea);

    // -- Start again button --
    const restartButton = makeElement("button", "button button-secondary", "Start again");
    restartButton.type = "button";
    
    // Reference: MDN – "Element.addEventListener()" (event-driven UI)
    restartButton.addEventListener("click", startAgain);
    resultsContent.appendChild(restartButton);

    // Reference: MDN – "HTMLElement.focus()" (accessibility focus management)
    resultsSection.hidden = false;
    resultsHeading.focus();

    // Start vulnerability search (runs while user reads score)
    showVulnerabilities(answers, vulnArea);
}


// === 13. Start Again ===
// Reference: MDN – "HTMLFormElement.reset()" (form reset API)
function startAgain() {
    form.reset();
    updateStaffValue();
    resultsSection.hidden = true;
    statusBox.textContent = "";
    document.getElementById("business-name").focus();
}


// === 14. NVD API: Fetch Recent Vulnerabilities ===
// API documentation: https://nvd.nist.gov/developers/vulnerabilities
const NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const DAYS_TO_SEARCH = 120;
const submitButton = form.querySelector('button[type="submit"]');

// Reference: MDN – "Date.toISOString()" (formatting for API parameters)
function toNvdDate(date) {
    return date.toISOString().slice(0, 23);
}

async function fetchVulnerabilities(product, severity, count) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - DAYS_TO_SEARCH);

    let url = NVD_URL +
    "?keywordSearch=" + encodeURIComponent(product) +
    "&resultsPerPage=" + count +
    "&pubStartDate=" + toNvdDate(startDate) +
    "&pubEndDate=" + toNvdDate(endDate);

    if (severity !== "") {
        url += "&cvssV3Severity=" + severity;
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("NVD request failed with status " + response.status);
    }

    const data = await response.json();

    // Reference: MDN – "Array.map()" (transforming API results)
    return data.vulnerabilities.map(simplifyCve);    
}

// Select only fields needed for NVD's record
// Reference: MDN – "Array.find()" (selecting English description)
// Reference: MDN – "Optional chaining / fallback patterns" (safe property access)
function simplifyCve(item) {
    const cve = item.cve

    const english = cve.descriptions.find((d) => d.lang === "en") || cve.descriptions[0];

    // Use newest CVSS rating available
    const metrics = cve.metrics || {};
    const rating = (metrics.cvssMetricV31 || metrics.cvssMetricV30 || metrics.cvssMetricV40 || [])[0];

    return {
        id: cve.id,
        description: english ? english.value : "No description available.",
        published: cve.published,
        score: rating ? rating.cvssData.baseScore : null,
        severity: rating ? rating.cvssData.baseSeverity : "UNRATED"
    };
}


// === 15. Build a Vulnerability Card ===
// Reference: MDN – "HTMLElement.dataset" (custom data attributes)
function createCard(vuln) {
    const card = makeElement("article", "vuln-card");
    card.dataset.severity = vuln.severity;

    // Title: links to full NVD record in new tab
    const heading = makeElement("h4");
    const link = makeElement("a", "", vuln.id);
    link.href = "https://nvd.nist.gov/vuln/detail/" + vuln.id;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.appendChild(makeElement("span", "visually-hidden", " (opens in a new tab)"));
    heading.appendChild(link);

    // Severity shown as text and colour
    const badgeText = vuln.score === null ? "Not yet rated" : vuln.severity + " " + vuln.score;
    const badge = makeElement ("span", "severity-badge", badgeText);

     // Reference: MDN – "Date.toLocaleDateString()" with formatting options
    const published = new Date(vuln.published).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric"
    });
    const meta = makeElement("p", "vuln-meta", "Published " + published);

    // Expandable description
     // Reference: MDN – "<details> and <summary>" (native disclosure element)
    const details = makeElement("details");
    details.append(
        makeElement("summary", "", "Read description"),
        makeElement("p", "", vuln.description)
    );

    card.append(heading, badge, meta, details);
    return card;
}


// === 16. Show Vulnerabilities For Each Product ===
// Reference: MDN – "for...of" loop (iterating async operations)
// Reference: MDN – "try...catch...finally" (robust error handling)
async function showVulnerabilities(answers, area) {
    area.appendChild(makeElement("p", "",
        "Known vulnerabilities published in the last " + DAYS_TO_SEARCH +
        " days, from the US National Vulnerability Database."));

        const loading = makeElement("p", "notice", "Searching the vulnerability database. This can take a few seconds...");
        area.appendChild(loading);
        statusBox.textContent = "Searching for vulnerabilities...";
        submitButton.disabled = true;

        try {
            for (const product of answers.software) {
                const group = makeElement("section", "product-group");
                group.appendChild(makeElement("h3", "", product + ": recent vulnerabilities"));

                try {
                    const vulns = await fetchVulnerabilities(product, answers.severity, answers.resultsCount);

                    if (vulns.length === 0) {
                        group.appendChild(makeElement("p", "notice",
                            "No matching vulnerabilities were published in the last " + DAYS_TO_SEARCH +
                            " days. Keep it updated so it stays that way."));
                    } else {
                        const grid = makeElement("div", "card-grid");

                        // Reference: MDN – "Array.forEach()" (rendering multiple cards)
                        vulns.forEach((vuln) => grid.appendChild(createCard(vuln)));
                        
                        group.appendChild(grid);
                    }
                } catch (error) {
                    console.error("NVD error for " + product + ":", error);
                    group.appendChild(makeElement("p", "notice notice-error",
                        "We couldn't check " + product + " right now. The database may be busy, please wait 30 seconds and try again."));
                }

                area.appendChild(group);                
            }
        } finally {
            loading.remove();
            statusBox.textContent = "";
            submitButton.disabled = false;
        }    
}