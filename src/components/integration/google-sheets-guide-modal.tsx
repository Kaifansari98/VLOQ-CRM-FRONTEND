"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  FileSpreadsheet,
  Code2,
  Save,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Play,
  MousePointer,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";

export interface GoogleSheetsGuideSectionProps {
  webhookUrl: string;
  vendorToken?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface GuideStep {
  stepNumber: number;
  title: string;
  shortTitle: string;
  badge: string;
  image?: string;
  description: string;
  details?: string[];
  renderVisual?: () => React.ReactNode;
}


export function GoogleSheetsGuideSection({
  webhookUrl,
  vendorToken,
  className,
  open,
}: GoogleSheetsGuideSectionProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    if (open === false) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentStep < 9) {
        setCurrentStep((prev) => Math.min(9, prev + 1));
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        setCurrentStep((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentStep]);

  // Dynamically resolve valid vendor token (never use hardcoded fallback tokens)
  const resolvedToken = React.useMemo(() => {
    if (vendorToken && vendorToken.trim() !== "" && !vendorToken.includes("<")) {
      return vendorToken.trim();
    }
    if (webhookUrl) {
      const match = webhookUrl.match(/[?&]vendor_token=([^&]+)/);
      if (match && match[1] && !match[1].includes("<") && match[1].trim() !== "") {
        return match[1].trim();
      }
    }
    return null;
  }, [vendorToken, webhookUrl]);

  const activeWebhookUrl = React.useMemo(() => {
    if (!resolvedToken) return "";

    const isLocal =
      typeof window !== "undefined" &&
      (window.location.origin.includes("localhost") ||
        window.location.origin.includes("127.0.0.1"));
    const isStaging =
      typeof window !== "undefined" &&
      window.location.origin.includes("staging");

    // Local dev uses ngrok public URL because Google Apps Script executes on Google cloud servers
    const baseUrl = isLocal
      ? "https://cameo-unhealthy-breezy.ngrok-free.dev"
      : isStaging
      ? "https://staging-api.furnixcrm.com"
      : "https://api.furnixcrm.com";

    return `${baseUrl}/webhook?vendor_token=${resolvedToken}`;
  }, [resolvedToken]);

  const googleAppsScriptCode = `/**
 * Furnix CRM - Google Sheets Automated Lead Ingestion
 * Trigger: On edit
 */
function sendLeadToCRM(e) {
  // 1. Webhook URL with dynamic vendor token & environment
  const WEBHOOK_URL = "${activeWebhookUrl}";

  try {
    // 2. Event and range validation
    if (!e || !e.range) {
      Logger.log("No event or range object found. Ensure this function is triggered On edit.");
      return;
    }

    const range = e.range;
    const sheet = range.getSheet();
    const editedRow = range.getRow();

    // Skip header row (Row 1)
    if (editedRow <= 1) {
      Logger.log("Edit occurred in header row (Row 1). Skipping.");
      return;
    }

    // 3. Header and row reading via getDisplayValues()
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) {
      Logger.log("No columns found in the active sheet.");
      return;
    }

    const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
    const rowValues = sheet.getRange(editedRow, 1, 1, lastCol).getDisplayValues()[0];

    // 4. normalizeHeader() helper function
    function normalizeHeader(header) {
      if (!header) return "";
      return header.toString().toLowerCase().replace(/[\\s_\\/|\\-?]+/g, "").trim();
    }

    // 5. Collect ALL sheet row columns dynamically
    var rowData = {};
    for (var i = 0; i < headers.length; i++) {
      var headerKey = headers[i] ? headers[i].toString().trim() : "";
      if (headerKey) {
        var cellVal = rowValues[i];
        rowData[headerKey] = cellVal !== null && cellVal !== undefined ? String(cellVal).trim() : "";
      }
    }

    // 6. getValue() helper function (exact normalized matching)
    function getValue(possibleMatches) {
      for (var i = 0; i < headers.length; i++) {
        var normalizedColHeader = normalizeHeader(headers[i]);
        for (var j = 0; j < possibleMatches.length; j++) {
          var target = normalizeHeader(possibleMatches[j]);
          if (normalizedColHeader === target) {
            var cellValue = rowValues[i];
            return cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : "";
          }
        }
      }
      return "";
    }

    // 7. Extract lead fields with fallbacks
    const name = getValue(["Customer Name", "Full Name", "full_name", "Lead Name", "Name", "Client Name"]);
    const phone = getValue(["Phone Number", "phone_number", "Mobile Number", "Contact Number", "Phone", "Mobile", "Contact"]);
    const email = getValue(["Email ID", "Email Address", "Email", "Mail"]);
    const city = getValue(["City", "Project City", "Location", "Town"]);
    const remark = getValue(["Design Remarks", "Remarks", "Remark", "Notes", "Comments", "Requirement Details", "Description"]);

    const finalName = name || rowData["full_name"] || rowData["Full Name"] || rowData["name"] || rowData["Name"];
    const finalPhone = phone || rowData["phone_number"] || rowData["Phone Number"] || rowData["contact"] || rowData["Contact"];

    // Validation: Name + Phone required
    if (!finalName || !finalPhone) {
      Logger.log("Row " + editedRow + " is missing required Name or Phone. Skipping dispatch.");
      return;
    }

    // 8. Payload construction - dynamically sends all sheet columns
    // CRM automatically excludes static columns from Design Remarks and stores all dynamic questions!
    const payload = Object.assign({}, rowData, {
      name: finalName,
      contact: finalPhone,
      email: email || rowData["email"] || rowData["Email"] || "",
      city: city || rowData["city"] || rowData["where_is_your_project_located?"] || "",
      source: "Google Sheet",
      remark: remark || ""
    });

    // 9. HTTP Options
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    // 10. UrlFetchApp.fetch()
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);

    // 11. Response logging
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    Logger.log("CRM Response Code: " + responseCode);
    Logger.log("CRM Response Body: " + responseBody);

  } catch (error) {
    // 12. Error handling
    Logger.log("Error sending lead to CRM: " + error.toString());
  }
}`;

  const copyScript = async () => {
    if (!resolvedToken) {
      toastManager.add({
        title: "Vendor Token Loading",
        description: "Please wait for your vendor token to finish loading.",
        type: "error",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(googleAppsScriptCode);
      setCopiedCode(true);
      toastManager.add({
        title: "Script Copied!",
        description: "Google Apps Script code copied to clipboard.",
        type: "success",
      });
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toastManager.add({
        title: "Copy Failed",
        description: "Please manually copy the script from the box.",
        type: "error",
      });
    }
  };

  const steps: GuideStep[] = [
    {
      stepNumber: 1,
      title: "Open Google Sheet",
      shortTitle: "1. Open Sheet",
      badge: "Step 1 of 10",
      // 👇 Image placed directly above "Step 1 of 10 Open Google Sheet".
      // Aap is URL ko apne custom image path (e.g. "/images/my-sheet.png" ya koi online URL) se replace kar sakte hain:
      image: "/images/google-sheets-step1.jpg",
      description:
        "Open the Google Sheet where your Meta / Lead Ads leads arrive or are stored. Ensure that the first row contains column headers such as Name, Phone, Email, City, and Requirement.",
      details: [
        "First row must be the header row (e.g., Name, Phone, Email, City)",
        "This sheet will automatically capture all incoming edits",
      ],
    },
    {
      stepNumber: 2,
      title: "Extensions → Apps Script",
      shortTitle: "2. Extensions",
      badge: "Step 2 of 10",
      // 👇 Circled Extensions image directly above "Step 2 of 10 Extensions → Apps Script"
      image: "/images/google-sheets-step2.jpg",
      description:
        "In the Google Sheet top navigation menu, click on 'Extensions' and select 'Apps Script' from the dropdown list.",
      details: [
        "Top menu bar: File · Edit · View · Insert · Format · Data · Tools · Extensions",
        "Click on 'Extensions' -> Select 'Apps Script'",
      ],
    },
    {
      stepNumber: 3,
      title: "Open Apps Script & Clear Default Code",
      shortTitle: "3. Apps Script",
      badge: "Step 3 of 10",
      image: "/images/google-sheets-step3.jpg",
      description:
        "The Google Apps Script editor will open in a new tab. In the left sidebar, locate the 'Code.gs' file containing the placeholder `function myFunction() {}`. Select and delete/clear this placeholder code entirely.",
      details: [
        "Ensure Editor (<>) is selected in the left rail",
        "Completely delete the default placeholder code from Code.gs",
      ],
    },
    {
      stepNumber: 4,
      title: "Paste CRM Webhook Script",
      shortTitle: "4. Paste Script",
      badge: "Step 4 of 10",
      image: "/images/google-sheets-step4.jpg",
      description:
        "Copy the production-ready Google Apps Script below and paste it into the `Code.gs` editor. This script automatically captures row edits in your sheet and sends lead data to the CRM via HTTP POST.",
      details: [
        "Click the 'Copy Script' button below",
        "Paste the entire snippet into Code.gs",
      ],
      renderVisual: () => (
        !resolvedToken ? (
          <div className="w-full rounded-xl border bg-card/60 p-8 flex flex-col items-center justify-center text-center space-y-3 font-sans">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center animate-spin">
              <Loader2 className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1 max-w-md">
              <p className="font-semibold text-foreground text-sm">Loading Vendor Webhook Token...</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fetching your authenticated vendor credentials. Once loaded, your customized Google Apps Script will appear here ready to copy.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col font-sans">
            <div className="bg-[#1E1E1E] text-slate-200 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-100">Code.gs — sendLeadToCRM</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={copyScript}
                className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-xs"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? "Copied!" : "Copy Script"}
              </Button>
            </div>

            <div className="p-4 bg-[#141414] text-slate-200 font-mono text-xs overflow-x-auto overflow-y-auto max-h-[460px] border-t border-slate-800">
              <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono text-xs">
                {googleAppsScriptCode}
              </pre>
            </div>
          </div>
        )
      ),
    },
    {
      stepNumber: 5,
      title: "Save Project (Ctrl + S)",
      shortTitle: "5. Save (Ctrl+S)",
      badge: "Step 5 of 10",
      image: "/images/google-sheets-step5.jpg",
      description:
        "After pasting the script, press `Ctrl + S` on your keyboard (or `Cmd + S` on Mac), or click the Save icon (Disk 💾) on the top toolbar. Verify that 'Project Saved' appears.",
      details: [
        "Keyboard shortcut: Ctrl + S (Windows) / Cmd + S (Mac)",
        "Or click the Save disk icon on the top toolbar",
      ],
    },
    {
      stepNumber: 6,
      title: "Apps Script → Triggers → Add Trigger",
      shortTitle: "6. Triggers",
      badge: "Step 6 of 10",
      image: "/images/google-sheets-step6.jpg",
      description:
        "In the Apps Script editor's left vertical navigation bar, click the alarm clock icon (⏰ Triggers). Then click the blue '+ Add Trigger' button in the bottom-right corner of the screen.",
      details: [
        "Click the ⏰ icon (Triggers) in the left rail",
        "Click '+ Add Trigger' button in the bottom-right corner",
      ],
    },
    {
      stepNumber: 7,
      title: "Configure Trigger Settings",
      shortTitle: "7. Trigger Settings",
      badge: "Step 7 of 10",
      image: "/images/google-sheets-step7.jpg",
      description:
        "In the trigger configuration popup, select these exact 4 options: Function: sendLeadToCRM | Deployment: Head | Event source: From spreadsheet | Event type: On edit.",
      details: [
        "Function: sendLeadToCRM",
        "Deployment: Head",
        "Event source: From spreadsheet",
        "Event type: On edit",
      ],
    },
    {
      stepNumber: 8,
      title: "Save Trigger & Allow Google Permissions",
      shortTitle: "8. Permissions",
      badge: "Step 8 of 10",
      image: "/images/google-sheets-step8.jpg",
      description:
        "When saving the trigger, an authorization popup will appear to choose your Google account. Select your account -> click 'Advanced' -> click 'Go to Furnix CRM (unsafe)' -> click 'Allow'.",
      details: [
        "Select your Google Account",
        "Click on 'Advanced' -> Click 'Go to Project (unsafe)'",
        "Click 'Allow' button to grant network webhook permissions",
      ],
    },
    {
      stepNumber: 9,
      title: "Add or Edit a Test Lead in Google Sheet",
      shortTitle: "9. Test Lead",
      badge: "Step 9 of 10",
      image: "/images/google-sheets-step9.jpg",
      description:
        "Return to your Google Sheet and enter test lead data in a new row (such as Name, Phone, Email, City). The 'On edit' trigger will automatically fire and send the lead to your CRM.",
      details: [
        "Enter customer details into row 2 or any new row",
        "Fill in customer Name, Phone, Email, and City",
      ],
    },
    {
      stepNumber: 10,
      title: "Verify in CRM Lead Pool",
      shortTitle: "10. Verify CRM",
      badge: "Step 10 of 10",
      image: "/images/google-sheets-step10.png",
      description:
        "Go to the 'Lead Pool' page in Furnix CRM. Your test lead will appear immediately with the source 'Google Sheet'. Setup and verification are complete!",
      details: [
        "Go to CRM Dashboard -> Lead Pool",
        "Verify new lead with source 'Google Sheet'",
        "Full vendor isolation is enforced by your vendor_token",
      ],
    },
  ];

  const sections = [
    {
      title: "Sheet Setup",
      stepIndices: [0, 1],
    },
    {
      title: "Apps Script Code",
      stepIndices: [2, 3, 4],
    },
    {
      title: "Triggers & Permissions",
      stepIndices: [5, 6, 7],
    },
    {
      title: "Testing & Verification",
      stepIndices: [8, 9],
    },
  ];

  const currentStepData = steps[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <Card className={`w-full rounded-2xl border shadow-xs overflow-hidden flex flex-col p-0 ${className || ""}`}>
      {/* Top Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-card via-card to-muted/40 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              Google Sheets → CRM Integration Guide
            </h2>
            <p className="text-xs text-muted-foreground">
              Follow this 10-step visual guide to sync leads automatically from Google Sheets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right">
            <div className="text-xs font-semibold text-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="text-[11px] text-muted-foreground">{progressPercent}% Completed</div>
          </div>
          <div className="w-20 sm:w-28 h-2 bg-muted rounded-full overflow-hidden border">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Body: Left Sidebar (Section-wise) + Right Content */}
      <div className="flex flex-col md:flex-row flex-1 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left Sidebar: Section-wise Steps */}
        <aside className="w-full md:w-56 lg:w-60 shrink-0 bg-muted/10 p-3 sm:p-3.5 space-y-3.5 overflow-y-auto">
          {sections.map((section, sIdx) => {
            return (
              <div key={sIdx} className="space-y-1.5">
                <div className="px-1.5 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/70">
                  <span>{section.title}</span>
                </div>

                <div className="space-y-1">
                  {section.stepIndices.map((idx) => {
                    const step = steps[idx];
                    const isActive = idx === currentStep;
                    const cleanTitle = step.shortTitle.replace(/^\d+\.\s*/, "");

                    return (
                      <button
                        key={step.stepNumber}
                        type="button"
                        onClick={() => setCurrentStep(idx)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-2 cursor-pointer border ${
                          isActive
                            ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs font-semibold"
                            : "bg-card/70 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/50"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                            isActive
                              ? "bg-white/20 dark:bg-black/20 text-white dark:text-black font-bold"
                              : "bg-muted text-muted-foreground font-medium"
                          }`}
                        >
                          {step.stepNumber}
                        </div>
                        <span className="truncate flex-1 leading-snug">{cleanTitle}</span>
                        {isActive && (
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Helper Note in Sidebar */}
          <div className="pt-1">
            <div className="p-2.5 rounded-lg bg-card/60 border border-border/60 text-[11px] space-y-1 text-muted-foreground">
              <div className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>1-Time Setup</span>
              </div>
              <p className="leading-snug">
                Once configured, Google Sheets triggers will automatically sync rows to CRM live.
              </p>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col justify-between bg-card min-w-0">
          <div className="p-6 lg:p-8 space-y-6">
            {/* Step Top Image */}
            {currentStepData.image && (
              <div className="w-full rounded-xl overflow-hidden border border-border/80 bg-muted/20 shadow-xs relative">
                <img
                  src={currentStepData.image}
                  alt={currentStepData.title}
                  className="w-full h-auto max-h-[420px] object-contain bg-background rounded-xl mx-auto"
                />
              </div>
            )}

            {/* Step Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-semibold text-xs">
                  {currentStepData.badge}
                </Badge>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {currentStepData.title}
                </h3>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                {currentStepData.description}
              </p>

              {currentStepData.details && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentStepData.details.map((detail, dIdx) => (
                    <span
                      key={dIdx}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border"
                    >
                      <Info className="w-3 h-3 text-blue-500" />
                      {detail}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Visual (Step 4 Code snippet) */}
            {currentStepData.renderVisual && (
              <div className="pt-2">
                {currentStepData.renderVisual()}
              </div>
            )}
          </div>

          {/* Bottom Footer Navigation */}
          <div className="px-6 py-3.5 border-t bg-card/70 shrink-0 flex items-center justify-between mt-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {/* Center Indicator Dots */}
            <div className="hidden sm:flex items-center gap-1.5">
              {steps.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentStep(dotIdx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    dotIdx === currentStep
                      ? "w-6 bg-black dark:bg-white"
                      : dotIdx < currentStep
                      ? "w-2 bg-black/80 dark:bg-white/80"
                      : "w-2 bg-muted hover:bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>

            {currentStep < steps.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="gap-1.5 bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 font-semibold cursor-pointer"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                asChild
                className="gap-1.5 bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 font-semibold cursor-pointer shadow-xs"
              >
                <Link href="/dashboard/lead-pool">
                  Finish &amp; Open Lead Pool
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Backward-compatible alias
export const GoogleSheetsGuideModal = GoogleSheetsGuideSection;
