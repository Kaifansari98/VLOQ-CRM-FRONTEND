"use client";

import Link from "next/link";
import { Shield, ArrowLeft, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-card py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
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
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-sm">
              Last Updated: August 18, 2026
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground">
              At Furnix CRM, we respect your privacy and are committed to protecting the personal data you share with us. This Privacy Policy explains how we collect, use, store, and disclose your personal information when you use our CRM platform and related services.
            </p>
          </div>

          <hr className="border-border" />

          {/* Policy Sections */}
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" /> 1. Information We Collect
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                We may collect personal information that you provide to us directly, or that is shared with us through integrations. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Contact details:</strong> Name, email address, phone number, and mailing address.</li>
                <li><strong>Account details:</strong> Username, password, and vendor association.</li>
                <li><strong>Business data:</strong> Lead information, customer conversation logs, call outcomes, and task statuses.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold">2. Meta Lead Ads Integration & Data Processing</h2>
              <p className="leading-relaxed text-muted-foreground">
                Furnix CRM integrates with Meta (Facebook & Instagram) APIs to automatically synchronize leads generated from your Facebook Lead Ads campaigns. 
              </p>
              <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
                <p className="font-semibold text-sm">How we handle data received from Meta:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>We retrieve lead details (such as names, emails, phone numbers, and custom questionnaire answers) directly via Meta Graph APIs when a user submits a lead form.</li>
                  <li>This data is immediately stored in your secure PostgreSQL database to allow your sales representatives and telecallers to follow up with potential customers.</li>
                  <li>We do not sell, rent, or distribute any data retrieved from Meta to third parties.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold">3. How We Use Your Information</h2>
              <p className="leading-relaxed text-muted-foreground">
                We use the collected information for the following business purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>To provide, maintain, and improve the Furnix CRM platform functions.</li>
                <li>To enable lead tracking, automated assignments, and telecaller logs.</li>
                <li>To send system notifications, email alerts (via Brevo), and in-app notifications.</li>
                <li>To ensure compliance with local legal requirements and prevent fraudulent access.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold">4. Data Sharing & Disclosures</h2>
              <p className="leading-relaxed text-muted-foreground">
                We only share your information with trusted third-party services necessary for operating the CRM (such as database hosting, Firebase notification services, and email providers like Brevo). We do not share data with third-party advertisers. We may disclose data if required by law or in response to valid legal requests by public authorities.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold">5. Data Retention & Deletion Rights</h2>
              <p className="leading-relaxed text-muted-foreground">
                We store your personal data only as long as necessary to provide CRM services to your organization. Users can request the deletion of their accounts or any personal data retrieved from Meta Lead Ads campaigns at any time.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                For detailed instructions and to request data removal, please visit our public{" "}
                <Link href="/data-deletion" className="text-primary hover:underline font-semibold">
                  Data Deletion Instructions Page
                </Link>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" /> 6. Contact Us
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data safety, you can contact us at:
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
