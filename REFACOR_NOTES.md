# Ex2 Refactor Notes (SRP)

This file explains what was changed in `Ex2`, why it was changed, what problem it solves, and how it affects the system.

## Goal of the refactor
The original `CafeteriaSystem.checkout(...)` method was doing too many things:
- menu lookup
- pricing math
- tax policy decisions
- discount policy decisions
- invoice string formatting
- persistence

This violated **Single Responsibility Principle (SRP)** and made changes risky.

---

## What was changed

### 1) Added policy abstractions for tax and discount
New files:
- `src/TaxPolicy.java`
- `src/DiscountPolicy.java`

Updated files:
- `src/TaxRules.java` now implements `TaxPolicy`
- `src/DiscountRules.java` now implements `DiscountPolicy`

### Why this change
Tax/discount logic should be replaceable without touching orchestration code.

### What it solves
- Removes hard dependency on static rule methods.
- Makes it easier to add new policies (for example, festival discount, premium staff tax, etc.) without editing a large method.

### Effect
- Better extensibility.
- Lower risk of regressions when business rules change.

---

### 2) Introduced persistence abstraction
New file:
- `src/InvoiceStore.java`

Updated file:
- `src/FileStore.java` now implements `InvoiceStore`

### Why this change
`CafeteriaSystem` should depend on an abstraction, not a concrete file implementation.

### What it solves
- Decouples business flow from storage mechanism.
- Enables easy swap to DB/cloud/file-based store later.

### Effect
- Better testability and cleaner dependency boundaries.

---

### 3) Extracted pricing computation into dedicated component
New file:
- `src/PricingCalculator.java`

`PricingCalculator` now computes:
- line totals
- subtotal
- tax percent and tax amount
- discount amount
- final total

It returns a structured snapshot:
- `InvoiceSnapshot`
- `InvoiceLine`

### Why this change
All math and rule application should be in one pricing-focused class.

### What it solves
- Removes pricing complexity from `CafeteriaSystem`.
- Prevents calculation logic from being mixed with formatting and IO.

### Effect
- Easier to unit test pricing logic separately.
- Cleaner and smaller orchestration flow.

---

### 4) Moved invoice text generation into formatter
Updated file:
- `src/InvoiceFormatter.java`

Now it has:
- `format(String invoiceId, PricingCalculator.InvoiceSnapshot snapshot)`

### Why this change
String formatting and presentation should be isolated from business calculations.

### What it solves
- Removes output-building responsibility from `CafeteriaSystem`.
- Keeps line order and format in one dedicated place.

### Effect
- UI/output changes can be made safely without touching tax/discount logic.
- Preserved exact invoice text required by the exercise.

---

### 5) Refactored `CafeteriaSystem` into orchestration only
Updated file:
- `src/CafeteriaSystem.java`

Now `checkout(...)` does only:
1. create invoice id
2. resolve menu items from order lines
3. delegate to `PricingCalculator`
4. delegate invoice string creation to `InvoiceFormatter`
5. delegate save/count to `InvoiceStore`

### Why this change
This is the SRP target from the exercise acceptance criteria.

### What it solves
- Eliminates the “god method” problem.
- Makes flow easier to read and reason about.

### Effect
- Better separation of concerns.
- Better maintainability as project grows.

---

### 6) Updated composition in entrypoint
Updated file:
- `src/Main.java`

`Main` now wires dependencies explicitly:
- `TaxPolicy taxPolicy = new TaxRules();`
- `DiscountPolicy discountPolicy = new DiscountRules();`
- `PricingCalculator pricingCalculator = new PricingCalculator(taxPolicy, discountPolicy);`
- `InvoiceFormatter formatter = new InvoiceFormatter();`
- `InvoiceStore store = new FileStore();`

### Why this change
Dependency construction belongs at the application boundary.

### What it solves
- Makes dependencies visible and replaceable.
- Reduces hidden coupling.

### Effect
- Cleaner architecture and easier future migration to DI frameworks (if needed).

---

## Output compatibility
The exercise required **exact same output text and line order**.

Status: ✅ Preserved.

Verified by compiling and running:
```bash
cd SOLID/Ex2/src
javac *.java
java Main
```

Observed output remains:
- Header line
- Invoice lines
- Subtotal / Tax / Discount / TOTAL lines
- Saved invoice line with same line count (`lines=7`)

---

## Overall impact summary
- **Before:** One class handled everything (calculation + policy + formatting + persistence).
- **After:** Responsibilities are split into focused components with small interfaces.

### Main problems solved
1. SRP violation in checkout flow
2. Hard-coded, non-extensible rule application
3. Tight coupling to concrete persistence
4. Mixed formatting and business logic
5. Hard-to-test architecture

### Result
The system is now easier to extend, safer to change, and cleaner to understand—while keeping runtime behavior/output identical.
