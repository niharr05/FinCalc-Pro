/* ═══════════════════════════════════════════════════
   script.js — FinCalc Pro  •  Compound Interest Calc
   ═══════════════════════════════════════════════════ */

// ────────── DOM Elements ──────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
    pageLoader: $('#page-loader'),
    themeToggle: $('#theme-toggle'),
    form: $('#calc-form'),
    principal: $('#principal'),
    rate: $('#rate'),
    time: $('#time'),
    frequency: $('#frequency'),
    btnCalc: $('#btn-calculate'),
    btnReset: $('#btn-reset'),
    resultsCard: $('#results-card'),
    calcLoader: $('#calc-loader'),
    resPrincipal: $('#res-principal'),
    resInterest: $('#res-interest'),
    resMaturity: $('#res-maturity'),
    resGrowth: $('#res-growth'),
    chartCanvas: $('#result-chart'),
    chartTabs: $$('.chart-tab'),
    insightsList: $('#insights-list'),
    btnCopy: $('#btn-copy'),
    btnPrint: $('#btn-print'),
    btnPdf: $('#btn-pdf'),
    toast: $('#toast'),
};

// ────────── State ──────────
let chartInstance = null;
let currentChart = 'doughnut';
let lastResult = null;

// ────────── Constants ──────────
const FREQUENCY_LABELS = { 1: 'Annually', 2: 'Semi-Annually', 4: 'Quarterly', 12: 'Monthly', 365: 'Daily' };

// ═══════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════

/**
 * Format a number as Indian currency string (₹1,23,456.78)
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Parse a formatted currency/number string back to a float
 * Removes ₹, commas, spaces
 * @param {string} str
 * @returns {number}
 */
function parseCurrencyInput(str) {
    return parseFloat(str.replace(/[₹,\s]/g, ''));
}

/**
 * Format the principal input field with Indian grouping as user types
 * @param {HTMLInputElement} input
 */
function autoFormatCurrencyInput(input) {
    const raw = input.value.replace(/[^0-9.]/g, '');
    if (!raw || raw === '.') return;

    const parts = raw.split('.');
    // Format the integer part with Indian commas
    let intPart = parts[0].replace(/^0+(?=\d)/, '');
    if (intPart === '') intPart = '0';
    intPart = intPart.replace(/\B(?=(\d{2})+(?=\d{3}$)|\d{3}$)/g, function (match, offset) {
        // Use standard Indian comma formatting
        return ',';
    });
    // Simpler Indian formatting
    intPart = indianFormat(parts[0].replace(/^0+(?=\d)/, '') || '0');

    input.value = parts.length > 1 ? intPart + '.' + parts[1].slice(0, 2) : intPart;
}

/**
 * Indian number formatting (1,23,456)
 * @param {string} numStr  Integer string
 * @returns {string}
 */
function indianFormat(numStr) {
    if (numStr.length <= 3) return numStr;
    const last3 = numStr.slice(-3);
    const rest = numStr.slice(0, -3);
    const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return formatted + ',' + last3;
}

/**
 * Show a toast notification
 * @param {string} message
 * @param {number} duration  ms
 */
function showToast(message, duration = 2500) {
    dom.toast.textContent = message;
    dom.toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => dom.toast.classList.remove('visible'), duration);
}

/**
 * Set or clear error state on a form group
 * @param {string} fieldId  e.g. 'principal'
 * @param {string} message  empty to clear
 */
function setFieldError(fieldId, message) {
    const group = $(`#group-${fieldId}`);
    const error = $(`#${fieldId}-error`);
    if (message) {
        group.classList.add('error');
        error.textContent = message;
    } else {
        group.classList.remove('error');
        error.textContent = '';
    }
}

/**
 * Validate all inputs. Returns parsed values or null if invalid.
 * @returns {{ principal: number, rate: number, time: number, n: number } | null}
 */
function validateInputs() {
    let valid = true;

    // Principal
    const pVal = parseCurrencyInput(dom.principal.value);
    if (isNaN(pVal) || pVal <= 0) {
        setFieldError('principal', 'Enter a valid amount greater than 0');
        valid = false;
    } else if (pVal > 1e15) {
        setFieldError('principal', 'Amount is too large');
        valid = false;
    } else {
        setFieldError('principal', '');
    }

    // Rate
    const rVal = parseFloat(dom.rate.value);
    if (isNaN(rVal) || rVal <= 0) {
        setFieldError('rate', 'Enter a valid rate greater than 0');
        valid = false;
    } else if (rVal > 100) {
        setFieldError('rate', 'Rate cannot exceed 100%');
        valid = false;
    } else {
        setFieldError('rate', '');
    }

    // Time
    const tVal = parseFloat(dom.time.value);
    if (isNaN(tVal) || tVal <= 0) {
        setFieldError('time', 'Enter a valid period greater than 0');
        valid = false;
    } else if (tVal > 100) {
        setFieldError('time', 'Period cannot exceed 100 years');
        valid = false;
    } else {
        setFieldError('time', '');
    }

    if (!valid) return null;

    return {
        principal: pVal,
        rate: rVal,
        time: tVal,
        n: parseInt(dom.frequency.value, 10),
    };
}

// ═══════════════════════════════════════════════════
// COMPOUND INTEREST CALCULATION
// ═══════════════════════════════════════════════════

/**
 * A = P(1 + r/n)^(n*t)
 * @param {number} P  Principal
 * @param {number} r  Annual rate (percentage)
 * @param {number} n  Compounding frequency
 * @param {number} t  Time in years
 * @returns {{ principal: number, amount: number, interest: number, effectiveRate: number }}
 */
function calculateCompoundInterest(P, r, n, t) {
    const rDecimal = r / 100;
    const amount = P * Math.pow(1 + rDecimal / n, n * t);
    const interest = amount - P;
    // Effective Annual Rate: (1 + r/n)^n - 1
    const effectiveRate = (Math.pow(1 + rDecimal / n, n) - 1) * 100;

    return {
        principal: P,
        amount: Math.round(amount * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        effectiveRate: Math.round(effectiveRate * 100) / 100,
    };
}

// ═══════════════════════════════════════════════════
// RENDER RESULTS
// ═══════════════════════════════════════════════════

/**
 * Animate a stat value with a counting effect
 * @param {HTMLElement} el
 * @param {string} finalText
 */
function animateStatValue(el, finalText) {
    el.classList.add('counting');
    el.textContent = finalText;
    setTimeout(() => el.classList.remove('counting'), 500);
}

/**
 * Display the result stats
 * @param {object} result
 */
function renderStats(result) {
    animateStatValue(dom.resPrincipal, formatCurrency(result.principal));
    animateStatValue(dom.resInterest, formatCurrency(result.interest));
    animateStatValue(dom.resMaturity, formatCurrency(result.amount));
    animateStatValue(dom.resGrowth, result.effectiveRate.toFixed(2) + '%');
}

/**
 * Generate and display financial insights
 * @param {object} result
 * @param {object} inputs
 */
function renderInsights(result, inputs) {
    const { principal, amount, interest, effectiveRate } = result;
    const { time, n } = inputs;

    const growthPct = ((interest / principal) * 100).toFixed(1);
    const monthlyGrowth = (Math.pow(amount / principal, 1 / (time * 12)) - 1) * 100;
    const doublingTime = Math.log(2) / (n * Math.log(1 + (inputs.rate / 100) / n));
    const freqLabel = FREQUENCY_LABELS[n] || n + 'x/year';

    const insights = [
        {
            icon: '💰',
            text: `Your investment of <strong>${formatCurrency(principal)}</strong> will grow to <strong>${formatCurrency(amount)}</strong> in ${time} year${time !== 1 ? 's' : ''}.`,
        },
        {
            icon: '📈',
            text: `Total wealth generated: <strong>${formatCurrency(interest)}</strong> — a <strong>${growthPct}%</strong> return on your principal.`,
        },
        {
            icon: '📅',
            text: `With <strong>${freqLabel}</strong> compounding, your effective annual growth rate is <strong>${effectiveRate.toFixed(2)}%</strong>.`,
        },
        {
            icon: '🔄',
            text: `Estimated monthly growth rate: <strong>${monthlyGrowth.toFixed(4)}%</strong> — small gains that compound into big results.`,
        },
        {
            icon: '⏳',
            text: `At this rate, your money would approximately double in <strong>${doublingTime.toFixed(1)} years</strong>.`,
        },
    ];

    dom.insightsList.innerHTML = insights
        .map(
            (item) => `
        <li class="insight-item">
            <span class="insight-icon" aria-hidden="true">${item.icon}</span>
            <span class="insight-text">${item.text}</span>
        </li>`
        )
        .join('');
}

// ═══════════════════════════════════════════════════
// CHART
// ═══════════════════════════════════════════════════

/**
 * Get theme-aware chart colors
 */
function chartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        principal: '#6366f1',
        interest: '#10b981',
        total: '#06b6d4',
        text: isDark ? '#a5a2c4' : '#4b5563',
        grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    };
}

/**
 * Create or update the chart
 * @param {object} result
 * @param {'doughnut'|'bar'} type
 */
function renderChart(result, type) {
    const colors = chartColors();

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    const ctx = dom.chartCanvas.getContext('2d');

    const labels = ['Principal', 'Interest Earned'];
    const data = [result.principal, result.interest];

    const commonDataset = {
        backgroundColor: [colors.principal, colors.interest],
        borderWidth: 0,
        hoverOffset: type === 'doughnut' ? 12 : 0,
    };

    const config = {
        type,
        data: {
            labels,
            datasets: [
                {
                    label: 'Amount (₹)',
                    data,
                    ...commonDataset,
                    borderRadius: type === 'bar' ? 8 : 0,
                    barPercentage: 0.55,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 800, easing: 'easeOutQuart' },
            plugins: {
                legend: {
                    display: true,
                    position: type === 'doughnut' ? 'bottom' : 'top',
                    labels: {
                        color: colors.text,
                        font: { family: "'Inter', sans-serif", size: 13, weight: '600' },
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 12,
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 27, 55, 0.92)',
                    titleFont: { family: "'Inter', sans-serif", weight: '600' },
                    bodyFont: { family: "'JetBrains Mono', monospace", size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed.y ?? ctx.parsed)}`,
                    },
                },
            },
            ...(type === 'bar' && {
                scales: {
                    x: {
                        ticks: { color: colors.text, font: { family: "'Inter', sans-serif", weight: '500' } },
                        grid: { display: false },
                    },
                    y: {
                        ticks: {
                            color: colors.text,
                            font: { family: "'Inter', sans-serif" },
                            callback: (v) => '₹' + (v >= 1e7 ? (v / 1e7).toFixed(1) + 'Cr' : v >= 1e5 ? (v / 1e5).toFixed(1) + 'L' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v),
                        },
                        grid: { color: colors.grid },
                    },
                },
            }),
            ...(type === 'doughnut' && {
                cutout: '62%',
            }),
        },
    };

    chartInstance = new Chart(ctx, config);
}

// ═══════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════

/**
 * Handle form submission — calculate & display
 * @param {Event} e
 */
function handleCalculate(e) {
    e.preventDefault();

    const inputs = validateInputs();
    if (!inputs) return;

    const { principal, rate, time, n } = inputs;

    // Show results card if hidden
    dom.resultsCard.classList.remove('hidden');
    dom.resultsCard.classList.remove('show');

    // Show loader briefly
    dom.calcLoader.classList.add('active');
    dom.calcLoader.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
        const result = calculateCompoundInterest(principal, rate, n, time);
        lastResult = { ...result, rate, time, n };

        renderStats(result);
        renderChart(result, currentChart);
        renderInsights(result, { ...inputs, rate });

        // Hide loader
        dom.calcLoader.classList.remove('active');
        dom.calcLoader.setAttribute('aria-hidden', 'true');

        // Trigger entrance animation
        void dom.resultsCard.offsetWidth; // force reflow
        dom.resultsCard.classList.add('show');

        // Scroll into view on mobile
        if (window.innerWidth <= 900) {
            dom.resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 700);
}

/**
 * Reset everything
 */
function handleReset() {
    dom.principal.value = '';
    dom.rate.value = '';
    dom.time.value = '';
    dom.frequency.value = '4';

    // Clear errors
    ['principal', 'rate', 'time'].forEach((f) => setFieldError(f, ''));

    // Hide results
    dom.resultsCard.classList.add('hidden');
    dom.resultsCard.classList.remove('show');

    // Destroy chart
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    lastResult = null;
    showToast('Calculator reset');
}

/**
 * Toggle dark/light theme
 */
function handleThemeToggle() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('fincalc-theme', next);

    // Re-render chart with new colors if visible
    if (lastResult && chartInstance) {
        renderChart(lastResult, currentChart);
    }
}

/**
 * Copy results to clipboard
 */
async function handleCopy() {
    if (!lastResult) return;
    const text = [
        `Compound Interest Calculation — FinCalc Pro`,
        `─────────────────────────────────────`,
        `Principal Amount:     ${formatCurrency(lastResult.principal)}`,
        `Interest Earned:      ${formatCurrency(lastResult.interest)}`,
        `Maturity Value:       ${formatCurrency(lastResult.amount)}`,
        `Effective Growth:     ${lastResult.effectiveRate.toFixed(2)}%`,
        `─────────────────────────────────────`,
        `Rate: ${lastResult.rate}%  |  Period: ${lastResult.time} yrs  |  Frequency: ${FREQUENCY_LABELS[lastResult.n]}`,
    ].join('\n');

    try {
        await navigator.clipboard.writeText(text);
        showToast('Results copied to clipboard');
    } catch {
        showToast('Failed to copy — try manually');
    }
}

/**
 * Print results
 */
function handlePrint() {
    window.print();
}

/**
 * Download results as PDF using html2pdf
 */
function handlePdf() {
    if (!lastResult) return;

    const element = dom.resultsCard;
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `FinCalc-Pro-Result-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    showToast('Generating PDF…');

    // Temporarily make sure card is visible for capture
    const wasHidden = element.classList.contains('hidden');
    if (wasHidden) element.classList.remove('hidden');

    html2pdf().set(opt).from(element).save().then(() => {
        if (wasHidden) element.classList.add('hidden');
        showToast('PDF downloaded');
    }).catch(() => {
        if (wasHidden) element.classList.add('hidden');
        showToast('PDF generation failed');
    });
}

/**
 * Switch chart type
 * @param {Event} e
 */
function handleChartTabClick(e) {
    const btn = e.target.closest('.chart-tab');
    if (!btn || btn.classList.contains('active')) return;

    dom.chartTabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    currentChart = btn.dataset.chart;

    if (lastResult) {
        renderChart(lastResult, currentChart);
    }
}

// ═══════════════════════════════════════════════════
// INPUT FORMATTING & RESTRICTIONS
// ═══════════════════════════════════════════════════

/**
 * Restrict input to numeric characters and formatting chars
 * @param {Event} e
 * @param {string} allowed  regex character class
 */
function restrictInput(e, allowed) {
    const regex = new RegExp(`[^${allowed}]`, 'g');
    const el = e.target;
    const pos = el.selectionStart;
    const before = el.value;
    el.value = el.value.replace(regex, '');
    // Restore cursor if value changed
    if (el.value !== before) {
        el.selectionStart = el.selectionEnd = Math.max(0, pos - 1);
    }
}

// ═══════════════════════════════════════════════════
// INIT & BINDINGS
// ═══════════════════════════════════════════════════

function init() {
    // ── Page loader ──
    window.addEventListener('load', () => {
        setTimeout(() => dom.pageLoader.classList.add('done'), 350);
    });

    // ── Restore theme ──
    const savedTheme = localStorage.getItem('fincalc-theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // ── Form submit ──
    dom.form.addEventListener('submit', handleCalculate);

    // ── Reset ──
    dom.form.addEventListener('reset', (e) => {
        e.preventDefault();
        handleReset();
    });

    // ── Theme ──
    dom.themeToggle.addEventListener('click', handleThemeToggle);

    // ── Copy / Print / PDF ──
    dom.btnCopy.addEventListener('click', handleCopy);
    dom.btnPrint.addEventListener('click', handlePrint);
    dom.btnPdf.addEventListener('click', handlePdf);

    // ── Chart tabs ──
    dom.chartTabs.forEach((tab) => tab.addEventListener('click', handleChartTabClick));

    // ── Principal: auto-format with commas ──
    dom.principal.addEventListener('input', (e) => {
        restrictInput(e, '0-9.,');
        autoFormatCurrencyInput(e.target);
    });

    // ── Rate: restrict to numbers and single dot ──
    dom.rate.addEventListener('input', (e) => {
        restrictInput(e, '0-9.');
        // Ensure only one dot
        const parts = e.target.value.split('.');
        if (parts.length > 2) e.target.value = parts[0] + '.' + parts.slice(1).join('');
    });

    // ── Time: restrict to numbers and single dot ──
    dom.time.addEventListener('input', (e) => {
        restrictInput(e, '0-9.');
        const parts = e.target.value.split('.');
        if (parts.length > 2) e.target.value = parts[0] + '.' + parts.slice(1).join('');
    });

    // ── Clear error on focus ──
    ['principal', 'rate', 'time'].forEach((id) => {
        $(`#${id}`).addEventListener('focus', () => setFieldError(id, ''));
    });
}

// Kick off
init();
