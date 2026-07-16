# Mobile Hover Buttons Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make action buttons (Edit, Delete, Pause/Resume) on card lists (Wallets, Budgets, Recurring, Goals, Categories, Contacts, Automation Rules) always visible on mobile viewports (below 768px), while keeping the hover effect on desktop viewports.

**Architecture:** We will adjust the Tailwind CSS utility classes on the action button containers/buttons. We will change the default mobile classes to `opacity-100` and use the `md:` prefix to apply `opacity-0` (and translation classes where applicable) on medium/large screens, making them hover-revealed only on desktop.

**Tech Stack:** Next.js, React, Tailwind CSS

---

### Task 1: Wallet Card Delete Button

**Files:**
- Modify: [wallets-view.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/wallets/wallets-view.tsx)

- [ ] **Step 1: Modify the delete button class in `wallets-view.tsx`**
  Modify line 221 in `components/wallets/wallets-view.tsx` to make the delete button always visible on mobile.
  
  **Before:**
  ```tsx
  className="size-7 rounded-lg text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0"
  ```
  
  **After:**
  ```tsx
  className="size-7 rounded-lg text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 opacity-100 translate-x-0 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 md:translate-x-1 md:group-hover:translate-x-0"
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add components/wallets/wallets-view.tsx
  git commit -m "feat: show wallet delete button on mobile screens by default"
  ```

---

### Task 2: Budget Card Action Buttons

**Files:**
- Modify: [budgets-view.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/budgets/budgets-view.tsx)

- [ ] **Step 1: Modify the action buttons container class in `budgets-view.tsx`**
  Modify line 105 in `components/budgets/budgets-view.tsx` to make the edit and delete buttons visible on mobile.
  
  **Before:**
  ```tsx
  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```
  
  **After:**
  ```tsx
  className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add components/budgets/budgets-view.tsx
  git commit -m "feat: show budget card action buttons on mobile screens by default"
  ```

---

### Task 3: Recurring Transaction Card Action Buttons

**Files:**
- Modify: [recurring-view.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/recurring/recurring-view.tsx)

- [ ] **Step 1: Modify the action buttons container class in `recurring-view.tsx`**
  Modify line 193 in `components/recurring/recurring-view.tsx` to make the play/pause, edit, and delete buttons visible on mobile.
  
  **Before:**
  ```tsx
  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```
  
  **After:**
  ```tsx
  className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add components/recurring/recurring-view.tsx
  git commit -m "feat: show recurring transaction action buttons on mobile screens by default"
  ```

---

### Task 4: Goal Card Action Buttons

**Files:**
- Modify: [goal-card.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/goals/goal-card.tsx)

- [ ] **Step 1: Modify the action buttons container class in `goal-card.tsx`**
  Modify line 108 in `components/goals/goal-card.tsx` to make the edit and delete buttons visible on mobile.
  
  **Before:**
  ```tsx
  className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```
  
  **After:**
  ```tsx
  className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add components/goals/goal-card.tsx
  git commit -m "feat: show goal card action buttons on mobile screens by default"
  ```

---

### Task 5: Category Card Action Buttons

**Files:**
- Modify: [categories-view.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/categories/categories-view.tsx)

- [ ] **Step 1: Modify the action buttons container class in `categories-view.tsx`**
  Modify line 129 in `components/categories/categories-view.tsx` to make the edit and delete buttons visible on mobile.
  
  **Before:**
  ```tsx
  className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
  ```
  
  **After:**
  ```tsx
  className="flex items-center gap-0.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add components/categories/categories-view.tsx
  git commit -m "feat: show category card action buttons on mobile screens by default"
  ```

---

### Task 6: Contact Card Action Buttons

**Files:**
- Modify: [contacts-view.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/contacts/contacts-view.tsx)

- [ ] **Step 1: Modify the action buttons container class in `contacts-view.tsx`**
  Modify line 274 in `components/contacts/contacts-view.tsx` to make the edit and delete buttons visible on mobile.
  
  **Before:**
  ```tsx
  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```
  
  **After:**
  ```tsx
  className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add components/contacts/contacts-view.tsx
  git commit -m "feat: show contact card action buttons on mobile screens by default"
  ```

---

### Task 7: Automation Rule Card Action Buttons

**Files:**
- Modify: [automation-rules.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/settings/automation-rules.tsx)

- [ ] **Step 1: Modify the action buttons container class in `automation-rules.tsx`**
  Modify line 666 in `components/settings/automation-rules.tsx` to make the edit and delete buttons visible on mobile.
  
  **Before:**
  ```tsx
  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```
  
  **After:**
  ```tsx
  className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add components/settings/automation-rules.tsx
  git commit -m "feat: show automation rule card action buttons on mobile screens by default"
  ```
