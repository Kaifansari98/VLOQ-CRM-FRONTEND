"use client";

import React, { useState } from "react";
import { Plus, AlertCircle, Calendar, User, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import TextAreaInput from "@/components/origin-text-area";
import { Badge } from "@/components/ui/badge";
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
import { canViewAndWorkUnderInstallationStage } from "@/components/utils/privileges";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import BaseModal from "@/components/utils/baseModal";

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

  const userType = useAppSelector((s) => s.auth.user?.user_type.user_type);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [issueTypeOptions, setIssueTypeOptions] = useState<Option[]>([]);
  const [teamOptions, setTeamOptions] = useState<Option[]>([]);

  const [selectedIssueType, setSelectedIssueType] = useState<
    number | undefined
  >(undefined);
  const [selectedTeams, setSelectedTeams] = useState<Option[]>([]);
  const [issueDescription, setIssueDescription] = useState("");
  const [issueImpact, setIssueImpact] = useState("");
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const [viewModal, setViewModal] = useState<{
    open: boolean;
    data: any | null;
  }>({
    open: false,
    data: null,
  });

  const { data: issueLogs, isLoading } = useGetInstallationIssueLogs(
    vendorId,
    leadId,
  );
  const { data: issueTypes } = useGetIssueTypes(vendorId);
  const createMutation = useCreateInstallationIssueLog();

  React.useEffect(() => {
    if (issueTypes) {
      setIssueTypeOptions(
        issueTypes.map((type: any) => ({
          value: type.id.toString(),
          label: type.name,
        })),
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
          })),
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

  const canWork = canViewAndWorkUnderInstallationStage(userType, leadStatus);

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
    <div className="space-y-6 bg-[#fff] dark:bg-[#0a0a0a]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Issue Log</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage installation issues
          </p>
        </div>

        {canWork && (
          <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Issue Log
          </Button>
        )}
      </div>

      <BaseModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Create Issue Log"
        description="Record installation issues with their impact and responsible teams."
        size="lg"
      >
        <div className="space-y-4 p-5">
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
            <Label htmlFor="responsible-teams" className="text-sm font-medium">
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
            <Label htmlFor="issue-description" className="text-sm font-medium">
              Issue Description <span className="text-destructive">*</span>
            </Label>
            <TextAreaInput
              value={issueDescription}
              onChange={setIssueDescription}
              placeholder="Describe the issue in detail..."
              maxLength={1000}
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
              {createMutation.isPending ? "Creating..." : "Create Issue Log"}
            </Button>
          </div>
        </div>
      </BaseModal>

      <div className="rounded-lg">
        {/* Table View */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px] text-sm font-medium text-foreground/80">
                  Issue Type
                </TableHead>
                <TableHead className="w-[300px] text-sm font-medium text-foreground/80">
                  Issue Description
                </TableHead>
                <TableHead className="w-[200px] text-sm font-medium text-foreground/80">
                  Responsible Teams
                </TableHead>
                <TableHead className="w-[150px] text-sm font-medium text-foreground/80">
                  Impact
                </TableHead>
                <TableHead className="w-[150px] text-sm font-medium text-foreground/80">
                  Created By
                </TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    <div className="text-sm text-muted-foreground">
                      Loading issue logs...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !issueLogs || issueLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-muted/40 rounded-full shadow-inner mb-2">
                        <AlertCircle className="w-7 h-7 opacity-50" />
                      </div>
                      <p className="font-medium text-sm">No Issue Logs Yet</p>
                      <p className="text-xs text-muted-foreground">
                        Start documenting installation issues by clicking "Add
                        Issue Log"
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                issueLogs.map((log: any) => (
                  <TableRow
                    key={log.id}
                    className="
              cursor-pointer 
              hover:bg-muted/30 
              transition-all 
              border-b last:border-0
            "
                    onClick={() => setViewModal({ open: true, data: log })}
                  >
                    {/* Issue Type */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-destructive/10">
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                          <div className="flex flex-wrap gap-1">
                            {log.issueTypes?.map((it: any) => (
                              <Badge
                                key={it.id}
                                variant="outline"
                                className="text-xs px-2"
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

                    {/* Description */}
                    <TableCell className="max-w-[250px] truncate">
                      <RemarkTooltip
                        remark={
                          log.issue_description.length > 60
                            ? log.issue_description.slice(0, 60) + "..."
                            : log.issue_description
                        }
                        remarkFull={log.issue_description}
                      />
                    </TableCell>

                    {/* Teams */}
                    <TableCell>
                      {log.responsibleTeams?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {log.responsibleTeams.slice(0, 2).map((rt: any) => (
                            <Badge
                              key={rt.id}
                              variant="secondary"
                              className="text-xs px-2"
                            >
                              {rt.team.name}
                            </Badge>
                          ))}
                          {log.responsibleTeams.length > 2 && (
                            <Badge variant="secondary" className="text-xs px-2">
                              +{log.responsibleTeams.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Impact */}
                    <TableCell>{getImpactBadge(log.issue_impact)}</TableCell>

                    {/* Created By */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        {log.createdBy?.user_name}
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-70 hover:opacity-100"
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
      </div>

      {/* View Modal */}
      <BaseModal
        open={viewModal.open}
        onOpenChange={(open) => setViewModal({ open, data: null })}
        title={viewModal.data?.issueTypes?.[0]?.type.name || "Issue Log"}
        description="Refer to the information below for full context."
        icon={
          <div className="p-2.5 rounded-lg bg-destructive/10 shrink-0">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
        }
        size="lg"
      >
        <div className="px-6 py-4 space-y-5">
          {/* Issue Types Section - Enhanced */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reported By Card */}
            <div className="border border-border rounded-lg bg-muted/30 dark:bg-neutral-900/40 p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Reported By
                      </p>
                      <p className="text-sm font-medium truncate">
                        {viewModal.data?.createdBy?.user_name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Reported Date
                      </p>
                      <p className="text-sm font-medium">
                        {viewModal.data &&
                          formatDate(viewModal.data.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Details Card */}
            {viewModal.data?.issueTypes &&
              viewModal.data.issueTypes.length > 0 && (
                <div className="border border-border rounded-lg bg-muted/30 dark:bg-neutral-900/40 p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          Impact Type
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {viewModal.data.issueTypes.map(
                            (it: any, index: number) => (
                              <span key={index} className="text-sm font-medium">
                                {it.type.name}
                                {index < viewModal.data.issueTypes.length - 1 &&
                                  ","}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    </div>

                    {viewModal.data?.issue_impact && (
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Impact Level
                          </p>
                          <p className="text-sm font-medium">
                            {viewModal.data.issue_impact}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Issue Description */}
          {viewModal.data?.issue_description && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Issue Description</p>
              <div className="border border-border rounded-lg bg-muted/30 dark:bg-neutral-900/40 p-3">
                <p className="text-sm text-foreground leading-relaxed">
                  {viewModal.data.issue_description}
                </p>
              </div>
            </div>
          )}

          {/* Responsible Teams */}
          {viewModal.data?.responsibleTeams &&
            viewModal.data.responsibleTeams.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Responsible Teams</p>
                <div className="border border-border rounded-lg bg-muted/30 dark:bg-neutral-900/40 p-3">
                  <div className="flex flex-wrap gap-2">
                    {viewModal.data.responsibleTeams.map((team: any) => (
                      <Badge
                        key={team.team_id}
                        variant="outline"
                        className="px-3 py-1.5 bg-background dark:bg-neutral-800"
                      >
                        {team.team?.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

          {/* Footer Actions */}
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setViewModal({ open: false, data: null })}
            >
              Close
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
