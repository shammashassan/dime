# Spec: Mobile Hover Buttons Visibility

## Goal Description
In the Dime application, card lists (like Wallets, Budgets, Recurring Transactions, Goals, Categories, Contacts, and Automation Rules) display action buttons (such as Edit, Delete, Pause/Resume) when hovering over a card. However, on mobile screens (touchscreen devices), hover events do not exist or are difficult to trigger, making these buttons inaccessible to mobile users.

This design document outlines the changes needed to make these action buttons always visible on mobile screens (below the `md` viewport breakpoint: 768px), while preserving the elegant hover behavior on desktop screens (at and above the `md` viewport breakpoint).

## Proposed Changes

We will update the CSS classes of the action button containers (or the buttons themselves) in the following files:

---

### Components Layer

#### [MODIFY] [wallets-view.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/wallets/wallets-view.tsx)
Modify the active wallet delete button `className` so it is always visible on mobile.
* **Target**:
  ```tsx
  className="size-7 rounded-lg text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0"
  ```
* **Replacement**:
  ```tsx
  className="size-7 rounded-lg text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 opacity-100 translate-x-0 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 md:translate-x-1 md:group-hover:translate-x-0"
  ```

---

#### [MODIFY] [budgets-view.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/budgets/budgets-view.tsx)
Modify the action buttons container `className`.
* **Target**:
  ```tsx
  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```
* **Replacement**:
  ```tsx
  className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```

---

#### [MODIFY] [recurring-view.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/recurring/recurring-view.tsx)
Modify the action buttons container `className`.
* **Target**:
  ```tsx
  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```
* **Replacement**:
  ```tsx
  className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```

---

#### [MODIFY] [goal-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/goals/goal-card.tsx)
Modify the action buttons container `className`.
* **Target**:
  ```tsx
  className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```
* **Replacement**:
  ```tsx
  className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```

---

#### [MODIFY] [categories-view.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/categories/categories-view.tsx)
Modify the action buttons container `className`.
* **Target**:
  ```tsx
  className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
  ```
* **Replacement**:
  ```tsx
  className="flex items-center gap-0.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
  ```

---

#### [MODIFY] [contacts-view.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/contacts/contacts-view.tsx)
Modify the action buttons container `className`.
* **Target**:
  ```tsx
  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```
* **Replacement**:
  ```tsx
  className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```

---

#### [MODIFY] [automation-rules.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/settings/automation-rules.tsx)
Modify the action buttons container `className`.
* **Target**:
  ```tsx
  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```
* **Replacement**:
  ```tsx
  className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```

## Verification Plan

### Manual Verification
- Resize the browser to a mobile viewport (< 768px wide) and verify that the action buttons (edit/delete) are visible on all the cards (Wallets, Budgets, Recurring Transactions, Goals, Categories, Contacts, Automation Rules) without hover.
- View on a desktop screen size (>= 768px wide) and verify that the action buttons are hidden by default, and fade/translate in smoothly on hover.
- Ensure the functionality of the buttons (click handlers, tooltips) works properly in both states.
