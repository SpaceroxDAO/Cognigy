import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { AdminUserList } from '@/components/admin/AdminUserList';
import { AdminAddUser } from '@/components/admin/AdminAddUser';
import { AdminRequests } from '@/components/admin/AdminRequests';
import { AdminFlowManager } from '@/components/admin/AdminFlowManager';
import { AdminFeedback } from '@/components/admin/AdminFeedback';
import { AdminRoleManager } from '@/components/admin/AdminRoleManager';
import { AdminDemoLogs } from '@/components/admin/AdminDemoLogs';
import { AdminGuide } from '@/components/admin/AdminGuide';
import { AdminAccessLogs } from '@/components/admin/AdminAccessLogs';
import { BulkImportResultsDialog, BulkImportResult } from '@/components/admin/BulkImportResultsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { adminService, User } from '@/services/admin';
import { requestService, AccessRequest } from '@/services/request';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Sparkles } from 'lucide-react';
import Loading from '@/components/ui/loading';

type TabKey = "manage" | "add" | "requests" | "flows" | "feedback" | "roles" | "audit" | "access-logs" | "guide";

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, hasRole, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<TabKey>("manage");
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  
  const [bulkResults, setBulkResults] = useState<{ results: BulkImportResult[]; summary: { total: number; created: number; skipped: number; errors: number } } | null>(null);

  const hasAccess = isAdmin || hasRole('user-manager') || hasRole('flow-manager') || hasRole('feedback-manager');

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
    if (!authLoading && user && !hasAccess) navigate('/', { replace: true });
  }, [user, authLoading, hasAccess, navigate]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin && !hasRole('user-manager')) return;
    try {
      setUsersLoading(true);
      const data = await adminService.listUsers();
      setUsers(data);
    } catch (e: any) {
      toast.error('Failed to load users: ' + e.message);
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin, hasRole]);

  const loadRequests = useCallback(async () => {
    try {
      const data = await requestService.getPendingRequests();
      console.log('[Admin] Loaded access requests:', data?.length);
      setRequests(data);
    } catch (e: any) {
      console.error('[Admin] Failed to load access requests:', e.message);
    }
  }, []);

  const loadFeedbackCount = useCallback(async () => {
    const { count } = await supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    setFeedbackCount(count || 0);
  }, []);

  useEffect(() => {
    if (user && hasAccess) {
      loadUsers();
      loadRequests();
      loadFeedbackCount();
    }
  }, [user, hasAccess, loadUsers, loadRequests, loadFeedbackCount]);

  const handleAddUser = async (email: string, role: string, userType: string) => {
    try {
      const tempPassword = crypto.randomUUID().slice(0, 12) + 'Aa1!';
      await adminService.addUser(email, tempPassword, role, userType);
      await loadUsers();

      toast.success(`User ${email} created. Go to Manage Users to copy their onboarding link when ready to send.`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to add user');
    }
  };


  const handleBulkImport = async (importUsers: { email: string; role: string; userType: string }[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/bulk-import-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ users: importUsers, origin: window.location.origin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk import failed');

      setBulkResults({ results: data.results, summary: data.summary });
      toast.success(`Import complete: ${data.summary.created} created, ${data.summary.skipped} skipped, ${data.summary.errors} errors`);
      await loadUsers();
    } catch (e: any) {
      toast.error(e.message || 'Bulk import failed');
    }
  };

  const handleDeleteUser = async (email: string) => {
    try {
      await adminService.deleteUser(email);
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u.email !== email));
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete user');
    }
  };


  const handleUpdateRole = async (email: string, role: string) => {
    try {
      await adminService.updateRole(email, role);
      toast.success('Role updated');
      setUsers(prev => prev.map(u => u.email === email ? { ...u, role } : u));
    } catch (e: any) {
      toast.error(e.message || 'Failed to update role');
    }
  };

  const handleUpdateEmail = async (oldEmail: string, newEmail: string) => {
    try {
      await adminService.updateEmail(oldEmail, newEmail);
      toast.success('Email updated');
      setUsers(prev => prev.map(u => u.email === oldEmail ? { ...u, email: newEmail } : u));
    } catch (e: any) {
      toast.error(e.message || 'Failed to update email');
    }
  };

  const handleUpdateUserType = async (email: string, userType: string) => {
    try {
      await adminService.updateUserType(email, userType);
      toast.success('User type updated');
      setUsers(prev => prev.map(u => u.email === email ? { ...u, userType } : u));
    } catch (e: any) {
      toast.error(e.message || 'Failed to update user type');
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      const request = requests.find(r => r.id === id);
      if (!request) throw new Error('Request not found');

      // 1. Approve the request
      await requestService.approveRequest(id);

      // 2. Auto-create the user account
      let userCreated = false;
      try {
        await adminService.addUser(request.email, crypto.randomUUID() + 'Aa1!', 'user', request.user_type || 'Other');
        userCreated = true;
        await loadUsers();
      } catch (createErr: any) {
        if (createErr.message?.includes('already been registered') || createErr.message?.includes('already exists')) {
          userCreated = true; // already exists, still generate link
        } else {
          toast.warning(`Request approved, but account creation failed: ${createErr.message}. You may need to add the user manually.`);
        }
      }

      if (userCreated) {
        toast.success(`Request approved & account created for ${request.email}. Go to Manage Users to copy their onboarding link when ready to send.`);
      }

      await loadRequests();
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve request');
    }
  };

  const handleDeclineRequest = async (id: string) => {
    try {
      await requestService.declineRequest(id);
      toast.success('Request declined');
      await loadRequests();
    } catch {
      toast.error('Failed to decline request');
    }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Navigation />
      <div className="flex items-center justify-center min-h-screen">
        <Loading variant="fullscreen" size="xl" text="Loading admin panel..." />
      </div>
    </div>
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Navigation />
      <div className="pt-28 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Admin Panel</h1>
              <p className="text-slate-500 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> NiCE | COGNiGY AI Specialist Hub
              </p>
            </div>
          </div>

          {/* Tabs */}
          <AdminTabs tab={tab} setTab={setTab} pendingCount={pendingCount} feedbackCount={feedbackCount} />

          {/* Content */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-8">
            {tab === 'manage' && (
              <AdminUserList
                users={users}
                onDelete={handleDeleteUser}
                onUpdateRole={handleUpdateRole}
                onUpdateUserType={handleUpdateUserType}
                onUpdateEmail={handleUpdateEmail}
                onBulkImport={handleBulkImport}
                loading={usersLoading}
                onRefresh={loadUsers}
              />
            )}
            {tab === 'add' && (
              <AdminAddUser
                onAdd={handleAddUser}
                existingUsers={users.map(u => u.email)}
              />
            )}
            {tab === 'requests' && (
              <AdminRequests
                requests={requests}
                onApprove={handleApproveRequest}
                onDecline={handleDeclineRequest}
              />
            )}
            {tab === 'flows' && <AdminFlowManager />}
            {tab === 'feedback' && <AdminFeedback />}
            {tab === 'roles' && <AdminRoleManager />}
            {tab === 'audit' && <AdminDemoLogs />}
            {tab === 'access-logs' && <AdminAccessLogs />}
            {tab === 'guide' && <AdminGuide />}
          </div>
        </div>
      </div>


      {/* Bulk Import Results Dialog */}
      <BulkImportResultsDialog
        open={!!bulkResults}
        onOpenChange={(open) => { if (!open) setBulkResults(null); }}
        results={bulkResults?.results || []}
        summary={bulkResults?.summary || { total: 0, created: 0, skipped: 0, errors: 0 }}
      />
    </div>
  );
};

export default Admin;
