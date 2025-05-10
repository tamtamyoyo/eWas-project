import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TeamMember } from "@shared/schema";

// Type definitions for the frontend
export interface TeamMemberFormData {
  inviteEmail: string;
  role: string;
  permissions?: Record<string, any>;
  memberId?: number;
}

export interface TeamInvitation {
  id: number;
  ownerId: number;
  inviteEmail: string;
  role: string;
  status: string;
  inviteToken: string;
  expiresAt: string | null;
  createdAt: string;
}

// Custom hook for team members functionality
export function useTeamMembers() {
  // Get team members (where the current user is the owner)
  const getTeamMembers = () => {
    return useQuery<TeamMember[]>({
      queryKey: ["/api/team-members"],
      staleTime: 30000, // 30 seconds
    });
  };

  // Get team memberships (where the current user is a member)
  const getTeamMemberships = () => {
    return useQuery<TeamMember[]>({
      queryKey: ["/api/team-memberships"],
      staleTime: 30000, 
    });
  };

  // Get a specific team member
  const getTeamMember = (id: number) => {
    return useQuery<TeamMember>({
      queryKey: ["/api/team-members", id],
      enabled: !!id,
    });
  };

  // Invite a new team member
  const inviteTeamMember = () => {
    return useMutation<TeamMember, Error, TeamMemberFormData>({
      mutationFn: async (data: TeamMemberFormData) => {
        const response = await apiRequest("POST", "/api/team-members", data);
        const result = await response.json();
        return result;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      }
    });
  };

  // Update team member
  const updateTeamMember = () => {
    return useMutation<TeamMember, Error, { id: number; data: Partial<TeamMember> }>({
      mutationFn: async ({ id, data }) => {
        const response = await apiRequest("PUT", `/api/team-members/${id}`, data);
        const result = await response.json();
        return result;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
        queryClient.invalidateQueries({ queryKey: ["/api/team-members", variables.id] });
      }
    });
  };

  // Delete team member
  const deleteTeamMember = () => {
    return useMutation<{ message: string }, Error, number>({
      mutationFn: async (id: number) => {
        const response = await apiRequest("DELETE", `/api/team-members/${id}`);
        const result = await response.json();
        return result;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      }
    });
  };

  // Accept team invitation
  const acceptInvitation = () => {
    return useMutation<TeamMember, Error, string>({
      mutationFn: async (token: string) => {
        const response = await apiRequest("POST", `/api/team-invitations/${token}/accept`);
        const result = await response.json();
        return result;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/team-memberships"] });
      }
    });
  };

  // Decline team invitation
  const declineInvitation = () => {
    return useMutation<TeamMember, Error, string>({
      mutationFn: async (token: string) => {
        const response = await apiRequest("POST", `/api/team-invitations/${token}/decline`);
        const result = await response.json();
        return result;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/team-memberships"] });
      }
    });
  };

  // Resend invitation
  const resendInvitation = () => {
    return useMutation<TeamMember, Error, number>({
      mutationFn: async (id: number) => {
        const response = await apiRequest("POST", `/api/team-members/${id}/resend-invitation`);
        const result = await response.json();
        return result;
      },
      onSuccess: (_, id) => {
        queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
        queryClient.invalidateQueries({ queryKey: ["/api/team-members", id] });
      }
    });
  };

  return {
    getTeamMembers,
    getTeamMemberships,
    getTeamMember,
    inviteTeamMember,
    updateTeamMember,
    deleteTeamMember,
    acceptInvitation,
    declineInvitation,
    resendInvitation
  };
}
