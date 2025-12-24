import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { userApi } from "../api/user";

export const useUserRole = () => {
  const queryClient = useQueryClient();
  const hasSyncedDesiredRoleRef = useRef(false);
  const { isSignedIn } = useUser();

  // Only fetch user role if signed in
  const roleQuery = useQuery({
    queryKey: ["user", "me"],
    queryFn: userApi.getMe,
    enabled: !!isSignedIn, // Only run query if user is signed in
    retry: false, // Don't retry on auth errors
    refetchOnWindowFocus: false, // Don't refetch on window focus
    staleTime: Infinity, // Don't consider data stale
  });

  const updateRoleMutation = useMutation({
    mutationKey: ["user", "updateRole"],
    mutationFn: userApi.updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });

  const role = roleQuery.data?.user?.role || null;

  // On login after choosing a role on the Home page,
  // sync the desiredRole from localStorage into the backend.
  // This will update the role even if user already has one (allows role switching).
  useEffect(() => {
    if (!roleQuery.isSuccess) return;
    if (updateRoleMutation.isPending) return;
    if (hasSyncedDesiredRoleRef.current) return;

    let desiredRole = null;
    try {
      desiredRole = localStorage.getItem("desiredRole");
    } catch {
      // ignore storage errors
    }

    if (!desiredRole || !["host", "participant"].includes(desiredRole)) {
      return;
    }

    // Only update if the desired role is different from current role
    if (role === desiredRole) {
      // Role already matches, just clear localStorage
      try {
        localStorage.removeItem("desiredRole");
      } catch {
        // ignore
      }
      hasSyncedDesiredRoleRef.current = true;
      return;
    }

    hasSyncedDesiredRoleRef.current = true;

    // Update role to match desiredRole
    updateRoleMutation.mutate(desiredRole, {
      onSuccess: () => {
        try {
          localStorage.removeItem("desiredRole");
        } catch {
          // ignore
        }
      },
    });
  }, [role, roleQuery.isSuccess, updateRoleMutation.isPending]);

  return {
    role,
    roleQuery,
    updateRoleMutation,
  };
};
