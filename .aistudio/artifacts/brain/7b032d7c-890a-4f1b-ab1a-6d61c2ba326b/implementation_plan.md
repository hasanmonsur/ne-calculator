# Scientific Mode & Clean Minimalism Layout

Enhances the calculator with a scientific mode toggle button in the header that seamlessly expands the keypad into additional columns for advanced math (square root, power, log, natural log, constants $\pi$ & $e$, and parentheses), wrapped in the responsive "Clean Minimalism" dual-column desktop and mobile-optimized layout.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and user experience decisions were confirmed through Phase 1 clarification:

- **Mathematical Operators Confirmed**: Core scientific functions and constants: $\sqrt{x}$, $x^y$, $\log_{10}$, $\ln$, $\pi$, $e$, and parentheses `(` and `)`.
- **Keypad Expansion Confirmed**: When toggled, scientific mode expands into additional columns alongside the standard keypad without obscuring basic arithmetic keys.
- **Desktop & Responsive Layout Confirmed**: Full two-column responsive interface on desktop/tablet with a persistent history and saved favorites sidebar, transitioning smoothly to an ergonomic mobile view with drawer access.
- **Visual Design Identity**: Clean Minimalism theme featuring warm off-white canvas (`#F8F9FA`), crisp card surfaces (`#FFFFFF`), refined typography with light weights for current calculations, subtle border lines (`#F1F3F5`), slate operator pills (`#E9ECEF`), soft red clear actions (`#FFF0F0` / `#DC3545`), and clear blue primary accents (`#4A90E2`).

---

### 1. Overview & Core Concept

- **What It Does**: Upgrades PolyCalc from a four-function utility into a versatile scientific calculator. Users can switch between standard calculation mode and scientific calculation mode with a single header action, immediately unlocking exponential, logarithmic, root, and constant operations.
- **Target Audience / Persona**: Students, engineers, and everyday users who need quick basic math on mobile or structured scientific expressions and persistent history review on wider screens.
- **Key Value**: Provides power-user math capabilities when needed while keeping standard calculations effortless, uncluttered, and aesthetically refined.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Standard Calculation*: User enters numbers and operations (+, -, ×, ÷, %) with immediate visual feedback in the display.
  2. *Toggling Scientific Mode*: Clicking the header icon/pill toggles scientific keys. On desktop, the calculator smoothly widens to accommodate a 5-to-6 column grid; on mobile, it gracefully fits scientific columns while preserving minimum 44px tap hitboxes.
  3. *Parentheses & Multi-step Expressions*: Scientific expressions such as `2 × (3 + 4)` or `√(16)` can be constructed naturally with live previews in the expression sub-line before calculating.
  4. *History & Favorites*: Calculations automatically log to the history panel. Users can click any item to reuse its result, toggle a favorite star, or export history to CSV.
  5. *Theme Switch*: One-click toggle between crisp Clean Minimalist light mode and high-contrast dark mode.

- **Visual Identity & Theme**:
  - *Aesthetic*: Clean Minimalism — light, airy, utilitarian elegance inspired by modern Swiss/Braun industrial design.
  - *Color Palette*:
    - Canvas Background: Light `#F8F9FA` | Dark `#121417`
    - Calculator Card Surface: Light `#FFFFFF` | Dark `#1A1D21`
    - Primary Text: Light `#212529` | Dark `#F8F9FA`
    - Secondary Text: Light `#6C757D` | Dark `#94A3B8`
    - Accent / Equals: `#4A90E2` (Royal Blue)
    - Operator Surfaces: Light `#E9ECEF` | Dark `#2A2E35`
    - Clear Button: Light bg `#FFF0F0` / text `#DC3545` | Dark bg `#3C1E22` / text `#F87171`
    - Borders & Dividers: Light `#F1F3F5` | Dark `#2D3239`
  - *Typography*: Clean sans-serif system stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`), featuring a large 56px–64px display with thin/light weight (`font-light tracking-tight`) for high-precision readability.
  - *Geometry*: Card container `rounded-3xl` (24px radius), key buttons `rounded-2xl` (16–18px radius) with soft click scale animations (`active:scale-95`).

- **Interactive Feedback & Motion**:
  - Tactile button press feedback using spring physics.
  - Smooth expansion transition between standard 4-column grid and scientific multi-column grid via CSS/Motion layout animations.
  - Floating error pill indicator for syntax or division-by-zero errors.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Grid Expansion vs. Modal/Overlay Keypad**
  - *Chosen Approach*: Inline grid expansion where scientific operators appear as dedicated columns directly beside standard numeric keys.
  - *Why*: Allows rapid, uninterrupted chaining of numbers, parentheses, roots, and standard operations without requiring modal dismissals or view switching.
  - *Alternatives Considered*: Sub-tabs or modal drawers were rejected as they introduce friction when chaining formulas like `5 × √(25)`.

- **Decision 2: Math Engine & Sanitized Evaluation**
  - *Chosen Approach*: Enhanced expression parser with token mapping for mathematical functions ($\sqrt{x} \rightarrow \text{Math.sqrt}$, $x^y \rightarrow {**}$, $\log \rightarrow \text{Math.log10}$, $\ln \rightarrow \text{Math.log}$, $\pi \rightarrow \text{Math.PI}$, $e \rightarrow \text{Math.E}$) and balanced parentheses validation.
  - *Why*: Provides robust calculation accuracy without introducing heavy 3rd-party dependencies, maintaining fast build times and zero security vulnerabilities.

- **Decision 3: Dual-Mode Responsive Layout**
  - *Chosen Approach*: On screens $\ge 1024\text{px}$, display a side-by-side split screen with the calculator on the left and dedicated History / Saved Favorites panels on the right. On mobile devices, prioritize calculator ergonomics and provide access to History via a slide-over panel.
  - *Why*: Maximizes screen real estate on desktop monitors while honoring thumb-zone touch ergonomics on mobile.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Root (Theme: Light/Dark)                    │
│                                                                        │
│ ┌──────────────────────────────────────┐  ┌──────────────────────────┐ │
│ │          Calculator View             │  │   Sidebar (Desktop/Lg)   │ │
│ │                                      │  │                          │ │
│ │ ┌──────────────────────────────────┐ │  │ ┌──────────────────────┐ │ │
│ │ │ Header (Title, Sci, Theme, Hist) │ │  │ │ History Panel        │ │ │
│ │ └──────────────────────────────────┘ │  │ │ - Timestamped list   │ │ │
│ │ ┌──────────────────────────────────┐ │  │ │ - Star favorites     │ │ │
│ │ │ Display (Formula + Current Num)  │ │  │ │ - Reuse results      │ │ │
│ │ └──────────────────────────────────┘ │  │ │ - Export CSV button  │ │ │
│ │ ┌──────────────────────────────────┐ │  │ └──────────────────────┘ │ │
│ │ │ Responsive Keypad Grid           │ │  │ ┌──────────────────────┐ │ │
│ │ │ - Standard (4 cols)              │ │  │ │ Saved Favorites      │ │ │
│ │ │ - Scientific (expanded cols)     │ │  │ │ - Quick recall list  │ │ │
│ │ └──────────────────────────────────┘ │  │ └──────────────────────┘ │ │
│ └──────────────────────────────────────┘  └──────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `isScientific: boolean`: Controls keypad grid columns and visibility of scientific operators.
  - `expression: string`: Active formula accumulator (e.g. `12 × √(144) + `).
  - `display: string`: Current operand or evaluation result.
  - `history: CalculationHistory[]`: Persisted calculations array in `localStorage`.
  - `theme: 'light' | 'dark'`: Persisted theme setting toggling Tailwind dark classes and custom root tokens.

- **Component & Event Flow**:
  - Header `Scientific` button toggles `isScientific` with an active accent indicator badge.
  - Scientific key handlers:
    - $\sqrt{x}$: Injects `sqrt(` or calculates immediate square root of current display.
    - $x^y$: Injects `^` operator (evaluated as exponentiation).
    - $\log$: Injects `log(` (base 10).
    - $\ln$: Injects `ln(` (natural log).
    - $\pi$ & $e$: Injects mathematical constants.
    - `(` & `)`: Appends parentheses to expression allowing nested grouping.
  - Keypad dynamically recalculates column spans and sizing (`grid-cols-4` vs `grid-cols-6`) with smooth animations.
