import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

// ─── Workspaces ───────────────────────────────────────────────────────────────
// A workspace groups recruiter team members under a shared billing account.
// workspace_type: recruiter_team | institution | personal

export const workspacesTable = pgTable(
  "workspaces",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    workspaceType: text("workspace_type").notNull().default("recruiter_team"),
    planCode: text("plan_code").notNull().default("recruiter_team"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_workspaces_owner_user_id").on(t.ownerUserId),
    index("idx_workspaces_slug").on(t.slug),
  ],
);

export type Workspace = typeof workspacesTable.$inferSelect;
export type InsertWorkspace = typeof workspacesTable.$inferInsert;

// ─── Workspace Members ────────────────────────────────────────────────────────
// role: owner | admin | recruiter | member | viewer
// status: active | invited | suspended | removed

export const workspaceMembersTable = pgTable(
  "workspace_members",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: varchar("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    status: text("status").notNull().default("active"),
    invitedByUserId: text("invited_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_workspace_members_workspace_id").on(t.workspaceId),
    index("idx_workspace_members_user_id").on(t.userId),
    index("idx_workspace_members_status").on(t.status),
  ],
);

export type WorkspaceMember = typeof workspaceMembersTable.$inferSelect;
export type InsertWorkspaceMember = typeof workspaceMembersTable.$inferInsert;

// ─── Workspace Invitations ────────────────────────────────────────────────────
// Owner/admin invites by email — token is generated server-side.
// status: pending | accepted | expired | revoked

export const workspaceInvitationsTable = pgTable(
  "workspace_invitations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: varchar("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull().default("member"),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_workspace_invitations_workspace_id").on(t.workspaceId),
    index("idx_workspace_invitations_token").on(t.token),
    index("idx_workspace_invitations_status").on(t.status),
    index("idx_workspace_invitations_email").on(t.email),
  ],
);

export type WorkspaceInvitation = typeof workspaceInvitationsTable.$inferSelect;
export type InsertWorkspaceInvitation = typeof workspaceInvitationsTable.$inferInsert;
