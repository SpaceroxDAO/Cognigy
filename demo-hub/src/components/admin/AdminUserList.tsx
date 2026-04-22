import React, { useState, useMemo, useRef } from "react";
import { Clock, Trash2, User, Shield, Edit2, Link2, Loader2, Download, Search, RefreshCw, Upload, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User as AdminUser } from "@/services/admin";
import { USER_TYPES } from "@/constants/userTypes";
import { SYSTEM_ROLES } from "@/services/roleService";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface AdminUserListProps {
  users: AdminUser[];
  onDelete: (email: string) => void;
  onUpdateRole: (email: string, role: string) => void;
  onUpdateUserType: (email: string, userType: string) => void;
  onUpdateEmail?: (oldEmail: string, newEmail: string) => void;
  onBulkImport?: (users: { email: string; role: string; userType: string }[]) => void;
  loading: boolean;
  onRefresh?: () => void;
}

const formatLastLogin = (lastLogin?: string) => {
  if (!lastLogin) return "Never";
  const date = new Date(lastLogin);
  const diffInHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 1) return "Less than an hour ago";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return "Yesterday";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const buildResetUrl = (otp: string, email: string) => {
  const base = window.location.origin;
  return `${base}/reset-password?token=${encodeURIComponent(otp)}&email=${encodeURIComponent(email)}`;
};

export const AdminUserList = ({ users, onDelete, onUpdateRole, onUpdateUserType, onUpdateEmail, onBulkImport, loading, onRefresh }: AdminUserListProps) => {
  const [editEmailTarget, setEditEmailTarget] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [sendingReset, setSendingReset] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLogin, setFilterLogin] = useState<string>("all");
  const [importing, setImporting] = useState(false);
  const csvImportRef = useRef<HTMLInputElement>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !searchQuery || u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === "all" || u.role === filterRole;
      const matchesType = filterType === "all" || u.userType === filterType;
      const matchesLogin = filterLogin === "all" || (filterLogin === "never" ? !u.lastLogin : !!u.lastLogin);
      return matchesSearch && matchesRole && matchesType && matchesLogin;
    });
  }, [users, searchQuery, filterRole, filterType, filterLogin]);

  const exportCSV = () => {
    const headers = ["email", "role", "userType", "lastLogin"];
    const rows = users.map(u => [u.email, u.role, u.userType, u.lastLogin || ""].map(v => `"${v}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${users.length} users to CSV`);
  };

  const downloadTemplate = () => {
    const template = "email,role,userType\njohn@example.com,user,SE\njane@example.com,admin,AE\n";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { toast.error("Please upload a CSV file"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { toast.error("CSV must have a header row and at least one data row"); return; }

      const headerLine = lines[0].toLowerCase();
      const headers = headerLine.split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      const emailIdx = headers.indexOf("email");
      const roleIdx = headers.indexOf("role");
      const typeIdx = headers.indexOf("usertype");

      if (emailIdx === -1) {
        toast.error("CSV must have an 'email' column");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validRoles = SYSTEM_ROLES.map(r => r.name);
      const validTypes = USER_TYPES.map(t => t.value);
      const importUsers: { email: string; role: string; userType: string }[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        const email = cols[emailIdx] || "";
        const role = roleIdx !== -1 ? (cols[roleIdx] || "user") : "user";
        const userType = typeIdx !== -1 ? (cols[typeIdx] || "Other") : "Other";

        if (!emailRegex.test(email)) { errors.push(`Row ${i + 1}: invalid email "${email}"`); continue; }
        if (!validRoles.includes(role)) { errors.push(`Row ${i + 1}: invalid role "${role}"`); continue; }
        if (!(validTypes as string[]).includes(userType)) { errors.push(`Row ${i + 1}: invalid userType "${userType}"`); continue; }
        importUsers.push({ email, role, userType });
      }

      if (errors.length > 0) {
        toast.error(`${errors.length} row(s) skipped`, { description: errors.slice(0, 3).join("; ") + (errors.length > 3 ? `... and ${errors.length - 3} more` : "") });
      }

      if (importUsers.length === 0) { toast.error("No valid users to import"); return; }

      if (onBulkImport) {
        setImporting(true);
        try {
          await onBulkImport(importUsers);
          toast.success(`Imported ${importUsers.length} user(s)`);
        } catch (err: any) {
          toast.error(err.message || "Import failed");
        } finally {
          setImporting(false);
        }
      }
    };
    reader.readAsText(file);
    if (csvImportRef.current) csvImportRef.current.value = "";
  };

  const handleCopyResetLink = async (email: string) => {
    setSendingReset(email);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-reset-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email, adminMode: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate link");
      if (data.otp) {
        await navigator.clipboard.writeText(buildResetUrl(data.otp, email));
        toast.success(`Reset link for ${email} copied to clipboard — expires in 1 hour. Send it now!`);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate reset link");
    } finally {
      setSendingReset(null);
    }
  };

  const handleEditEmail = () => {
    if (!editEmailTarget || !newEmail) return;
    onUpdateEmail?.(editEmailTarget, newEmail);
    setEditEmailTarget(null);
    setNewEmail("");
  };




  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const t = user.userType || "Other";
    if (!acc[t]) acc[t] = [];
    acc[t].push(user);
    return acc;
  }, {} as Record<string, AdminUser[]>);

  const sortedGroups = USER_TYPES.map(type => ({
    type: type.value, label: type.label, users: groupedUsers[type.value] || [],
  })).filter(g => g.users.length > 0);

  if (loading) return <div className="flex justify-center items-center h-32"><Loading variant="default" size="md" text="Loading users..." /></div>;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{users.length}</p>
          <p className="text-xs text-blue-600 font-medium">Total Users</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{users.filter(u => u.role === 'admin').length}</p>
          <p className="text-xs text-green-600 font-medium">Admins</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <p className="text-2xl font-bold text-purple-700">{users.filter(u => u.lastLogin).length}</p>
          <p className="text-xs text-purple-600 font-medium">Active Users</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <p className="text-2xl font-bold text-amber-700">{users.filter(u => !u.lastLogin).length}</p>
          <p className="text-xs text-amber-600 font-medium">Never Logged In</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {SYSTEM_ROLES.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {USER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLogin} onValueChange={setFilterLogin}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Login Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="never">Never Logged In</SelectItem>
            <SelectItem value="active">Has Logged In</SelectItem>
          </SelectContent>
        </Select>
        <input type="file" accept=".csv" ref={csvImportRef} onChange={handleImportCSV} className="hidden" />
        <Button variant="outline" size="sm" onClick={() => csvImportRef.current?.click()} disabled={importing || !onBulkImport} title="Import users from CSV">
          {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}Import CSV
        </Button>
        <Button variant="outline" size="sm" onClick={downloadTemplate} title="Download CSV import template">
          <FileDown className="w-4 h-4 mr-2" />Template
        </Button>
        <Button variant="outline" size="sm" onClick={exportCSV} title="Export all users as CSV">
          <Download className="w-4 h-4 mr-2" />Export CSV
        </Button>
        {onRefresh && (
          <Button variant="outline" size="icon" onClick={onRefresh} title="Refresh users">
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {filteredUsers.length !== users.length && (
        <p className="text-sm text-slate-500">Showing {filteredUsers.length} of {users.length} users</p>
      )}


      {sortedGroups.map((group) => (
        <div key={group.type} className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="p-2 bg-blue-100 rounded-lg"><User className="w-5 h-5 text-blue-600" /></div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{group.label}</h3>
              <span className="text-sm text-slate-500">{group.users.length} users</span>
            </div>
          </div>
          <div className="space-y-2">
            {group.users.map((user) => (
              <div key={user.email} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{user.email}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatLastLogin(user.lastLogin)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-11">
                    <Shield className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-slate-600">{user.role}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <Select defaultValue={user.role} onValueChange={(v) => onUpdateRole(user.email, v)}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SYSTEM_ROLES.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select defaultValue={user.userType} onValueChange={(v) => onUpdateUserType(user.email, v)}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {USER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.value}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  {/* Edit Email */}
                  <Dialog open={editEmailTarget === user.email} onOpenChange={(open) => { if (!open) { setEditEmailTarget(null); setNewEmail(""); } }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => { setEditEmailTarget(user.email); setNewEmail(user.email); }} className="text-blue-600 hover:text-blue-700" title="Edit Email">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Email Address</DialogTitle>
                        <DialogDescription>Update the email address for this user.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label>New Email</Label>
                        <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@example.com" />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditEmailTarget(null)}>Cancel</Button>
                        <Button disabled={!newEmail || newEmail === editEmailTarget} onClick={handleEditEmail}>
                          Update Email
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>




                  {/* Copy Reset Link (share via Slack/Teams) */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyResetLink(user.email)}
                    disabled={sendingReset === user.email}
                    className="text-purple-600 hover:text-purple-700"
                    title="Copy Onboarding/Reset Link (share via Slack/Teams)"
                  >
                    {sendingReset === user.email ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  </Button>

                  {/* Delete */}
                  <Button variant="outline" size="icon" onClick={() => onDelete(user.email)} className="text-red-600 hover:text-red-700" title="Delete User">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {sortedGroups.length === 0 && (
        <div className="text-center py-16 text-slate-500">No users found.</div>
      )}
    </div>
  );
};
