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
    principalRange: $('#principal-range'),
    principalHint: $('#principal-slider-val'),
    rate: $('#rate'),
    rateRange: $('#rate-range'),
    rateHint: $('#rate-slider-val'),
    time: $('#time'),
    timeRange: $('#time-range'),
    timeHint: $('#time-slider-val'),
    frequency: $('#frequency'),
    btnCalc: $('#btn-calculate'),
    btnReset: $('#btn-reset'),
    resultsCard: $('#results-card'),
    calcLoader: $('#calc-loader'),
    resPrincipal: $('#res-principal'),
    resInterest: $('#res-interest'),
    resMaturity: $('#res-maturity'),
    resGrowth: $('#res-growth'),
    statInterestMultiplier: $('#stat-interest-multiplier'),
    pctPrincipal: $('#pct-principal'),
    pctInterest: $('#pct-interest'),
    segPrincipal: $('#seg-principal'),
    segInterest: $('#seg-interest'),
    chartCanvas: $('#result-chart'),
    chartTabs: $$('.chart-tab'),
    insightsList: $('#insights-list'),
    btnCopy: $('#btn-copy'),
    btnPrint: $('#btn-print'),
    btnPdf: $('#btn-pdf'),
    toast: $('#toast'),
    confettiCanvas: $('#confetti-canvas'),
    presetPills: $$('.preset-pill'),
    quickChips: $$('.quick-chips .chip'),
};

// ────────── State ──────────
let chartInstance = null;
let currentChart = 'doughnut';
let lastResult = null;
let previousStats = {
    principal: 0,
    interest: 0,
    maturity: 0,
    growth: 0,
};

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
 * Format a round currency number for badges / chips (₹1L, ₹50K, ₹1,00,000)
 * @param {number} amount
 * @returns {string}
 */
function formatShortCurrency(amount) {
    if (amount >= 1e7) return '₹' + (amount / 1e7).toFixed(amount % 1e7 === 0 ? 0 : 2) + ' Cr';
    if (amount >= 1e5) return '₹' + (amount / 1e5).toFixed(amount % 1e5 === 0 ? 0 : 2) + ' Lakh';
    if (amount >= 1e3) return '₹' + (amount / 1e3).toFixed(0) + 'K';
    return '₹' + amount.toLocaleString('en-IN');
}

/**
 * Parse a formatted currency/number string back to a float
 * @param {string} str
 * @returns {number}
 */
function parseCurrencyInput(str) {
    if (!str) return 0;
    return parseFloat(str.replace(/[₹,\s]/g, ''));
}

/**
 * Indian number formatting helper
 * @param {string} numStr
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
 * Format the principal input field with Indian grouping as user types
 * @param {HTMLInputElement} input
 */
function autoFormatCurrencyInput(input) {
    const raw = input.value.replace(/[^0-9.]/g, '');
    if (!raw || raw === '.') return;

    const parts = raw.split('.');
    let intPart = parts[0].replace(/^0+(?=\d)/, '') || '0';
    intPart = indianFormat(intPart);

    input.value = parts.length > 1 ? intPart + '.' + parts[1].slice(0, 2) : intPart;
}

/**
 * Show a toast notification with spring transition
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
 * @param {string} fieldId
 * @param {string} message
 */
function setFieldError(fieldId, message) {
    const group = $(`#group-${fieldId}`);
    const error = $(`#${fieldId}-error`);
    if (!group || !error) return;

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
    // Effective Annual Rate (APY): (1 + r/n)^n - 1
    const effectiveRate = (Math.pow(1 + rDecimal / n, n) - 1) * 100;

    return {
        principal: P,
        amount: Math.round(amount * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        effectiveRate: Math.round(effectiveRate * 100) / 100,
    };
}

// ═══════════════════════════════════════════════════
// ANIMATED NUMBER ROLL ENGINE
// ═══════════════════════════════════════════════════

/**
 * Smooth exponential ease-out counter animation
 * @param {HTMLElement} el
 * @param {number} startVal
 * @param {number} endVal
 * @param {number} duration  ms
 * @param {boolean} isCurrency
 * @param {string} suffix
 */
function countUp(el, startVal, endVal, duration = 850, isCurrency = true, suffix = '') {
    if (!el) return;
    const startTime = performance.now();
    el.classList.add('rolling');

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Exponential ease-out
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = startVal + (endVal - startVal) * ease;

        if (isCurrency) {
            el.textContent = formatCurrency(currentVal);
        } else {
            el.textContent = currentVal.toFixed(2) + suffix;
        }

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.classList.remove('rolling');
        }
    }

    requestAnimationFrame(step);
}

/**
 * Display the result stats with smooth counting animation
 * @param {object} result
 */
function renderStats(result) {
    const startP = previousStats.principal || result.principal * 0.7;
    const startI = previousStats.interest || 0;
    const startM = previousStats.maturity || result.principal;
    const startG = previousStats.growth || 0;

    countUp(dom.resPrincipal, startP, result.principal, 800, true);
    countUp(dom.resInterest, startI, result.interest, 950, true);
    countUp(dom.resMaturity, startM, result.amount, 950, true);
    countUp(dom.resGrowth, startG, result.effectiveRate, 750, false, '%');

    // Update multiplier badge
    if (dom.statInterestMultiplier && result.principal > 0) {
        const mult = (result.interest / result.principal).toFixed(1);
        dom.statInterestMultiplier.textContent = mult >= 1 ? `+${mult}x Return` : `+${((result.interest / result.principal) * 100).toFixed(0)}% Return`;
    }

    // Save previous for next animated transition
    previousStats = {
        principal: result.principal,
        interest: result.interest,
        maturity: result.amount,
        growth: result.effectiveRate,
    };
}

/**
 * Animate the Proportional Wealth Breakdown Bar
 * @param {number} principal
 * @param {number} interest
 */
function renderGrowthBar(principal, interest) {
    const total = principal + interest;
    if (total <= 0) return;

    const pPct = ((principal / total) * 100).toFixed(1);
    const iPct = ((interest / total) * 100).toFixed(1);

    dom.pctPrincipal.textContent = pPct + '%';
    dom.pctInterest.textContent = iPct + '%';

    // Trigger smooth CSS width transition
    dom.segPrincipal.style.width = pPct + '%';
    dom.segInterest.style.width = iPct + '%';
}

/**
 * Generate and display financial insights with staggered animations
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
            text: `Your investment of <strong>${formatCurrency(principal)}</strong> will compound into <strong>${formatCurrency(amount)}</strong> in ${time} year${time !== 1 ? 's' : ''}.`,
        },
        {
            icon: '🚀',
            text: `Total wealth generated: <strong>${formatCurrency(interest)}</strong> — a <strong>${growthPct}%</strong> net profit on your principal deposit.`,
        },
        {
            icon: '📅',
            text: `With <strong>${freqLabel}</strong> compounding, your effective annual yield (APY) is <strong>${effectiveRate.toFixed(2)}%</strong>.`,
        },
        {
            icon: '📈',
            text: `Estimated continuous monthly growth: <strong>${monthlyGrowth.toFixed(4)}%</strong> — micro-gains accelerating over time.`,
        },
        {
            icon: '⏳',
            text: `At this compounding speed, your initial money will double every <strong>${doublingTime.toFixed(1)} years</strong>.`,
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
// CELEBRATION CONFETTI ENGINE (CANVAS)
// ═══════════════════════════════════════════════════

/**
 * Launch an animated confetti burst to celebrate calculation
 */
function triggerCelebration() {
    const canvas = dom.confettiCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#38bdf8'];
    const particleCount = 65;

    // Center origin from bottom/middle
    const originX = canvas.width / 2;
    const originY = canvas.height * 0.45;

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 9 + 4;
        particles.push({
            x: originX + (Math.random() - 0.5) * 120,
            y: originY + (Math.random() - 0.5) * 40,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity - 4,
            size: Math.random() * 7 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 12,
            opacity: 1,
            gravity: 0.28,
            friction: 0.98,
        });
    }

    let animId;
    function renderFrame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let activeCount = 0;

        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= p.friction;
            p.rotation += p.rotSpeed;
            p.opacity -= 0.016;

            if (p.opacity > 0) {
                activeCount++;
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            }
        }

        if (activeCount > 0) {
            animId = requestAnimationFrame(renderFrame);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cancelAnimationFrame(animId);
        }
    }

    renderFrame();
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
        text: isDark ? '#aba8cd' : '#4b5563',
        grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    };
}

/**
 * Create or update the chart with smooth transition
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
    const labels = ['Principal Invested', 'Interest Earned'];
    const data = [result.principal, result.interest];

    const commonDataset = {
        backgroundColor: [colors.principal, colors.interest],
        borderWidth: 0,
        hoverOffset: type === 'doughnut' ? 14 : 0,
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
                    borderRadius: type === 'bar' ? 10 : 0,
                    barPercentage: 0.52,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 900,
                easing: 'easeOutQuart',
            },
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
                    backgroundColor: 'rgba(23, 20, 48, 0.94)',
                    titleFont: { family: "'Inter', sans-serif", weight: '700' },
                    bodyFont: { family: "'JetBrains Mono', monospace", size: 13 },
                    padding: 14,
                    cornerRadius: 10,
                    callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed.y ?? ctx.parsed)}`,
                    },
                },
            },
            ...(type === 'bar' && {
                scales: {
                    x: {
                        ticks: { color: colors.text, font: { family: "'Inter', sans-serif", weight: '600' } },
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
                cutout: '64%',
            }),
        },
    };

    chartInstance = new Chart(ctx, config);
}

// ═══════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════

/**
 * Handle form submission — calculate & display with animations
 * @param {Event} [e]
 */
function handleCalculate(e) {
    if (e) e.preventDefault();

    const inputs = validateInputs();
    if (!inputs) return;

    const { principal, rate, time, n } = inputs;

    // Show results card if hidden
    dom.resultsCard.classList.remove('hidden');
    dom.resultsCard.classList.remove('show');

    // Show loader
    dom.calcLoader.classList.add('active');
    dom.calcLoader.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
        const result = calculateCompoundInterest(principal, rate, n, time);
        lastResult = { ...result, rate, time, n };

        renderStats(result);
        renderGrowthBar(result.principal, result.interest);
        renderChart(result, currentChart);
        renderInsights(result, { ...inputs, rate });

        // Hide loader
        dom.calcLoader.classList.remove('active');
        dom.calcLoader.setAttribute('aria-hidden', 'true');

        // Trigger entrance animation
        void dom.resultsCard.offsetWidth; // force reflow
        dom.resultsCard.classList.add('show');

        // Launch celebratory confetti burst
        triggerCelebration();

        // Scroll into view on mobile
        if (window.innerWidth <= 900) {
            dom.resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 450);
}

/**
 * Reset everything
 */
function handleReset() {
    dom.principal.value = '';
    dom.rate.value = '';
    dom.time.value = '';
    dom.frequency.value = '4';

    if (dom.principalRange) dom.principalRange.value = 100000;
    if (dom.rateRange) dom.rateRange.value = 10;
    if (dom.timeRange) dom.timeRange.value = 10;

    updateFieldHints();
    clearActiveChips();

    // Clear errors
    ['principal', 'rate', 'time'].forEach((f) => setFieldError(f, ''));

    // Hide results
    dom.resultsCard.classList.add('hidden');
    dom.resultsCard.classList.remove('show');

    // Destroy chart
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    lastResult = null;
    previousStats = { principal: 0, interest: 0, maturity: 0, growth: 0 };
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

    if (lastResult && chartInstance) {
        renderChart(lastResult, currentChart);
    }
}

/**
 * Copy results to clipboard with animated feedback
 */
async function handleCopy() {
    if (!lastResult) return;
    const text = [
        `Compound Interest Calculation — FinCalc Pro`,
        `─────────────────────────────────────`,
        `Principal Amount:     ${formatCurrency(lastResult.principal)}`,
        `Interest Earned:      ${formatCurrency(lastResult.interest)}`,
        `Maturity Value:       ${formatCurrency(lastResult.amount)}`,
        `Effective APY:        ${lastResult.effectiveRate.toFixed(2)}%`,
        `─────────────────────────────────────`,
        `Rate: ${lastResult.rate}%  |  Period: ${lastResult.time} yrs  |  Frequency: ${FREQUENCY_LABELS[lastResult.n]}`,
    ].join('\n');

    try {
        await navigator.clipboard.writeText(text);
        showToast('✓ Results copied to clipboard');

        // Animate button feedback
        dom.btnCopy.style.transform = 'scale(1.2)';
        setTimeout(() => dom.btnCopy.style.transform = '', 250);
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

    const wasHidden = element.classList.contains('hidden');
    if (wasHidden) element.classList.remove('hidden');

    html2pdf().set(opt).from(element).save().then(() => {
        if (wasHidden) element.classList.add('hidden');
        showToast('PDF downloaded successfully');
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
// SYNCHRONIZED SLIDERS, CHIPS & PRESETS
// ═══════════════════════════════════════════════════

/**
 * Update field hint badges
 */
function updateFieldHints() {
    if (dom.principalHint && dom.principal) {
        const val = parseCurrencyInput(dom.principal.value) || 0;
        dom.principalHint.textContent = val > 0 ? formatShortCurrency(val) : '₹0';
    }
    if (dom.rateHint && dom.rate) {
        const val = parseFloat(dom.rate.value) || 0;
        dom.rateHint.textContent = val > 0 ? val + '%' : '0%';
    }
    if (dom.timeHint && dom.time) {
        const val = parseFloat(dom.time.value) || 0;
        dom.timeHint.textContent = val > 0 ? val + (val === 1 ? ' Year' : ' Years') : '0 Years';
    }
}

/**
 * Flash hint badge animation
 * @param {HTMLElement} badge
 */
function flashHint(badge) {
    if (!badge) return;
    badge.classList.add('updated');
    setTimeout(() => badge.classList.remove('updated'), 250);
}

/**
 * Clear all active chips
 */
function clearActiveChips() {
    dom.quickChips.forEach((chip) => chip.classList.remove('active'));
}

/**
 * Match and highlight quick chips based on current value
 * @param {string} target  'principal' | 'rate' | 'time'
 * @param {number} value
 */
function syncActiveChip(target, value) {
    $$(`.quick-chips[data-target="${target}"] .chip`).forEach((chip) => {
        const chipVal = parseFloat(chip.dataset.val);
        if (chipVal === value) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
}

/**
 * Setup range slider synchronization
 */
function initSliders() {
    // Principal range slider
    dom.principalRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        dom.principal.value = val.toLocaleString('en-IN');
        updateFieldHints();
        flashHint(dom.principalHint);
        syncActiveChip('principal', val);
        setFieldError('principal', '');
    });

    // Rate range slider
    dom.rateRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        dom.rate.value = val;
        updateFieldHints();
        flashHint(dom.rateHint);
        syncActiveChip('rate', val);
        setFieldError('rate', '');
    });

    // Time range slider
    dom.timeRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        dom.time.value = val;
        updateFieldHints();
        flashHint(dom.timeHint);
        syncActiveChip('time', val);
        setFieldError('time', '');
    });

    // Quick chips click
    dom.quickChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            const parent = chip.closest('.quick-chips');
            const target = parent.dataset.target;
            const val = parseFloat(chip.dataset.val);

            if (target === 'principal') {
                dom.principal.value = val.toLocaleString('en-IN');
                dom.principalRange.value = val;
                flashHint(dom.principalHint);
            } else if (target === 'rate') {
                dom.rate.value = val;
                dom.rateRange.value = val;
                flashHint(dom.rateHint);
            } else if (target === 'time') {
                dom.time.value = val;
                dom.timeRange.value = val;
                flashHint(dom.timeHint);
            }

            syncActiveChip(target, val);
            updateFieldHints();
            setFieldError(target, '');
        });
    });

    // Preset Scenario Pills
    dom.presetPills.forEach((pill) => {
        pill.addEventListener('click', () => {
            const p = parseFloat(pill.dataset.p);
            const r = parseFloat(pill.dataset.r);
            const t = parseFloat(pill.dataset.t);
            const n = pill.dataset.n;

            dom.principal.value = p.toLocaleString('en-IN');
            dom.principalRange.value = p;
            dom.rate.value = r;
            dom.rateRange.value = r;
            dom.time.value = t;
            dom.timeRange.value = t;
            dom.frequency.value = n;

            updateFieldHints();
            syncActiveChip('principal', p);
            syncActiveChip('rate', r);
            syncActiveChip('time', t);

            // Clean errors & trigger calculation
            ['principal', 'rate', 'time'].forEach((f) => setFieldError(f, ''));
            handleCalculate();
        });
    });
}

/**
 * Initialize 3D Card Hover Perspective
 */
function initCardTilt() {
    const cards = $$('.interactive-card');
    cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -3;
            const rotateY = ((x - centerX) / centerX) * 3;
            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });
}

/**
 * Restrict input to numeric characters and formatting chars
 * @param {Event} e
 * @param {string} allowed
 */
function restrictInput(e, allowed) {
    const regex = new RegExp(`[^${allowed}]`, 'g');
    const el = e.target;
    const pos = el.selectionStart;
    const before = el.value;
    el.value = el.value.replace(regex, '');
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
        setTimeout(() => dom.pageLoader.classList.add('done'), 280);
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

    // ── Principal: auto-format with commas and sync ──
    dom.principal.addEventListener('input', (e) => {
        restrictInput(e, '0-9.,');
        autoFormatCurrencyInput(e.target);
        const val = parseCurrencyInput(e.target.value);
        if (dom.principalRange && !isNaN(val) && val >= 10000 && val <= 10000000) {
            dom.principalRange.value = val;
        }
        updateFieldHints();
        syncActiveChip('principal', val);
    });

    // ── Rate: sync with slider ──
    dom.rate.addEventListener('input', (e) => {
        restrictInput(e, '0-9.');
        const parts = e.target.value.split('.');
        if (parts.length > 2) e.target.value = parts[0] + '.' + parts.slice(1).join('');
        const val = parseFloat(e.target.value);
        if (dom.rateRange && !isNaN(val) && val >= 1 && val <= 30) {
            dom.rateRange.value = val;
        }
        updateFieldHints();
        syncActiveChip('rate', val);
    });

    // ── Time: sync with slider ──
    dom.time.addEventListener('input', (e) => {
        restrictInput(e, '0-9.');
        const parts = e.target.value.split('.');
        if (parts.length > 2) e.target.value = parts[0] + '.' + parts.slice(1).join('');
        const val = parseFloat(e.target.value);
        if (dom.timeRange && !isNaN(val) && val >= 1 && val <= 40) {
            dom.timeRange.value = val;
        }
        updateFieldHints();
        syncActiveChip('time', val);
    });

    // ── Clear error on focus ──
    ['principal', 'rate', 'time'].forEach((id) => {
        $(`#${id}`)?.addEventListener('focus', () => setFieldError(id, ''));
    });

    // ── Interactive Sliders & Tilt ──
    initSliders();
    initCardTilt();

    // Initialize initial default values for convenient first click
    dom.principal.value = '1,00,000';
    dom.rate.value = '10';
    dom.time.value = '10';
    updateFieldHints();
}

// Start
init();
