
import React from "react";
import { VM } from "@/services/api";
import VMCard from "../vm/VMCard";
import { Skeleton } from "@/components/ui/skeleton";

interface VMListProps {
  vms: VM[];
  loading: boolean;
}

const VMList: React.FC<VMListProps> = ({ vms, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vms.length === 0 ? (
        <p className="text-muted-foreground col-span-full text-center py-8">
          No virtual machines available for your account.
        </p>
      ) : (
        vms.map((vm) => <VMCard key={vm.id} vm={vm} />)
      )}
    </div>
  );
};

export default VMList;
