import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTeamMembers, type TeamMemberFormData } from "@/hooks/useTeamMembers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { BadgeCheck, Clock, Mail, Trash2, UserPlus, RotateCw, User, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ar } from "date-fns/locale";

// Form validation schema
const inviteFormSchema = z.object({
  inviteEmail: z.string().email({ message: "يرجى إدخال بريد إلكتروني صالح" }),
  role: z.string().min(1, { message: "يرجى اختيار دور" }),
});

export default function TeamManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    getTeamMembers, 
    inviteTeamMember, 
    deleteTeamMember,
    updateTeamMember,
    resendInvitation
  } = useTeamMembers();
  
  const { data: teamMembers, isLoading, error } = getTeamMembers();
  const inviteMutation = inviteTeamMember();
  const deleteMutation = deleteTeamMember();
  const updateRoleMutation = updateTeamMember();
  const resendMutation = resendInvitation();
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  
  // Form setup
  const form = useForm<z.infer<typeof inviteFormSchema>>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      inviteEmail: "",
      role: "editor",
    },
  });

  function onSubmit(values: z.infer<typeof inviteFormSchema>) {
    inviteMutation.mutate(values as TeamMemberFormData, {
      onSuccess: () => {
        setInviteDialogOpen(false);
        form.reset();
        toast({
          title: t("settings.inviteSuccess"),
          description: `${t("settings.inviteEmail")}: ${values.inviteEmail}`,
        });
      },
      onError: (error) => {
        let message = t("settings.inviteError");
        
        // Check for specific error codes
        if (error.message.includes("PLAN_RESTRICTION")) {
          message = t("settings.upgradeForTeamMembers");
        } else if (error.message.includes("MEMBER_LIMIT_REACHED")) {
          message = t("settings.teamMemberLimitReached");
        } else if (error.message.includes("DUPLICATE_INVITE")) {
          message = t("settings.inviteAlreadySent");
        }
        
        toast({
          title: t("settings.inviteError"),
          description: message,
          variant: "destructive",
        });
      },
    });
  }

  function handleDeleteMember(id: number) {
    setSelectedMemberId(id);
    setDeleteDialogOpen(true);
  }

  function confirmDeleteMember() {
    if (selectedMemberId) {
      deleteMutation.mutate(selectedMemberId, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          toast({
            title: t("common.success"),
            description: t("settings.memberRemoved"),
          });
        },
        onError: (error) => {
          toast({
            title: t("common.error"),
            description: error.message,
            variant: "destructive",
          });
        },
      });
    }
  }

  function handleChangeRole(id: number, role: string) {
    updateRoleMutation.mutate({ id, data: { role } }, {
      onSuccess: () => {
        toast({
          title: t("common.success"),
          description: t("settings.roleUpdated"),
        });
      },
      onError: (error) => {
        toast({
          title: t("common.error"),
          description: error.message,
          variant: "destructive",
        });
      },
    });
  }

  function handleResendInvite(id: number) {
    resendMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: t("common.success"),
          description: t("settings.inviteResent"),
        });
      },
      onError: (error) => {
        toast({
          title: t("common.error"),
          description: error.message,
          variant: "destructive",
        });
      },
    });
  }

  // Function to render role badge with appropriate color
  function renderRoleBadge(role: string) {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">{t("settings.roleAdmin")}</Badge>;
      case "editor":
        return <Badge variant="secondary">{t("settings.roleEditor")}</Badge>;
      case "viewer":
        return <Badge variant="outline">{t("settings.roleViewer")}</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  }

  // Function to get initials from name or email
  function getInitials(email: string): string {
    if (!email) return "??";
    // If email contains @ symbol, take first letter before @
    if (email.includes('@')) {
      return email.split('@')[0].charAt(0).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  }

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("settings.teamMembers")}</CardTitle>
          <CardDescription>{t("settings.teamMembersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("settings.teamMembers")}</CardTitle>
          <CardDescription>{t("settings.teamMembersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-red-500">
            {t("errors.generic")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("settings.teamMembers")}</CardTitle>
          <CardDescription>{t("settings.teamMembersDescription")}</CardDescription>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              {t("settings.inviteTeamMember")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("settings.inviteTeamMember")}</DialogTitle>
              <DialogDescription>
                {t("settings.inviteTeamMemberDescription")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="inviteEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.inviteEmail")}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="example@example.com" 
                          {...field} 
                          dir="ltr" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.inviteRole")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("settings.role")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">{t("settings.roleAdmin")}</SelectItem>
                          <SelectItem value="editor">{t("settings.roleEditor")}</SelectItem>
                          <SelectItem value="viewer">{t("settings.roleViewer")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === "admin" && t("settings.roleAdminDescription")}
                        {field.value === "editor" && t("settings.roleEditorDescription")}
                        {field.value === "viewer" && t("settings.roleViewerDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={inviteMutation.isPending}
                    className="gap-2"
                  >
                    {inviteMutation.isPending && (
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    )}
                    {t("settings.sendInvite")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {teamMembers && teamMembers.length > 0 ? (
          <div className="space-y-4">
            {/* Current user (owner) */}
            <div className="p-4 border rounded-lg flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar>
                  {user?.photoURL ? (
                    <AvatarImage src={user.photoURL} alt={user.email || ""} />
                  ) : (
                    <AvatarFallback>{getInitials(user?.email || "")}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {user?.fullName || user?.email}
                    <Badge variant="default" className="mr-2">{t("common.you")}</Badge>
                    <BadgeCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                </div>
              </div>
              <Badge variant="default">{t("settings.owner")}</Badge>
            </div>
            
            <Separator />
            
            {/* Team members */}
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {member.status === "pending" ? (
                      <Avatar>
                        <AvatarFallback className="bg-muted">
                          <Mail className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(member.inviteEmail)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div className="font-medium">
                        {member.inviteEmail}
                        {member.status === "pending" && (
                          <Badge variant="outline" className="mr-2 bg-amber-100 text-amber-800 border-amber-200">
                            {t("settings.invitePending")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {member.status === "pending" ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t("settings.invited")}: {member.createdAt && member.createdAt && formatDistanceToNow(new Date(member.createdAt), { addSuffix: true, locale: ar })}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {t("settings.memberSince")}: {member.createdAt && member.createdAt && formatDistanceToNow(new Date(member.createdAt), { addSuffix: true, locale: ar })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.status === "pending" ? (
                      <>
                        {renderRoleBadge(member.role)}
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleResendInvite(member.id)}
                              disabled={resendMutation.isPending}
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-auto">
                            <p>{t("settings.resendInvitation")}</p>
                          </HoverCardContent>
                        </HoverCard>
                      </>
                    ) : (
                      <Select
                        defaultValue={member.role}
                        onValueChange={(value) => handleChangeRole(member.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder={t("settings.role")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{t("settings.roleAdmin")}</SelectItem>
                          <SelectItem value="editor">{t("settings.roleEditor")}</SelectItem>
                          <SelectItem value="viewer">{t("settings.roleViewer")}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-auto">
                        <p>{t("settings.removeFromTeam")}</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg border-dashed flex flex-col items-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium mb-2">{t("settings.noTeamMembers")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("settings.noTeamMembersDescription")}
            </p>
            <Button 
              onClick={() => setInviteDialogOpen(true)}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {t("settings.addTeamMember")}
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.removeFromTeam")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.confirmRemoveMember")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("settings.removeFromTeam")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}