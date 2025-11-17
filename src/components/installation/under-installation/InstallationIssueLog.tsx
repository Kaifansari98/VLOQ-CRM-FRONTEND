"use client";

import React, { useState } from "react";
import { Plus, AlertCircle, Calendar, User, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// Table components will be imported from shadcn
// Make sure you have installed: npx shadcn-ui@latest add table
import { Label } from "@/components/ui/label";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import TextAreaInput from "@/components/origin-text-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useGetInstallationIssueLogs,
  useCreateInstallationIssueLog,
  useGetIssueTypes,
  getMiscTeams,
} from "@/api/installation/useUnderInstallationStageLeads";
import { useAppSelector } from "@/redux/store";
import AssignToPicker from "@/components/assign-to-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RemarkTooltip from "@/components/origin-tooltip";

interface InstallationIssueLogProps {
  vendorId: number;
  leadId: number;
  accountId: number;
}

export default function InstallationIssueLog({
  vendorId,
  leadId,
  accountId,
}: InstallationIssueLogProps) {
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [issueTypeOptions, setIssueTypeOptions] = useState<Option[]>([]);
  const [teamOptions, setTeamOptions] = useState<Option[]>([]);

  const [selectedIssueType, setSelectedIssueType] = useState<
    number | undefined
  >(undefined);
  const [selectedTeams, setSelectedTeams] = useState<Option[]>([]);
  const [issueDescription, setIssueDescription] = useState("");
  const [issueImpact, setIssueImpact] = useState("");

  const [viewModal, setViewModal] = useState<{
    open: boolean;
    data: any | null;
  }>({
    open: false,
    data: null,
  });

  const { data: issueLogs, isLoading } = useGetInstallationIssueLogs(
    vendorId,
    leadId
  );
  const { data: issueTypes } = useGetIssueTypes(vendorId);
  const createMutation = useCreateInstallationIssueLog();

  React.useEffect(() => {
    if (issueTypes) {
      setIssueTypeOptions(
        issueTypes.map((type: any) => ({
          value: type.id.toString(),
          label: type.name,
        }))
      );
    }
  }, [issueTypes]);

  React.useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teams = await getMiscTeams(vendorId);
        setTeamOptions(
          teams.map((team: any) => ({
            value: team.id.toString(),
            label: team.name,
          }))
        );
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    if (isModalOpen) {
      fetchTeams();
    }
  }, [isModalOpen, vendorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedIssueType ||
      !selectedTeams.length ||
      !issueDescription ||
      !issueImpact
    ) {
      return;
    }

    const payload = {
      vendor_id: vendorId,
      lead_id: leadId,
      account_id: accountId,
      issue_type_ids: [selectedIssueType],
      issue_description: issueDescription,
      issue_impact: issueImpact,
      responsible_team_ids: selectedTeams.map((team) => parseInt(team.value)),
      created_by: userId,
    };

    try {
      await createMutation.mutateAsync(payload);

      setSelectedIssueType(undefined);
      setSelectedTeams([]);
      setIssueDescription("");
      setIssueImpact("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating issue log:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getImpactBadge = (impact: string) => {
    const lowerImpact = impact.toLowerCase();
    if (lowerImpact.includes("critical") || lowerImpact.includes("very high")) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (lowerImpact.includes("high")) {
      return (
        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-0">
          High
        </Badge>
      );
    } else if (lowerImpact.includes("medium")) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-0">
          Medium
        </Badge>
      );
    } else if (lowerImpact.includes("low")) {
      return <Badge variant="secondary">Low</Badge>;
    }
    return <Badge variant="outline">{impact}</Badge>;
  };

  return (
    <div className="mt-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Issue Log</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage installation issues and their resolution
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Issue Log
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Issue Log</DialogTitle>
              <DialogDescription>
                Document installation issues with details about type, impact,
                and responsible teams
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="issue-types" className="text-sm font-medium">
                  Issue Type <span className="text-destructive">*</span>
                </Label>
                <AssignToPicker
                  data={issueTypeOptions.map((item) => ({
                    id: Number(item.value),
                    label: item.label,
                  }))}
                  value={selectedIssueType}
                  onChange={(id) => setSelectedIssueType(id || undefined)}
                  placeholder="Select issue type..."
                  emptyLabel="Select issue type"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="issue-description"
                  className="text-sm font-medium"
                >
                  Issue Description <span className="text-destructive">*</span>
                </Label>
                <TextAreaInput
                  value={issueDescription}
                  onChange={setIssueDescription}
                  placeholder="Describe the issue in detail..."
                  maxLength={1000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue-impact" className="text-sm font-medium">
                  Issue Impact <span className="text-destructive">*</span>
                </Label>
                <div className="w-full">
                  <Select value={issueImpact} onValueChange={setIssueImpact}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select issue impact..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Very High Impact</SelectItem>
                      <SelectItem value="high">High Impact</SelectItem>
                      <SelectItem value="medium">Medium Impact</SelectItem>
                      <SelectItem value="low">Low Impact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="responsible-teams"
                  className="text-sm font-medium"
                >
                  Responsible Teams <span className="text-destructive">*</span>
                </Label>
                <MultipleSelector
                  value={selectedTeams}
                  onChange={setSelectedTeams}
                  options={teamOptions}
                  placeholder="Select responsible teams..."
                  emptyIndicator={
                    <p className="text-center text-sm text-muted-foreground">
                      No teams found
                    </p>
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    !selectedIssueType ||
                    !selectedTeams.length ||
                    !issueDescription ||
                    !issueImpact ||
                    createMutation.isPending
                  }
                >
                  {createMutation.isPending
                    ? "Creating..."
                    : "Create Issue Log"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Issue Type</TableHead>
              <TableHead className="w-[300px]">Issue Description</TableHead>
              <TableHead className="w-[150px]">Impact</TableHead>
              <TableHead className="w-[200px]">Responsible Teams</TableHead>
              <TableHead className="w-[150px]">Created By</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="text-sm text-muted-foreground">
                    Loading issue logs...
                  </div>
                </TableCell>
              </TableRow>
            ) : !issueLogs || issueLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-muted/50 rounded-full">
                      <AlertCircle className="w-8 h-8 opacity-50" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">No Issue Logs Yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start documenting installation issues by clicking "Add
                        Issue Log"
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              issueLogs.map((log: any) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setViewModal({ open: true, data: log })}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-destructive/10">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      </div>
                      <div>
                        <div className="flex flex-wrap gap-1">
                          {log.issueTypes?.map((it: any) => (
                            <Badge
                              key={it.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {it.type.name}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="truncate max-w-[250px] inline-block">
                    <RemarkTooltip
                      remark={
                        log.issue_description.length > 60
                          ? log.issue_description.slice(0, 60) + "..."
                          : log.issue_description
                      }
                      remarkFull={log.issue_description}
                    />
                  </TableCell>

                  <TableCell>{getImpactBadge(log.issue_impact)}</TableCell>
                  <TableCell>
                    {log.responsibleTeams?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {log.responsibleTeams.slice(0, 2).map((rt: any) => (
                          <Badge
                            key={rt.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {rt.team.name}
                          </Badge>
                        ))}
                        {log.responsibleTeams.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{log.responsibleTeams.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      {log.createdBy?.user_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewModal({ open: true, data: log });
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Modal */}
      <Dialog
        open={viewModal.open}
        onOpenChange={(open) => setViewModal({ open, data: null })}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-destructive/10">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg">
                  {viewModal.data?.issueTypes?.[0]?.type.name || "Issue Log"}
                </DialogTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {viewModal.data && formatDate(viewModal.data.created_at)}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {viewModal.data?.createdBy?.user_name}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {viewModal.data?.issueTypes &&
              viewModal.data.issueTypes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Issue Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.data.issueTypes.map((it: any) => (
                      <Badge key={it.id} variant="destructive">
                        {it.type.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {viewModal.data?.issue_description && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  Issue Description
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {viewModal.data.issue_description}
                </p>
              </div>
            )}

            {viewModal.data?.issue_impact && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Impact</h4>
                <div className="pl-6">
                  {getImpactBadge(viewModal.data.issue_impact)}
                </div>
              </div>
            )}

            {viewModal.data?.responsibleTeams &&
              viewModal.data.responsibleTeams.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Responsible Teams
                  </h4>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {viewModal.data.responsibleTeams.map((rt: any) => (
                      <Badge key={rt.id} variant="secondary">
                        {rt.team.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>

          <Separator />

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setViewModal({ open: false, data: null })}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
