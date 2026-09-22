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
  renderVisual: () => React.ReactNode;
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

  const activeWebhookUrl =
    webhookUrl || "https://staging-api.furnixcrm.com/webhook?vendor_token=<YOUR_VENDOR_TOKEN>";

  const googleAppsScriptCode = `/**
 * Furnix CRM - Google Sheets Automated Lead Ingestion
 * Trigger: On edit (or On form submit)
 */
function sendLeadToCRM(e) {
  // 1. Webhook URL with dynamic vendor token
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

    // 3. Header and row reading
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) {
      Logger.log("No columns found in the active sheet.");
      return;
    }

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const rowValues = sheet.getRange(editedRow, 1, 1, lastCol).getValues()[0];

    // 4. normalizeHeader() helper function
    function normalizeHeader(header) {
      if (!header) return "";
      return header.toString().toLowerCase().replace(/[\\s_\\/|\\-?]+/g, "").trim();
    }

    // 5. getValue() helper function for fuzzy header matching
    function getValue(possibleMatches) {
      for (var i = 0; i < headers.length; i++) {
        var normalizedColHeader = normalizeHeader(headers[i]);
        for (var j = 0; j < possibleMatches.length; j++) {
          var target = normalizeHeader(possibleMatches[j]);
          if (normalizedColHeader.indexOf(target) !== -1) {
            var cellValue = rowValues[i];
            return cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : "";
          }
        }
      }
      return "";
    }

    // 6. Name, Phone, Email, City, Product, Remark detection
    const name = getValue(["Customer Name", "Full Name", "Lead Name", "Name", "Client Name"]);
    const phone = getValue(["Phone Number", "Mobile Number", "Contact Number", "Phone", "Mobile", "Contact"]);
    const email = getValue(["Email ID", "Email Address", "Email", "Mail"]);
    const city = getValue(["City", "Project City", "Location", "Town"]);
    const product = getValue(["Product Type", "Modular Solution", "Product", "Requirement", "Category", "Service"]);
    const remark = getValue(["Design Remarks", "Remarks", "Notes", "Comments", "Requirement Details", "Description"]);

    // 7. All 4 Survey fields detection
    const modularSolution = getValue([
      "What modular solution are you looking for",
      "Modular Solution",
      "Solution Looking For",
      "Modular"
    ]);

    const whenNeedReady = getValue([
      "When do you need your kitchen/wardrobe ready",
      "When do you need",
      "When need ready",
      "Possession Date",
      "Timeline"
    ]);

    const preferredShowroom = getValue([
      "Which showroom would you prefer to visit",
      "Preferred Showroom",
      "Showroom Location",
      "Showroom Visit",
      "Showroom"
    ]);

    const projectLocation = getValue([
      "Where is your project located",
      "Project Location",
      "Site Location",
      "Project Address",
      "Location"
    ]);

    // Validation: skip if neither name nor phone exists in this row
    if (!phone && !name) {
      Logger.log("Row " + editedRow + " has no contact or customer name. Skipping dispatch.");
      return;
    }

    // Map all raw columns for maximum compatibility
    const rawData = {};
    for (var k = 0; k < headers.length; k++) {
      if (headers[k]) {
        rawData[String(headers[k]).trim()] = rowValues[k];
      }
    }

    // 8. Payload construction
    const payload = {
      name: name,
      contact: phone,
      email: email,
      city: city || projectLocation,
      source: "Google Sheet",
      remark: remark,
      product_type: product || modularSolution,
      product_types: (product || modularSolution) ? [product || modularSolution] : [],
      modular_solution: modularSolution,
      when_need_ready: whenNeedReady,
      preferred_showroom: preferredShowroom,
      project_location: projectLocation,
      ...rawData
    };

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
      renderVisual: () => (
        <div className="w-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col font-sans">
          {/* Browser / Sheet Window Header */}
          <div className="bg-muted/70 px-4 py-2 border-b flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              </div>
              <span className="text-[11px] font-mono text-foreground/80 ml-2">docs.google.com/spreadsheets</span>
            </div>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-medium">Google Sheets</span>
          </div>

          {/* Sheet App Bar */}
          <div className="p-3 bg-muted/20 border-b flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Meta Lead Ads 2026</h4>
                <p className="text-[10px] text-muted-foreground">All changes saved in Drive</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 bg-muted rounded border text-[11px]">Share</span>
            </div>
          </div>

          {/* Formula bar */}
          <div className="px-4 py-1.5 bg-muted/10 border-b flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="font-bold text-foreground/70">fx</span>
            <span className="text-foreground">Name</span>
          </div>

          {/* Grid Preview */}
          <div className="p-2 overflow-x-auto bg-background">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-[11px]">
                  <th className="p-2 border font-medium w-8 text-center"></th>
                  <th className="p-2 border font-semibold text-foreground">A · Name</th>
                  <th className="p-2 border font-semibold text-foreground">B · Phone</th>
                  <th className="p-2 border font-semibold text-foreground">C · Email</th>
                  <th className="p-2 border font-semibold text-foreground">D · City</th>
                  <th className="p-2 border font-semibold text-foreground">E · Requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y text-muted-foreground">
                <tr className="hover:bg-muted/20">
                  <td className="p-2 border text-center font-mono text-[10px] text-muted-foreground bg-muted/20">1</td>
                  <td className="p-2 border font-medium text-foreground">Customer Name</td>
                  <td className="p-2 border font-medium text-foreground">Phone</td>
                  <td className="p-2 border font-medium text-foreground">Email</td>
                  <td className="p-2 border font-medium text-foreground">City</td>
                  <td className="p-2 border font-medium text-foreground">Requirement</td>
                </tr>
                <tr className="bg-emerald-500/5">
                  <td className="p-2 border text-center font-mono text-[10px] text-emerald-600 bg-emerald-500/10 font-bold">2</td>
                  <td className="p-2 border text-foreground">Rahul Sharma</td>
                  <td className="p-2 border font-mono text-foreground">9876543210</td>
                  <td className="p-2 border text-foreground">rahul@example.com</td>
                  <td className="p-2 border text-foreground">Mumbai</td>
                  <td className="p-2 border text-foreground">Modular Kitchen</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
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
      renderVisual: () => (
        <div className="w-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col font-sans">
          <div className="bg-muted/70 px-4 py-2 border-b flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            </div>
            <span className="text-[11px] font-medium text-foreground/80 ml-2">Google Sheets Menu Bar</span>
          </div>

          <div className="p-6 bg-gradient-to-b from-muted/30 to-background flex flex-col items-start gap-4">
            {/* Sheet Menu Bar with highlighted Extensions */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-muted/60 rounded-lg border text-xs">
              <span className="px-2.5 py-1 text-muted-foreground hover:bg-muted rounded">File</span>
              <span className="px-2.5 py-1 text-muted-foreground hover:bg-muted rounded">Edit</span>
              <span className="px-2.5 py-1 text-muted-foreground hover:bg-muted rounded">View</span>
              <span className="px-2.5 py-1 text-muted-foreground hover:bg-muted rounded">Insert</span>
              <span className="px-2.5 py-1 text-muted-foreground hover:bg-muted rounded">Format</span>
              <span className="px-2.5 py-1 text-muted-foreground hover:bg-muted rounded">Data</span>
              <span className="px-2.5 py-1 text-muted-foreground hover:bg-muted rounded">Tools</span>
              {/* Highlighted Extensions button */}
              <div className="relative">
                <span className="px-3 py-1 bg-blue-600 text-white font-semibold rounded shadow-sm flex items-center gap-1">
                  Extensions
                  <span className="text-[10px]">▾</span>
                </span>

                {/* Dropdown Menu Mockup */}
                <div className="absolute left-0 top-8 w-56 bg-card border rounded-lg shadow-xl p-1.5 z-20 space-y-1 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1.5 text-muted-foreground rounded hover:bg-muted flex items-center justify-between text-[11px]">
                    <span>Add-ons</span>
                    <span className="text-[10px]">›</span>
                  </div>
                  {/* Highlighted Apps Script Item */}
                  <div className="px-2.5 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-md flex items-center justify-between border border-blue-500/30">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Apps Script</span>
                    </div>
                    <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-mono">CLICK</span>
                  </div>
                  <div className="px-2.5 py-1.5 text-muted-foreground rounded hover:bg-muted text-[11px]">
                    AppSheet
                  </div>
                  <div className="px-2.5 py-1.5 text-muted-foreground rounded hover:bg-muted text-[11px]">
                    Macros
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 text-muted-foreground hover:bg-muted rounded">Help</span>
            </div>

            <div className="mt-28 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
              <MousePointer className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Clicking <strong>Apps Script</strong> opens the Google cloud scripting environment in a new tab.</span>
            </div>
          </div>
        </div>
      ),
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
      renderVisual: () => (
        <div className="w-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col font-sans">
          <div className="bg-[#1E1E1E] text-slate-200 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#4285F4] text-white flex items-center justify-center font-bold text-xs">
                &lt;&gt;
              </div>
              <span className="font-semibold text-slate-100">Furnix CRM Webhook Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[11px]">Run</span>
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[11px] font-medium">Deploy</span>
            </div>
          </div>

          <div className="flex h-56 bg-[#181818] text-slate-300 text-xs font-mono">
            {/* Left rail */}
            <div className="w-12 bg-[#202020] border-r border-slate-800 flex flex-col items-center py-3 gap-4 text-slate-400">
              <div className="p-1.5 rounded bg-blue-500/20 text-blue-400 cursor-pointer">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="p-1.5 rounded hover:bg-slate-800 cursor-pointer">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            {/* Files Panel */}
            <div className="w-40 bg-[#1E1E1E] border-r border-slate-800 p-3 space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Files</div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-blue-600/20 text-blue-300 font-sans text-xs">
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Code.gs</span>
              </div>
            </div>

            {/* Code canvas */}
            <div className="flex-1 p-4 bg-[#141414] overflow-hidden relative">
              <div className="space-y-1 text-slate-400">
                <div className="flex gap-4">
                  <span className="text-slate-600 select-none w-4 text-right">1</span>
                  <span className="line-through text-red-400/80">function myFunction() &#123;</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-600 select-none w-4 text-right">2</span>
                  <span className="text-slate-600">  // Empty placeholder</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-600 select-none w-4 text-right">3</span>
                  <span className="line-through text-red-400/80">&#125;</span>
                </div>
              </div>

              <div className="absolute right-4 top-4 bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-sans flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Clear / Delete this default code</span>
              </div>
            </div>
          </div>
        </div>
      ),
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
      renderVisual: () => (
        <div className="w-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col font-sans">
          <div className="bg-[#1E1E1E] text-slate-200 px-4 py-3 border-b border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              {/* Highlighted Save Icon */}
              <div className="p-1.5 rounded-md bg-blue-600 text-white ring-2 ring-blue-400/50 flex items-center gap-1.5 cursor-pointer shadow-sm">
                <Save className="w-4 h-4" />
                <span className="text-[11px] font-semibold">Save</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Play className="w-3.5 h-3.5" />
                <span className="text-[11px]">Run</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-[11px]">Debug</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Project Saved</span>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-b from-muted/30 to-background flex flex-col items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <kbd className="px-3 py-1.5 bg-muted border border-border rounded-lg shadow-sm font-mono text-sm font-semibold text-foreground">
                Ctrl
              </kbd>
              <span className="text-muted-foreground font-bold">+</span>
              <kbd className="px-3 py-1.5 bg-muted border border-border rounded-lg shadow-sm font-mono text-sm font-semibold text-foreground">
                S
              </kbd>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              Press <strong>Ctrl + S</strong> anytime to ensure all code changes are safely saved in your Google Cloud project.
            </p>
          </div>
        </div>
      ),
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
      renderVisual: () => (
        <div className="w-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col font-sans">
          <div className="bg-[#1E1E1E] text-slate-200 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-100">Apps Script — Triggers Dashboard</span>
            <span className="text-[11px] text-slate-400">Manage automation triggers</span>
          </div>

          <div className="flex h-56 bg-[#181818] text-slate-300 text-xs font-mono relative">
            {/* Left rail */}
            <div className="w-12 bg-[#202020] border-r border-slate-800 flex flex-col items-center py-3 gap-4 text-slate-400">
              <div className="p-1.5 rounded hover:bg-slate-800 cursor-pointer">
                <Code2 className="w-4 h-4" />
              </div>
              {/* Highlighted Triggers Icon */}
              <div className="p-1.5 rounded bg-blue-600 text-white shadow-md ring-2 ring-blue-400/40 cursor-pointer">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            {/* Triggers Canvas */}
            <div className="flex-1 p-5 bg-[#141414] font-sans flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Triggers for Furnix CRM</h4>
                <p className="text-xs text-slate-400 mt-1">No triggers set up yet for this project.</p>
              </div>

              {/* Blue Floating Action Button */}
              <div className="flex justify-end items-center gap-3">
                <span className="text-xs text-blue-400 font-medium flex items-center gap-1 animate-pulse">
                  👉 Click to add new trigger:
                </span>
                <div className="px-4 py-2 bg-blue-600 text-white rounded-full font-semibold shadow-lg shadow-blue-500/30 flex items-center gap-2 cursor-pointer hover:bg-blue-500 text-xs">
                  <span className="text-base leading-none font-bold">+</span>
                  <span>Add Trigger</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
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
      renderVisual: () => (
        <div className="w-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col font-sans">
          <div className="bg-muted/80 px-4 py-2.5 border-b flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">Add Trigger for Furnix CRM Webhook</span>
            <span className="text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded">Exact Settings</span>
          </div>

          <div className="p-4 bg-background grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Setting 1 */}
            <div className="p-2.5 rounded-lg border bg-muted/20 space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Choose which function to run</label>
              <div className="p-2 bg-background border rounded font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>sendLeadToCRM</span>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>

            {/* Setting 2 */}
            <div className="p-2.5 rounded-lg border bg-muted/20 space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Which runs at deployment</label>
              <div className="p-2 bg-background border rounded font-mono font-semibold text-foreground flex items-center justify-between">
                <span>Head</span>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>

            {/* Setting 3 */}
            <div className="p-2.5 rounded-lg border bg-muted/20 space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Select event source</label>
              <div className="p-2 bg-background border rounded font-mono font-semibold text-foreground flex items-center justify-between">
                <span>From spreadsheet</span>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>

            {/* Setting 4 */}
            <div className="p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/5 space-y-1">
              <label className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Select event type (CRITICAL)</label>
              <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded font-mono font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <span>On edit</span>
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">Selected</span>
              </div>
            </div>
          </div>
        </div>
      ),
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
      renderVisual: () => (
        <div className="w-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col font-sans">
          <div className="bg-muted/70 px-4 py-2 border-b flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground/80">Google OAuth 2.0 Authorization Flow</span>
            <span className="text-[11px] text-muted-foreground">Standard 1-time setup</span>
          </div>

          <div className="p-5 bg-background space-y-3 text-xs">
            <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Authorization Required Screen:</span>
              </div>
              <p className="text-[11px]">
                Google will ask to authorize UrlFetchApp (required to POST leads to CRM).
              </p>
            </div>

            {/* Steps visual */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="p-2.5 rounded-lg border bg-muted/30">
                <span className="w-5 h-5 rounded-full bg-muted font-bold inline-flex items-center justify-center mb-1">1</span>
                <p className="font-semibold text-foreground">Choose Account</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Select your Google account</p>
              </div>
              <div className="p-2.5 rounded-lg border border-blue-500/30 bg-blue-500/5">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold inline-flex items-center justify-center mb-1">2</span>
                <p className="font-semibold text-blue-600 dark:text-blue-400">Click Advanced</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Go to Project (unsafe)</p>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold inline-flex items-center justify-center mb-1">3</span>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">Click Allow</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Grant webhook permissions</p>
              </div>
            </div>
          </div>
        </div>
      ),
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
      renderVisual: () => (
        <div className="w-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col font-sans">
          <div className="bg-muted/70 px-4 py-2 border-b flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80">Google Sheets — Live Edit Capture</span>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono">
              Trigger Active
            </span>
          </div>

          <div className="p-3 bg-background overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-[11px]">
                  <th className="p-2 border font-medium w-8 text-center">#</th>
                  <th className="p-2 border font-semibold text-foreground">Name</th>
                  <th className="p-2 border font-semibold text-foreground">Phone</th>
                  <th className="p-2 border font-semibold text-foreground">Email</th>
                  <th className="p-2 border font-semibold text-foreground">City</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-emerald-500/10 animate-pulse border-2 border-emerald-500">
                  <td className="p-2 border text-center font-mono font-bold text-emerald-600">2</td>
                  <td className="p-2 border font-medium text-foreground">Rahul Sharma</td>
                  <td className="p-2 border font-mono text-foreground font-semibold">9876543210</td>
                  <td className="p-2 border text-foreground">rahul@example.com</td>
                  <td className="p-2 border text-foreground">Mumbai</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>As soon as any cell is edited, <strong>sendLeadToCRM</strong> automatically triggers the webhook!</span>
            </div>
          </div>
        </div>
      ),
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
      renderVisual: () => (
        <div className="w-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col font-sans">
          <div className="bg-muted/70 px-4 py-2 border-b flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80">Furnix CRM — Lead Pool</span>
            <Badge className="bg-emerald-600 text-white text-[10px]">Verified Live</Badge>
          </div>

          <div className="p-4 bg-background space-y-4">
            {/* Table Mockup */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground text-[11px]">
                  <tr>
                    <th className="p-2.5 font-medium">Customer</th>
                    <th className="p-2.5 font-medium">Contact</th>
                    <th className="p-2.5 font-medium">City</th>
                    <th className="p-2.5 font-medium">Source</th>
                    <th className="p-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="bg-emerald-500/5 font-sans">
                    <td className="p-2.5 font-semibold text-foreground">Rahul Sharma</td>
                    <td className="p-2.5 font-mono text-foreground">9876543210</td>
                    <td className="p-2.5 text-foreground">Mumbai</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold rounded text-[10px] border border-emerald-500/30">
                        Google Sheet
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold rounded text-[10px]">
                        Open
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-muted/30 rounded-xl border">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Integration Complete!</span> All future leads will sync automatically.
              </div>
              <Button asChild size="sm" className="gap-1.5 bg-primary text-primary-foreground">
                <Link href="/dashboard/lead-pool">
                  Go to Lead Pool
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ),
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

      {/* Step Navigation Bar */}
      <div className="px-6 py-2.5 border-b bg-muted/20 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isDone = idx < currentStep;
            return (
              <button
                key={step.stepNumber}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold scale-102"
                    : isDone
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {isDone ? (
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span className="text-[10px] opacity-70">#{step.stepNumber}</span>
                )}
                <span>{step.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Body */}
      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Step Top Image (Placed directly above "Step 1 of 10 Open Google Sheet") */}
          {currentStepData.image && (
            <div className="w-full rounded-xl overflow-hidden border border-border/80 bg-muted/20 shadow-xs relative">
              <img
                src={currentStepData.image}
                alt={currentStepData.title}
                className="w-full h-auto max-h-[380px] object-cover rounded-xl"
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

          {/* Visual Screenshot / Interactive Mockup Frame */}
          <div className="pt-2">
            {currentStepData.renderVisual()}
          </div>
        </div>
      </div>

      {/* Bottom Footer Navigation */}
      <div className="px-6 py-3.5 border-t bg-card shrink-0 flex items-center justify-between">
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
            className="gap-1.5 bg-primary text-primary-foreground font-semibold cursor-pointer"
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
    </Card>
  );
}

// Backward-compatible alias
export const GoogleSheetsGuideModal = GoogleSheetsGuideSection;
