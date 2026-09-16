"use client";

import Link from "next/link";
import { FileText, ArrowLeft, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-card py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">Furnix CRM</span>
        </div>
        <Link href="/login" passHref legacyBehavior>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-sm">
              Last Updated: August 18, 2026
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Welcome to Furnix CRM. These Terms of Service govern your use of our CRM software platform and related integrations. By accessing or using our services, you agree to comply with and be bound by these Terms.
            </p>
          </div>

          <hr className="border-border" />

          {/* Terms Sections */}
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" /> 1. Acceptance of Terms
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                By creating an account, logging into the platform, or integrating third-party tools (such as Facebook Lead Ads), you agree that you have read, understood, and agree to be bound by these terms. If you do not agree to these terms, you must not access or use the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold">2. CRM Platform Usage & Licensing</h2>
              <p className="leading-relaxed text-muted-foreground">
                Furnix CRM grants you a limited, non-exclusive, non-transferable, and revocable license to access and use the platform solely for internal business operations, including managing leads, tracking projects, recording call logs, and communicating with customers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold">3. Account Security & User Responsibilities</h2>
              <p className="leading-relaxed text-muted-foreground">
                Users are responsible for keeping their login credentials secure. You must immediately notify support of any unauthorized use of your account or security breaches. Furnix CRM is not liable for losses caused by unauthorized use of your account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold">4. Meta Lead Ads & Third-Party Integrations</h2>
              <p className="leading-relaxed text-muted-foreground">
                Our platform provides integrations with third-party tools, including Meta (Facebook & Instagram) Graph APIs to download leads from Lead Ads. 
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>You must comply with Meta's developer policies and terms of service when linking your Facebook Page.</li>
                <li>You must ensure you have valid permissions from your customers to collect their data and contact them for marketing purposes.</li>
                <li>We do not guarantee the uptime, reliability, or accuracy of data fetched from third-party APIs.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold">5. Prohibited Activities</h2>
              <p className="leading-relaxed text-muted-foreground">
                You agree not to use the platform to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Upload malware, execute unauthorized scripts, or compromise server infrastructure.</li>
                <li>Collect or process user information without consent, violating privacy laws.</li>
                <li>Share, rent, or sell CRM access to unauthorized third parties.</li>
                <li>Bypass rate limit guards, causing strain or degradation of CRM resources.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold">6. Limitation of Liability</h2>
              <p className="leading-relaxed text-muted-foreground">
                To the maximum extent permitted by law, Furnix CRM and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of or inability to use the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-muted-foreground" /> 7. Contact Information
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="p-4 bg-muted/30 rounded-lg space-y-1 text-sm border border-border">
                <p><strong>Email Support:</strong> vloq.info@gmail.com</p>
                <p><strong>CRM Platform Support:</strong> support@furnixcrm.com</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-xs text-muted-foreground bg-card">
        <p>&copy; {new Date().getFullYear()} Furnix CRM Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
