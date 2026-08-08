# Loan Details Layout & Empty States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent History & Timeline card squashing on the Loan Details page and provide permanent Contact Details and Reminder Schedule cards with empty states.

**Architecture:** Update `components/loans/loan-details.tsx` container classes to unconstrain right-column height and give the timeline card a minimum height of `380px`. Replace conditional render guards for Contact Details and Reminder Schedule with permanent cards that fall back to empty states with direct call-to-action triggers when contact info or reminder schedules are missing.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui components (`Card`, `Button`, `Badge`, `LoanDialog`, Lucide Icons).

---

### Task 1: Unsquash History & Timeline Card Layout

**Files:**
- Modify: `components/loans/loan-details.tsx:647-650`

- [ ] **Step 1: Update Right Column Grid & Timeline Card Sizing**

Update the right column container div and history card in `components/loans/loan-details.tsx`:

```tsx
{/* ── Right column: Timeline + Reminder Message ───────────── */}
<div className="lg:col-span-2 flex flex-col gap-4">
  <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 min-h-[380px] flex-1 flex flex-col overflow-hidden">
    <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <Clock className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">History &amp; Timeline</span>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
        {timelineEvents.length} event{timelineEvents.length !== 1 ? "s" : ""}
      </span>
    </div>
```

- [ ] **Step 2: Verify lint and build output**

Run: `npx next lint --file components/loans/loan-details.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/loans/loan-details.tsx
git commit -m "fix(loans): unconstrain right column height and set timeline min-height"
```

---

### Task 2: Implement Permanent Contact Details Card with Empty State

**Files:**
- Modify: `components/loans/loan-details.tsx:604-626`

- [ ] **Step 1: Replace Conditional Rendering with Permanent Contact Card & Fallback**

Replace the conditional `{matchedContact && (matchedContact.email || matchedContact.phone) && (...)}` block with a permanent card rendering either populated email/phone entries or a clear empty state:

```tsx
{/* Contact Details — always displayed for loan person */}
<Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
  <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <User className="size-3.5 text-muted-foreground" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact Details</span>
    </div>
    <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">{loan.personName}</span>
  </div>
  <div className="p-4 flex flex-col gap-2.5 text-xs">
    {matchedContact?.email && (
      <div className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-muted/20 px-3 py-2.5">
        <MailIcon className="size-3.5 text-muted-foreground shrink-0" />
        <span className="font-medium truncate">{matchedContact.email}</span>
      </div>
    )}
    {matchedContact?.phone && (
      <div className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-muted/20 px-3 py-2.5">
        <Phone className="size-3.5 text-muted-foreground shrink-0" />
        <span className="font-medium truncate">{matchedContact.phone}</span>
      </div>
    )}
    {(!matchedContact?.email && !matchedContact?.phone) && (
      <div className="flex flex-col gap-2.5">
        <p className="text-xs text-muted-foreground leading-relaxed">
          No email or phone number saved for this contact.
        </p>
        <LoanDialog
          wallets={wallets}
          contacts={contacts}
          initialLoan={loan}
          trigger={
            <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs font-semibold w-fit">
              <Edit className="size-3.5 mr-1.5" />
              Edit Loan Contact
            </Button>
          }
        />
      </div>
    )}
  </div>
</Card>
```

- [ ] **Step 2: Verify lint**

Run: `npx next lint --file components/loans/loan-details.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/loans/loan-details.tsx
git commit -m "feat(loans): show permanent contact details card with empty state"
```

---

### Task 3: Implement Permanent Reminder Schedule Card with Empty State

**Files:**
- Modify: `components/loans/loan-details.tsx:628-644`

- [ ] **Step 1: Replace Conditional Rendering with Permanent Reminder Schedule Card**

Replace the conditional `{loan.dueDate && activeReminders.length > 0 && (...)}` block with a permanent card that displays scheduled badges when present, or an empty state prompt when no due date / reminders exist:

```tsx
{/* Reminder Schedule — always displayed */}
<Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
  <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
    <BellRing className="size-3.5 text-muted-foreground" />
    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reminder Schedule</span>
  </div>
  <div className="p-4">
    {loan.dueDate && activeReminders.length > 0 ? (
      <div className="flex flex-wrap gap-1.5">
        {activeReminders.map((d) => (
          <Badge key={d} variant="outline" className="rounded-full px-2.5 py-1 text-[10px] font-semibold border-primary/20 bg-primary/5 text-primary">
            {reminderLabels[d] || `${d} days before`}
          </Badge>
        ))}
      </div>
    ) : (
      <div className="flex flex-col gap-2.5">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {!loan.dueDate
            ? "No due date set for this loan."
            : "No automated reminders scheduled."}
        </p>
        <LoanDialog
          wallets={wallets}
          contacts={contacts}
          initialLoan={loan}
          trigger={
            <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs font-semibold w-fit">
              <CalendarClock className="size-3.5 mr-1.5" />
              {!loan.dueDate ? "Set Due Date & Reminders" : "Add Reminders"}
            </Button>
          }
        />
      </div>
    )}
  </div>
</Card>
```

- [ ] **Step 2: Verify project build**

Run: `npm run build`
Expected: Build passes with 0 errors

- [ ] **Step 3: Commit**

```bash
git add components/loans/loan-details.tsx
git commit -m "feat(loans): show permanent reminder schedule card with empty state action"
```
