import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Shield, User } from 'lucide-react';
import { SYSTEM_ROLES } from '@/services/roleService';
import { adminService } from '@/services/admin';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  user: 'bg-green-100 text-green-700',
  'feedback-manager': 'bg-purple-100 text-purple-700',
  'user-manager': 'bg-blue-100 text-blue-700',
  'flow-manager': 'bg-orange-100 text-orange-700',
};

export const AdminRoleManager: React.FC = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userEmailMap, setUserEmailMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const [rolesRes, users] = await Promise.all([
        supabase.from('user_roles').select('*').order('role'),
        adminService.listUsers(),
      ]);
      if (rolesRes.error) throw rolesRes.error;
      setUserRoles(rolesRes.data || []);
      const emailMap: Record<string, string> = {};
      users.forEach(u => { emailMap[u.id] = u.email; });
      setUserEmailMap(emailMap);
    } catch {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); }, []);

  const updateRole = async (id: string, userId: string, newRole: string) => {
    try {
      await supabase.from('user_roles').delete().eq('id', id);
      await supabase.from('user_roles').insert([{ user_id: userId, role: newRole as any }]);
      toast.success('Role updated');
      await loadRoles();
    } catch {
      toast.error('Failed to update role');
    }
  };

  // Group by user
  const byUser = userRoles.reduce((acc, r) => {
    if (!acc[r.user_id]) acc[r.user_id] = [];
    acc[r.user_id].push(r);
    return acc;
  }, {} as Record<string, UserRole[]>);

  const roleCounts = SYSTEM_ROLES.map(r => ({
    name: r.name,
    count: userRoles.filter(ur => ur.role === r.name).length,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-slate-900">Role Management</h3>
        </div>
        <Button variant="outline" size="sm" onClick={loadRoles} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {/* Role summary */}
      <TooltipProvider>
        <div className="flex flex-wrap gap-3 mb-6">
          {roleCounts.map(r => {
            const roleInfo = SYSTEM_ROLES.find(sr => sr.name === r.name);
            return (
              <Tooltip key={r.name}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl cursor-help hover:border-slate-300 hover:shadow-sm transition-all">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS[r.name] || 'bg-slate-100 text-slate-700'}`}>{r.name}</span>
                    <span className="font-bold text-slate-900">{r.count}</span>
                    <span className="text-xs text-slate-500">users</span>
                  </div>
                </TooltipTrigger>
                {roleInfo?.description && (
                  <TooltipContent side="bottom" className="max-w-xs text-center">
                    <p>{roleInfo.description}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><User className="w-4 h-4 inline mr-1" />Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(byUser).length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-12 text-slate-500">No roles found</TableCell></TableRow>
              ) : Object.entries(byUser).map(([userId, roles]) => (
                <TableRow key={userId}>
                  <TableCell>
                    <span className="text-sm text-slate-700">
                      {userEmailMap[userId] || <span className="text-xs font-mono text-slate-400">{userId.slice(0, 16)}...</span>}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {roles.map(r => (
                        <span key={r.id} className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS[r.role] || 'bg-slate-100 text-slate-700'}`}>
                          {r.role}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {roles.map(r => (
                        <div key={r.id} className="flex items-center gap-1">
                          <Select defaultValue={r.role} onValueChange={v => updateRole(r.id, userId, v)}>
                            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SYSTEM_ROLES.map(sr => <SelectItem key={sr.name} value={sr.name} className="text-xs">{sr.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
