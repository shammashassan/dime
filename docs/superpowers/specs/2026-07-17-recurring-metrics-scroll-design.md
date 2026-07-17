# Design Spec: Scrollable Metric Cards for Recurring View

We will update the metrics section on the recurring rules dashboard to use a horizontally scrollable flex layout instead of wrapping grids. This will prevent cards from shrinking and text from truncating on smaller screens.

## Problem Description
Currently, the metric cards wrap into a grid layout. On small screens, this causes the labels and values inside each `MetricCard` to be squished, causing the text to truncate (e.g. "Trials Ending..." or cropped currency amounts).

## Proposed Changes

### Component: `recurring-view.tsx`
We will modify [recurring-view.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/recurring/recurring-view.tsx) as follows:

1. **`MetricCard` Component**:
   Update `MetricCard` to accept a custom `className` or directly apply styling to the root `Card` container so that it doesn't shrink or squish.
   - We will use: `flex-1 min-w-[240px] shrink-0 snap-start`
   - This ensures the card retains a readable size and scrolls natively instead of collapsing.

2. **Metrics Parent Containers**:
   Replace the grid containers with a unified horizontally scrollable container:
   - Old: `<div className="grid grid-cols-2 md:grid-cols-4 gap-4">` (for subscription) / `<div className="grid grid-cols-2 gap-4">` (for bill) / `<div className="grid grid-cols-2 md:grid-cols-3 gap-4">` (for default).
   - New: `<div className="flex items-center gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 w-full">`

## Verification Plan

### Manual Verification
- Check the layout on desktop to ensure cards stretch nicely to fill the screen width without horizontal scrollbars.
- Check the layout on mobile (simulated in developer tools) to ensure:
  - Cards do not shrink below `240px`.
  - Cards can be swiped horizontally.
  - Text inside the cards (labels and currency values) is fully readable without truncation.
