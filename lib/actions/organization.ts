"use server";

import { organizationSettingsCollection } from "@/lib/db/collections";
import { getFinancialScope } from "@/lib/scope";
import { organizationSettingsSchema } from "@/lib/validations/organization.schema";
import { updateTag } from "next/cache";

export async function updateOrganizationSettings(input: unknown) {
  const data = organizationSettingsSchema.parse(input);
  const scope = await getFinancialScope();
  
  if (!scope.isOrganization || !scope.organizationId) {
    throw new Error("Not inside an organization space");
  }

  const now = new Date();

  // Find and update, or insert if not exists
  await organizationSettingsCollection.findOneAndUpdate(
    { organizationId: scope.organizationId },
    {
      $set: {
        baseCurrency: data.baseCurrency,
        fiscalYearStartMonth: data.fiscalYearStartMonth,
        spaceType: data.spaceType,
        updatedBy: scope.userId,
        updatedAt: now,
      },
      $setOnInsert: {
        organizationId: scope.organizationId,
      },
      $inc: { version: 1 }
    },
    { upsert: true }
  );

  // Invalidate cache tags
  updateTag(`org-settings-${scope.organizationId}`);
  
  return { success: true };
}
import { requireApprovedUser } from "@/lib/auth-guard";
import { db } from "@/lib/db/client";

export async function getUserInvitationsAction() {
  try {
    const session = await requireApprovedUser();
    const items = await db.collection("invitation").find({
      email: session.user.email,
      status: "pending",
    }).toArray();

    const resolvedItems = await Promise.all(
      items.map(async (invite) => {
        const org = await db.collection("organization").findOne({
          id: invite.organizationId
        });
        return {
          id: invite._id ? invite._id.toString() : "",
          organizationId: invite.organizationId ? invite.organizationId.toString() : "",
          organizationName: org?.name || "Shared Workspace",
          inviterEmail: invite.inviterEmail || "Collaborator",
          role: invite.role,
          status: invite.status,
          expiresAt: invite.expiresAt ? (invite.expiresAt instanceof Date ? invite.expiresAt.toISOString() : new Date(invite.expiresAt).toISOString()) : null,
          createdAt: invite.createdAt ? (invite.createdAt instanceof Date ? invite.createdAt.toISOString() : new Date(invite.createdAt).toISOString()) : null,
        };
      })
    );

    return { success: true, data: resolvedItems };
  } catch (err) {
    console.error("Failed to fetch user invitations server-side:", err);
    return { success: false, data: [] };
  }
}
