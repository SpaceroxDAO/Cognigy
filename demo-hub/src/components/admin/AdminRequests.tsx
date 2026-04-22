import React from "react";
import { Button } from "@/components/ui/button";
import { Key, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AccessRequest } from "@/services/request";
import { getUserTypeLabel, isValidUserType } from "@/constants/userTypes";

interface AdminRequestsProps {
  requests: AccessRequest[];
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
}

export const AdminRequests: React.FC<AdminRequestsProps> = ({ requests, onApprove, onDecline }) => (
  <div>
    <div className="flex items-center gap-3 mb-6">
      <Key className="w-6 h-6 text-blue-600" />
      <h3 className="text-2xl font-bold text-slate-900">Access Requests</h3>
      {requests.filter(r => r.status === 'pending').length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full">
          {requests.filter(r => r.status === 'pending').length} pending
        </div>
      )}
    </div>

    {requests.length === 0 ? (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
          <Clock className="w-12 h-12 text-slate-400" />
        </div>
        <h4 className="text-xl font-bold text-slate-600 mb-2">No Pending Requests</h4>
        <p className="text-slate-500 max-w-md mx-auto">All access requests have been processed.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="p-6 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50 rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${req.status === 'pending' ? 'bg-orange-400 animate-pulse' : req.status === 'approved' ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="font-bold text-lg text-slate-900">{req.email}</span>
                {req.user_type && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    {isValidUserType(req.user_type) ? getUserTypeLabel(req.user_type) : req.user_type}
                  </span>
                )}
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  req.status === 'pending' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  req.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                  'bg-red-100 text-red-700 border-red-200'
                }`}>
                  {req.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Requested on {new Date(req.created_at).toLocaleDateString()}</span>
                <span>at {new Date(req.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
            {req.status === 'pending' && (
              <div className="flex gap-3 ml-6">
                <Button size="sm" onClick={() => onApprove(req.id)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-6">
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 font-bold px-6">
                      <XCircle className="w-4 h-4 mr-2" /> Decline
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Decline Access Request?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will decline the request for <span className="font-semibold">{req.email}</span>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDecline(req.id)}
                        className="bg-red-600 hover:bg-red-700 text-white">
                        Yes, Decline
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);
