
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import UsersList from "./UsersList";
import AddUserDialog from "./AddUserDialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  
  // Only admin can access users page
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage user access to the Proxmox management portal.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <UsersList />
      <AddUserDialog open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default UsersPage;
