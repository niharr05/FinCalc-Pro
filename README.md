<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Chart.js" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

<h1 align="center">💰 FinCalc Pro — Compound Interest Calculator</h1>

<p align="center">
  A modern, professional, fully responsive <strong>Compound Interest Calculator</strong> built with pure HTML, CSS &amp; Vanilla JavaScript.<br/>
  Designed to look and feel like a real-world financial tool used by banks and investment platforms.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-formula">Formula</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-customization">Customization</a> •
  <a href="#-license">License</a>
</p>

---

## 🎯 Demo

Simply open `index.html` in any modern browser — **no server, no build step, no dependencies to install**.

```
Compound Interest Calculator/
└── index.html   ← double-click to launch
```

---

## ✨ Features

### 🧮 Core Calculator

| Input | Description |
|-------|-------------|
| **Principal Amount (₹)** | The initial investment amount with auto Indian comma formatting |
| **Annual Interest Rate (%)** | Supports decimal values (e.g. 8.5%) |
| **Time Period (Years)** | Investment duration, supports decimals (e.g. 2.5 years) |
| **Compounding Frequency** | Annually · Semi-Annually · Quarterly · Monthly · Daily |

### 📊 Results Display

- **Principal Amount** — Your original investment
- **Interest Earned** — Total compound interest generated
- **Maturity Value** — Final amount at the end of the term
- **Effective Annual Growth** — True annual rate accounting for compounding frequency

### 📈 Interactive Charts (Chart.js)

- **Doughnut Chart** — Visual breakdown of Principal vs Interest
- **Bar Chart** — Toggle between chart types with a single click
- Theme-aware colors that adapt to light/dark mode

### 🧠 Financial Insights

Automatically generated insights including:
- 💰 Total wealth generated with percentage return
- 📈 Effective annual growth rate for chosen frequency
- 📅 Estimated monthly growth rate
- 🔄 Approximate doubling time (Rule of 72)
- ⏳ Future investment summary

### 🌙 Dark Mode

- One-click toggle between light and dark themes
- Preference saved to `localStorage` — persists across sessions
- All UI elements, charts, and backgrounds transition smoothly

### 📤 Export & Share

| Action | Description |
|--------|-------------|
| 📋 **Copy Results** | Copies formatted results text to clipboard |
| 🖨️ **Print** | Optimized print stylesheet — hides navigation, shows only results |
| 📄 **Download PDF** | Generates a clean PDF using html2pdf.js |

### 🛡️ Input Validation

- Real-time input restrictions (numeric-only fields)
- Inline error messages with red highlight
- Auto-format currency with Indian number grouping (₹1,23,456)
- Maximum value limits to prevent overflow
- Errors clear on focus for smooth UX

### 🎨 Design & UX

- **Glassmorphism** cards with backdrop blur and subtle borders
- **Gradient** hero title, buttons, and accent elements
- **Animated background** blobs for depth
- **Micro-animations** — hover effects, counting animation, slide-in results
- **Loading animation** with progress bar before showing results
- **Card-based layout** with colored accent strips
- **Professional typography** — Inter (UI) + JetBrains Mono (numbers)
- **Responsive** — flawless on mobile, tablet, and desktop

---

## 📐 Formula

The standard **Compound Interest Formula** is used:

```
A = P × (1 + r/n) ^ (n × t)
```

| Symbol | Meaning |
|--------|---------|
| `A` | Final Amount (Maturity Value) |
| `P` | Principal (Initial Investment) |
| `r` | Annual Interest Rate (as decimal) |
| `n` | Compounding frequency per year |
| `t` | Time period in years |

**Derived values:**

```
Interest Earned  = A − P
Effective Rate   = (1 + r/n)^n − 1
Doubling Time    = ln(2) / [n × ln(1 + r/n)]
Monthly Growth   = (A/P)^(1/(t×12)) − 1
```

### Example Calculation

| Input | Value |
|-------|-------|
| Principal | ₹5,00,000 |
| Rate | 8.5% |
| Time | 10 years |
| Frequency | Quarterly (n=4) |

| Output | Value |
|--------|-------|
| Maturity Value | ₹11,59,452.03 |
| Interest Earned | ₹6,59,452.03 |
| Effective Annual Rate | 8.77% |
| Total Return | 131.9% |

---

## 🚀 Getting Started

### Prerequisites

- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No Node.js, npm, or build tools required

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/compound-interest-calculator.git

# Navigate to the project directory
cd compound-interest-calculator

# Open in browser
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Or simply **download the ZIP** and double-click `index.html`.

### Using a Local Server (Optional)

If you prefer a local development server:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (npx)
npx serve .

# PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

---

## 📁 Project Structure

```
Compound Interest Calculator/
│
├── index.html          # Main HTML — semantic, accessible, SEO-optimized
├── style.css           # Complete stylesheet — design tokens, themes, responsive
├── script.js           # All application logic — calculation, charts, export
└── README.md           # This file
```

### File Breakdown

#### `index.html` (247 lines)
- Semantic HTML5 structure (`<header>`, `<main>`, `<footer>`, `<section>`)
- ARIA labels and roles for screen readers
- SEO meta tags (description, keywords, author)
- CDN links for Chart.js and html2pdf.js
- Google Fonts preconnect for performance
- Inline SVG icons (no external icon library needed)

#### `style.css` (480+ lines)
- CSS Custom Properties (design tokens) for easy theming
- Light and dark theme token sets
- Glassmorphism with `backdrop-filter`
- CSS animations (`@keyframes`) for loader, fade-in, pulse
- Fully responsive with breakpoints at 900px, 600px, and 380px
- Print-specific styles (`@media print`)
- `:has()` selector for smart input padding

#### `script.js` (380+ lines)
- Well-structured with clear sections and JSDoc comments
- Pure functions for calculation, formatting, validation
- Indian number formatting (₹1,23,456)
- Chart.js integration with theme-aware colors
- Clipboard API for copy functionality
- html2pdf.js integration for PDF export
- localStorage for theme persistence
- Zero external framework dependencies

---

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|-----------|---------|---------|
| **HTML5** | Semantic structure & accessibility | — |
| **CSS3** | Styling, animations, glassmorphism, responsive design | — |
| **Vanilla JavaScript** | All application logic | ES6+ |
| **Chart.js** | Interactive doughnut & bar charts | 4.4.7 |
| **html2pdf.js** | PDF export functionality | 0.10.1 |
| **Google Fonts** | Inter & JetBrains Mono typography | — |

> **No frameworks.** No React, no Vue, no Tailwind. Pure web technologies only.

---

## 🎨 Customization

### Changing Colors

All colors are defined as CSS custom properties in `style.css`. Edit the `:root` block:

```css
:root {
    --clr-primary:      #6366f1;   /* Main brand color */
    --clr-secondary:    #8b5cf6;   /* Gradient accent */
    --clr-accent:       #06b6d4;   /* Teal highlight */
    --clr-success:      #10b981;   /* Green / Interest */
    --clr-warning:      #f59e0b;   /* Amber / Growth */
    --clr-danger:       #ef4444;   /* Red / Errors */
}
```

### Changing Fonts

Update the Google Fonts import in `index.html` and the `--font-sans` / `--font-mono` variables:

```css
:root {
    --font-sans:  'Inter', system-ui, sans-serif;
    --font-mono:  'JetBrains Mono', monospace;
}
```

### Adding More Compounding Frequencies

Add a new `<option>` in `index.html` and the label in `script.js`:

```html
<!-- index.html -->
<option value="52">Weekly</option>
```

```javascript
// script.js
const FREQUENCY_LABELS = {
    1: 'Annually',
    2: 'Semi-Annually',
    4: 'Quarterly',
    12: 'Monthly',
    52: 'Weekly',      // ← new
    365: 'Daily',
};
```

### Changing Currency

Replace `₹` with your currency symbol in:
1. `index.html` — the `<span class="input-prefix">` element
2. `script.js` — the `formatCurrency()` function
3. `script.js` — chart tooltip callbacks

```javascript
function formatCurrency(amount) {
    return '$' + amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
```

---

## ♿ Accessibility

This project follows WAI-ARIA best practices:

- ✅ All interactive elements have `aria-label` or `aria-describedby`
- ✅ Form errors use `role="alert"` for screen reader announcements
- ✅ Semantic HTML5 landmarks (`<header>`, `<main>`, `<footer>`)
- ✅ `role="tablist"` and `aria-selected` on chart type toggles
- ✅ Toast notifications use `role="status"` with `aria-live="polite"`
- ✅ Color contrast ratios meet WCAG 2.1 AA standards
- ✅ Keyboard navigable — all buttons and inputs are focusable
- ✅ Focus ring with `box-shadow` glow on input focus

---

## 🖥️ Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome 90+ | ✅ |
| Firefox 90+ | ✅ |
| Safari 15+ | ✅ |
| Edge 90+ | ✅ |
| Opera 76+ | ✅ |
| Mobile Chrome | ✅ |
| Mobile Safari | ✅ |

> **Note:** Uses CSS `:has()` selector (supported in all modern browsers since 2023). Glassmorphism `backdrop-filter` may have limited effect in older browsers but degrades gracefully.

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| **> 900px** | Two-column grid — inputs left, results right |
| **600–900px** | Single column — stacked cards |
| **< 600px** | Compact mobile — single column stats, full-width buttons |
| **< 380px** | Extra small — reduced font sizes |

---

## 🔒 Privacy

- **No data collection** — all calculations happen client-side in your browser
- **No cookies** — only `localStorage` for theme preference
- **No analytics** — zero tracking scripts
- **No server calls** — works completely offline after loading CDN assets

---

## 📄 License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute it.

```
MIT License

Copyright (c) 2026 FinCalc Pro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Ideas for Contributions

- [ ] Add SIP (Systematic Investment Plan) calculator mode
- [ ] Year-by-year growth table
- [ ] Multiple currency support with auto-detection
- [ ] Compare different interest rates side by side
- [ ] Export results as CSV/Excel
- [ ] PWA support for offline installation
- [ ] Lottie animations for enhanced visual experience
- [ ] Multi-language (i18n) support

---

## 🙏 Acknowledgements

- [Chart.js](https://www.chartjs.org/) — Beautiful, flexible charting library
- [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) — Client-side PDF generation
- [Google Fonts](https://fonts.google.com/) — Inter & JetBrains Mono typefaces
- [Shields.io](https://shields.io/) — README badges

---