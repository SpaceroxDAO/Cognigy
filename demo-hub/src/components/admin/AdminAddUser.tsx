import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { USER_TYPES, DEFAULT_USER_TYPE } from "@/constants/userTypes";

interface AdminAddUserProps {
  onAdd: (email: string, role: string, userType: string) => void;
  existingUsers: string[];
}

export const AdminAddUser = ({ onAdd, existingUsers }: AdminAddUserProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [userType, setUserType] = useState<string>(DEFAULT_USER_TYPE);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter an email address"); return; }
    if (existingUsers.includes(email)) { setError("User already exists"); return; }
    onAdd(email, role, userType);
    setEmail(""); setRole("user"); setUserType(DEFAULT_USER_TYPE);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left flex flex-col items-start w-full">
      <div className="space-y-2 w-full">
        <label className="text-sm font-medium block">Email</label>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" className="w-full" />
      </div>
      <div className="space-y-2 w-full">
        <label className="text-sm font-medium block">Role</label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="feedback-manager">Feedback Manager</SelectItem>
            <SelectItem value="user-manager">User Manager</SelectItem>
            <SelectItem value="flow-manager">Flow Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 w-full">
        <label className="text-sm font-medium block">User Type</label>
        <Select value={userType} onValueChange={setUserType}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {USER_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 w-full">
        <p className="text-sm text-amber-800">
          A temporary password will be generated (valid for 48 hours). Share it with the user via Teams or Slack — they'll be required to set a new password on first login.
        </p>
      </div>
      {error && <div className="text-destructive text-sm">{error}</div>}
      <Button type="submit" className="w-full"><UserPlus className="w-4 h-4 mr-2" />Add User</Button>
    </form>
  );
};
