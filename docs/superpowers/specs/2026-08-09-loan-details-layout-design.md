# Loan Details Page Layout & Empty States Design Spec

## Overview
Fix layout squashing of the History & Timeline card on the Loan Details page when Contact Details or Reminder Schedule data is missing. Ensure Contact Details and Reminder Schedule cards are always visible with helpful empty states and direct edit actions.

## Context & Motivation
Currently, when a loan lacks contact email/phone or active reminder schedules, those cards are omitted from the left sidebar. The right column relied on `lg:h-0 lg:min-h-full` to match the left column height, causing the History & Timeline card to squash down to a tiny scroll area when the left column is short.

In Dime, loans are always associated with a contact. Making Contact Details and Reminder Schedule cards permanently visible with empty states fixes column height disparity, improves feature discoverability, and allows users to quickly add missing information.

## Detailed Requirements

### 1. Layout & Column Sizing Fix
- **File**: `components/loans/loan-details.tsx`
- Remove `lg:h-0 lg:min-h-full` height constraint on the right column container.
- Establish explicit min-height on the History & Timeline card (`min-h-[380px]`) so the `<ScrollArea>` always maintains sufficient height regardless of left column contents.

### 2. Always-Visible Contact Details Card
- **Logic**: Always render the Contact Details card because every loan is linked to a contact (`loan.contactId` / `matchedContact`).
- **Populated State**: Display email and phone items with action icons.
- **Empty State** (when contact has no phone or email):
  - Display contact name.
  - Text: `"No email or phone number on file"`.
  - Action: Button opening the `LoanDialog` (or linking to contact edit) to update contact details.

### 3. Always-Visible Reminder Schedule Card
- **Logic**: Always render the Reminder Schedule card.
- **Populated State**: Display reminder badges (`"7 days before"`, `"On due date"`, etc.).
- **Empty State** (when no due date or reminder schedule is set):
  - Text: `"No due date or reminders scheduled for this loan"`.
  - Action: Button opening the `LoanDialog` pre-focused/configured for editing loan due date and reminders.

## Verification Plan
- Inspect layout responsiveness on desktop (`lg:` breakpoint) and mobile.
- Verify Timeline card maintains `min-h-[380px]` even on loans without contact info / reminders.
- Verify empty states render correctly when:
  1. Contact has no email/phone.
  2. Loan has no due date or reminders.
- Verify edit dialog triggers correctly from empty state actions.
