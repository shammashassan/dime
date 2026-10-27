"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

function Collapsible({
  asChild = false,
  render,
  children,
  ...props
}: CollapsiblePrimitive.Root.Props & { asChild?: boolean }) {
  const resolvedRender = render ?? (asChild && React.isValidElement(children) ? (children as React.ReactElement<any>) : undefined)
  const resolvedChildren = asChild && React.isValidElement(children) ? undefined : children

  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      render={resolvedRender}
      {...props}
    >
      {resolvedChildren}
    </CollapsiblePrimitive.Root>
  )
}

function CollapsibleTrigger({
  asChild = false,
  render,
  children,
  ...props
}: CollapsiblePrimitive.Trigger.Props & { asChild?: boolean }) {
  const resolvedRender = render ?? (asChild && React.isValidElement(children) ? (children as React.ReactElement<any>) : undefined)
  const resolvedChildren = asChild && React.isValidElement(children) ? undefined : children

  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      render={resolvedRender}
      {...props}
    >
      {resolvedChildren}
    </CollapsiblePrimitive.Trigger>
  )
}

function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
