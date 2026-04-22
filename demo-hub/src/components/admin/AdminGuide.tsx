import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Users, UserPlus, ClipboardList, Settings, MessageSquare, Shield, FileText, 
  BookOpen, Lock, AlertTriangle, Download, Upload, Link2 
} from "lucide-react";

interface GuideSection {
  id: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

const sections: GuideSection[] = [
  {
    id: "manage-users",
    icon: Users,
    title: "Manage Users",
    content: (
      <div className="space-y-3 text-sm text-slate-700">
        <p>View, search, and manage all registered users from a single dashboard.</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Search & Filter</strong> — Use the search bar to find users by email. Filter by role (Admin, User, User Manager, Flow Manager, Feedback Manager), user type (SE, AE, Partner, Other), or login status (Active, Never Logged In).</li>
          <li><strong>Edit User</strong> — Click the <span className="text-blue-600">edit icon</span> on any user row to change their email address. Use the dropdowns to change their role or user type.</li>
          <li><strong>Delete User</strong> — Click the <span className="text-red-600">trash icon</span> to permanently remove a user. This cannot be undone.</li>
          <li><strong>Copy Onboarding/Reset Link</strong> — Click the <Link2 className="inline w-3.5 h-3.5 text-purple-600" /> icon to generate a secure password-setup link and copy it to your clipboard. Share this link with the user via Teams or Slack. This also flags the user for a forced password reset — if the link expires unused, they'll still be required to set a new password on their next login.</li>
          <li><strong>Export Users</strong> — Click <Download className="inline w-3.5 h-3.5" /> to download the full user list as a CSV file.</li>
          <li><strong>Import CSV</strong> — Click <Upload className="inline w-3.5 h-3.5" /> to bulk-import users from a CSV file. Download the template first to see the required format (email, role, userType).</li>
          <li><strong>Statistics Dashboard</strong> — View quick metrics: Total Users, Admins, Active Users, and Never Logged In counts.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "add-user",
    icon: UserPlus,
    title: "Add User",
    content: (
      <div className="space-y-3 text-sm text-slate-700">
        <p>Create new user accounts individually.</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Single User</strong> — Enter an email, select a role and user type, then click "Add User." The account is created immediately.</li>
          <li><strong>Send Onboarding Link</strong> — After creating the user, go to the <strong>Manage Users</strong> tab and click the <Link2 className="inline w-3.5 h-3.5 text-purple-600" /> icon to generate a fresh onboarding link. The link expires in <strong>1 hour</strong>, so send it right away via Teams or Slack.</li>
          <li><strong>Safety Net</strong> — The user's profile is also flagged for a forced password reset (48-hour window). If the link expires, the user will still be required to set a new password on their next login.</li>
          <li><strong>Onboarding Flow</strong> — When the new user clicks the link (or logs in), they are guided through a mandatory onboarding sequence: first they must set a new password, then they must configure two security challenge questions.</li>
          <li><strong>Duplicate Check</strong> — The system warns you if a user with that email already exists.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "access-requests",
    icon: ClipboardList,
    title: "Access Requests",
    content: (
      <div className="space-y-3 text-sm text-slate-700">
        <p>Review and act on self-service access requests submitted from the login page.</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Approve</strong> — Approving a request automatically creates the user account. No link is generated at this point.</li>
          <li><strong>Send Onboarding Link</strong> — After approving, go to the <strong>Manage Users</strong> tab and click the <Link2 className="inline w-3.5 h-3.5 text-purple-600" /> icon to generate a fresh onboarding link (expires in 1 hour). Send it immediately via Teams or Slack.</li>
          <li><strong>Decline</strong> — Declining removes the request. The requester is not notified automatically.</li>
          <li><strong>Pending Badge</strong> — A red notification badge on the tab shows the number of pending requests.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "flow-management",
    icon: Settings,
    title: "Flow Management",
    content: (
      <div className="space-y-3 text-sm text-slate-700">
        <p>Configure the AI agent demos available to users.</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Enable / Disable</strong> — Toggle flows on or off to control which demos are visible to users.</li>
          <li><strong>Edit Details</strong> — Update the name, description, icon, colors, gradient, and avatar for each flow.</li>
          <li><strong>Sort Order</strong> — Change the display order of flows on the home page.</li>
          <li><strong>Coming Soon</strong> — Mark a flow as "Coming Soon" to show it greyed out with a badge.</li>
          <li><strong>WebRTC URL</strong> — Set the voice endpoint URL for flows that support WebRTC calling.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "feedback",
    icon: MessageSquare,
    title: "Feedback",
    content: (
      <div className="space-y-3 text-sm text-slate-700">
        <p>Review user-submitted feedback and ratings for agent demos.</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Status Workflow</strong> — Move feedback through statuses: Pending → In Progress → Resolved or Dismissed.</li>
          <li><strong>Filter</strong> — Filter by status to focus on unresolved items.</li>
          <li><strong>Badge Count</strong> — A purple badge on the tab shows the number of pending feedback items.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "role-management",
    icon: Shield,
    title: "Role Management",
    content: (
      <div className="space-y-3 text-sm text-slate-700">
        <p>Assign granular admin roles to users for delegated administration.</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Available Roles:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>User Manager</strong> — Can manage users, add users, and view audit logs.</li>
              <li><strong>Flow Manager</strong> — Can configure agent demo flows.</li>
              <li><strong>Feedback Manager</strong> — Can review and manage feedback.</li>
            </ul>
          </li>
          <li><strong>Admin Role</strong> — Full admins have access to all tabs. Only admins can access Role Management.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "audit-logs",
    icon: FileText,
    title: "Demo Audit Logs",
    content: (
      <div className="space-y-3 text-sm text-slate-700">
        <p>Track when users start and end demo sessions.</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Logged Data</strong> — Each entry records the user, flow name, start time, end time, and session duration.</li>
          <li><strong>Search & Filter</strong> — Find logs by user or flow name.</li>
          <li><strong>Usage Insights</strong> — Use audit logs to understand which demos are most popular and how long users engage.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "security",
    icon: Lock,
    title: "Security & Authentication",
    content: (
      <div className="space-y-3 text-sm text-slate-700">
        <p>Key security features built into the platform.</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Mandatory Onboarding</strong> — New users must complete two steps before accessing the platform: (1) set a new password to replace the temporary one, then (2) configure two security challenge questions. This is enforced automatically on login.</li>
          <li><strong>Existing Users</strong> — Users created before security questions were implemented will be prompted to set up their challenge questions on their next login. They do not need to reset their password.</li>
          <li><strong>Security Questions</strong> — Used to verify identity before self-service password resets. Users must correctly answer their questions before a reset link is generated.</li>
          <li><strong>Self-Service Password Reset</strong> — Users click "Forgot Password" on the login page, answer their security questions, and are then directed to set a new password. No email is sent — the process is entirely in-app.</li>
          <li><strong>Admin-Initiated Reset</strong> — Admins can generate a reset link from Manage Users (the <Link2 className="inline w-3.5 h-3.5 text-purple-600" /> icon). This bypasses security questions and also flags the user for a forced password reset in case the link expires unused.</li>
          <li><strong>Rate Limiting</strong> — After <strong>5 failed</strong> security question attempts, the account is <strong>locked for 15 minutes</strong>. The user will see the remaining attempts count and lockout duration.</li>
          <li><strong>Account Lockout</strong> — Lockout is automatic and expires on its own — no admin action needed. Successful verification clears all failed attempts.</li>
          <li><strong>Onboarding Links</strong> — Generated on-demand from Manage Users. The OTP in the link expires after <strong>1 hour</strong>, so generate and send it in one go. The user's profile is also flagged for a 48-hour forced password reset as a safety net.</li>
          <li><strong>Session Management</strong> — Sessions are managed automatically. Users are redirected to login when sessions expire.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "tips",
    icon: AlertTriangle,
    title: "Tips & Best Practices",
    content: (
      <div className="space-y-3 text-sm text-slate-700">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Two-Step Onboarding</strong> — Create the user first, then generate the onboarding link from Manage Users when you're ready to send it. This ensures the 1-hour OTP window starts at the right moment.</li>
          <li><strong>Links Expire in 1 Hour</strong> — Generate the link and send it immediately via Teams or Slack. If it expires, just generate a new one.</li>
          <li><strong>Forced Reset Safety Net</strong> — When you generate a link, the system also flags the user for a forced password reset. So even if the link expires, the user will be prompted to change their password on next login.</li>
          <li><strong>Bulk Import Template</strong> — Always download and use the CSV template to avoid format errors during bulk import.</li>
          <li><strong>Role Delegation</strong> — Assign User Manager or Flow Manager roles to trusted team members to distribute admin workload.</li>
          <li><strong>Check Audit Logs</strong> — Regularly review demo logs to identify inactive users or underutilized flows.</li>
          <li><strong>Locked Accounts</strong> — If a user reports being locked out after failed security question attempts, reassure them that the lockout expires automatically after 15 minutes. You can also generate a new reset link from Manage Users to help them get back in (admin resets bypass the security challenge).</li>
        </ul>
      </div>
    ),
  },
];

export const AdminGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Admin Quick Reference Guide</h2>
          <p className="text-sm text-slate-500">Everything you need to know to manage the platform</p>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border border-slate-200 rounded-xl px-4 overflow-hidden bg-white shadow-sm"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-800">{section.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {section.content}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
