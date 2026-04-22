import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Copy, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export interface BulkImportResult {
  email: string;
  role: string;
  userType: string;
  status: 'created' | 'skipped' | 'error';
  tempPassword?: string;
  resetLink?: string;
  error?: string;
}

interface BulkImportResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: BulkImportResult[];
  summary: { total: number; created: number; skipped: number; errors: number };
}

export const BulkImportResultsDialog = ({ open, onOpenChange, results, summary }: BulkImportResultsDialogProps) => {
  const createdResults = results.filter(r => r.status === 'created');

  const downloadResultsCSV = () => {
    const headers = ['email', 'role', 'userType', 'status', 'tempPassword', 'resetLink', 'error'];
    const rows = results.map(r =>
      [r.email, r.role, r.userType, r.status, r.tempPassword || '', r.resetLink || '', r.error || '']
        .map(v => `"${v.replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-import-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Results CSV downloaded');
  };

  const copyAll = () => {
    const lines = createdResults.map(r =>
      `${r.email}\t${r.tempPassword || ''}\t${r.resetLink || ''}`
    );
    navigator.clipboard.writeText(['Email\tTemp Password\tReset Link', ...lines].join('\n'));
    toast.success(`Copied ${createdResults.length} user credentials to clipboard`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Results</DialogTitle>
          <DialogDescription>
            {summary.total} users processed
          </DialogDescription>
        </DialogHeader>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-lg font-bold text-green-700">{summary.created}</p>
              <p className="text-xs text-green-600">Created</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-lg font-bold text-amber-700">{summary.skipped}</p>
              <p className="text-xs text-amber-600">Skipped</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-lg font-bold text-red-700">{summary.errors}</p>
              <p className="text-xs text-red-600">Errors</p>
            </div>
          </div>
        </div>

        {/* Results table */}
        {results.length > 0 && (
          <div className="border rounded-lg overflow-auto max-h-[40vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Temp Password</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{r.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.status === 'created' ? 'bg-green-100 text-green-700' :
                        r.status === 'skipped' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.tempPassword || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.error || (r.resetLink ? 'Link generated' : '—')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {createdResults.length > 0 && (
            <>
              <Button variant="outline" onClick={copyAll}>
                <Copy className="w-4 h-4 mr-2" /> Copy All
              </Button>
              <Button onClick={downloadResultsCSV}>
                <Download className="w-4 h-4 mr-2" /> Download Results CSV
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
