"use client";

import React, { useState } from "react";
import { Plus, AlertCircle, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import TextAreaInput from "@/components/origin-text-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// API hooks (you'll need to create these based on the backend endpoints)
import {
  useGetInstallationIssueLogs,
  useCreateInstallationIssueLog,
  useGetIssueTypes,
} from "@/api/installation/useUnderInstallationStageLeads";
import { getMiscTeams } from "@/api/installation/useUnderInstallationStageLeads";
import { useAppSelector } from "@/redux/store";
import AssignToPicker from "@/components/assign-to-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // Form state
  const [selectedIssueTypes, setSelectedIssueTypes] = useState<Option[]>([]);

  const [selectedTeams, setSelectedTeams] = useState<Option[]>([]);
  const [issueDescription, setIssueDescription] = useState("");
  const [issueImpact, setIssueImpact] = useState("");
  const [selectedIssueType, setSelectedIssueType] = useState<
    number | undefined
  >(undefined);

  // Fetch issue logs
  const { data: issueLogs, isLoading } = useGetInstallationIssueLogs(
    vendorId,
    leadId
  );

  // Fetch issue types and teams when modal opens
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
            label: team.name, // ✅ Correct field
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
      issue_type_ids: [selectedIssueType!],
      issue_description: issueDescription,
      issue_impact: issueImpact,
      responsible_team_ids: selectedTeams.map((team) => parseInt(team.value)),
      created_by: userId,
    };

    try {
      await createMutation.mutateAsync(payload);

      // Reset form
      setSelectedIssueType(undefined);
      setSelectedTeams([]);
      setIssueDescription("");
      setIssueImpact("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating issue log:", error);
    }
  };

  return (
    <div className="mt-4 space-y-6">
      {/* Header */}
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

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Issue Types */}
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

              {/* Issue Description */}
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

              {/* Issue Impact */}
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

              {/* Responsible Teams */}
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

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
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
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Issue Logs List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-muted-foreground">
              Loading issue logs...
            </div>
          </div>
        ) : issueLogs && issueLogs.length > 0 ? (
          issueLogs.map((log: any) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-destructive/10 p-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {log.issueTypes?.map((it: any) => (
                            <Badge key={it.id} variant="destructive">
                              {it.type.name}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.createdBy?.user_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Issue Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {log.issue_description}
                    </p>
                  </div>

                  {/* Impact */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Impact</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {log.issue_impact}
                    </p>
                  </div>

                  {/* Responsible Teams */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Responsible Teams</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      {log.responsibleTeams?.map((rt: any) => (
                        <Badge key={rt.id} variant="secondary">
                          {rt.team.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Issue Logs Yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                Start documenting installation issues by clicking the "Add Issue
                Log" button above
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
