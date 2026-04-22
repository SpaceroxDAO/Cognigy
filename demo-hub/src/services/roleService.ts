export interface Role {
  name: string;
  isSystem: boolean;
  description?: string;
}

export const SYSTEM_ROLES: Role[] = [
  { name: 'admin', isSystem: true, description: 'Full access to all admin features including user management, flow configuration, feedback, and audit logs.' },
  { name: 'user', isSystem: true, description: 'Standard access to use demos and submit feedback. Cannot access the admin panel.' },
  { name: 'feedback-manager', isSystem: true, description: 'Can view and manage the Feedback tab in the admin panel. Cannot manage users or flows.' },
  { name: 'user-manager', isSystem: true, description: 'Can view, add, and manage users via the Manage Users and Add User tabs. Cannot manage flows or feedback.' },
  { name: 'flow-manager', isSystem: true, description: 'Can configure demo flows, update WebRTC endpoints, and manage flow settings. Cannot manage users or feedback.' },
  { name: 'sales-manager', isSystem: true, description: 'Can view the Demo Reports page with usage analytics, popular demos, and user activity data.' },
];

export const roleService = {
  getAllRolesSimple: async (_token?: string): Promise<Role[]> => SYSTEM_ROLES,
};
