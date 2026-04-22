import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Bot, Plus, Edit, Trash2, Eye, EyeOff, Save, X, ExternalLink, Clock } from 'lucide-react';
import { adminService, FlowConfig } from '@/services/admin';
import { useFlows } from '@/contexts/FlowContext';
import Loading from '@/components/ui/loading';

export const AdminFlowManager = () => {
  const { refreshFlows } = useFlows();
  const [flows, setFlows] = useState<FlowConfig[]>([]);
  const [editingFlow, setEditingFlow] = useState<FlowConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadFlows(); }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const data = await adminService.getFlows();
      setFlows(data);
    } catch (e: any) {
      toast.error('Failed to load flows');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingFlow) return;
    try {
      setSaving(true);
      const { id, ...updates } = editingFlow;
      await adminService.updateFlow(id, updates);
      toast.success('Flow updated');
      await loadFlows();
      await refreshFlows();
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save flow');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (flow: FlowConfig, field: 'enabled' | 'coming_soon', value: boolean) => {
    try {
      await adminService.updateFlow(flow.id, { [field]: value });
      toast.success(`${flow.name} ${field === 'enabled' ? (value ? 'enabled' : 'disabled') : (value ? 'marked coming soon' : 'unmarked')}`);
      await loadFlows();
      await refreshFlows();
    } catch (e: any) {
      toast.error('Failed to update flow');
    }
  };

  if (loading) return <Loading variant="default" size="md" text="Loading flows..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-slate-900">Flow Management</h3>
          <Badge variant="secondary">{flows.length} flows</Badge>
        </div>
      </div>

      <div className="space-y-4">
        {flows.map((flow) => (
          <div key={flow.id} className="p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-2xl ${flow.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">{flow.name}</span>
                    <span className="text-xs text-slate-500 font-mono">{flow.path}</span>
                    {flow.enabled && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Active</Badge>}
                    {flow.coming_soon && <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs"><Clock className="w-3 h-3 mr-1" />Coming Soon</Badge>}
                  </div>
                  <p className="text-sm text-slate-500 truncate">{flow.description}</p>
                  {flow.webrtc_url && (
                    <div className="flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-400 truncate max-w-xs">{flow.webrtc_url}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-600">Enabled</Label>
                  <Switch checked={flow.enabled} onCheckedChange={v => handleToggle(flow, 'enabled', v)} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-600">Coming Soon</Label>
                  <Switch checked={flow.coming_soon} onCheckedChange={v => handleToggle(flow, 'coming_soon', v)} />
                </div>
                <Dialog open={isDialogOpen && editingFlow?.id === flow.id} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); setEditingFlow(null); } }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => { setEditingFlow({ ...flow }); setIsDialogOpen(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Edit {editingFlow?.name}</DialogTitle></DialogHeader>
                    {editingFlow && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div><Label>Name</Label><Input value={editingFlow.name} onChange={e => setEditingFlow({ ...editingFlow, name: e.target.value })} /></div>
                          <div><Label>Path</Label><Input value={editingFlow.path} onChange={e => setEditingFlow({ ...editingFlow, path: e.target.value })} /></div>
                        </div>
                        <div><Label>Description</Label><Textarea value={editingFlow.description} onChange={e => setEditingFlow({ ...editingFlow, description: e.target.value })} /></div>
                        <div><Label>WebRTC URL</Label><Input value={editingFlow.webrtc_url || ''} onChange={e => setEditingFlow({ ...editingFlow, webrtc_url: e.target.value })} placeholder="https://..." /></div>
                        <div><Label>Avatar Path</Label><Input value={editingFlow.avatar || ''} onChange={e => setEditingFlow({ ...editingFlow, avatar: e.target.value })} placeholder="/avatar-name.png" /></div>
                        <div><Label>Gradient CSS</Label><Input value={editingFlow.gradient} onChange={e => setEditingFlow({ ...editingFlow, gradient: e.target.value })} /></div>
                        <div><Label>Sort Order</Label><Input type="number" value={editingFlow.sort_order} onChange={e => setEditingFlow({ ...editingFlow, sort_order: parseInt(e.target.value) || 0 })} /></div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2"><Switch checked={editingFlow.enabled} onCheckedChange={v => setEditingFlow({ ...editingFlow, enabled: v })} /><Label>Enabled</Label></div>
                          <div className="flex items-center gap-2"><Switch checked={editingFlow.coming_soon} onCheckedChange={v => setEditingFlow({ ...editingFlow, coming_soon: v })} /><Label>Coming Soon</Label></div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingFlow(null); }}><X className="w-4 h-4 mr-2" />Cancel</Button>
                          <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Changes'}</Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
