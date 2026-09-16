"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, ArrowLeft, Mail, Info, CheckCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DataDeletionPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      alert("Please provide at least an email address or phone number.");
      return;
    }
    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      setRequestSubmitted(true);
      const generatedId = "DEL-" + Math.floor(100000 + Math.random() * 900000);
      setTicketId(generatedId);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-card py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2">
          <Trash2 className="h-6 w-6 text-destructive" />
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
              User Data Deletion Instructions
            </h1>
            <p className="text-muted-foreground text-sm">
              Last Updated: August 18, 2026
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground">
              If you have interacted with our lead generation forms on Facebook or Instagram and wish to request the removal of your personal information from our CRM system, you can do so easily by following the instructions below.
            </p>
          </div>

          <hr className="border-border" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Instructions */}
            <div className="md:col-span-7 space-y-6">
              <section className="space-y-3">
                <h2 className="text-2xl font-bold">1. How to Request Deletion</h2>
                <p className="leading-relaxed text-muted-foreground">
                  You can request the deletion of your personal data (name, email, phone number, and custom questionnaire answers) at any time. We process all deletion requests within 24 to 48 hours.
                </p>
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Email Deletion Request</p>
                    <p className="text-sm text-muted-foreground">
                      Send an email to <span className="font-semibold text-foreground">vloq.info@gmail.com</span> or <span className="font-semibold text-foreground">support@furnixcrm.com</span> with the subject line <strong>"Data Deletion Request"</strong>. Include the email or phone number you used in the lead form.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-bold">2. Remove Permissions on Facebook</h2>
                <p className="leading-relaxed text-muted-foreground text-sm">
                  If you want to revoke our app's access to your Facebook account data, you can do so directly inside Facebook:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Go to your Facebook Profile's <strong>Settings & Privacy &gt; Settings</strong>.</li>
                  <li>In the left sidebar, click on <strong>Apps and Websites</strong>.</li>
                  <li>Find <strong>Furnix CRM</strong> (or the associated app).</li>
                  <li>Click <strong>Remove</strong> to revoke all future data permissions.</li>
                </ol>
              </section>
            </div>

            {/* Right Column: Interactive Form */}
            <div className="md:col-span-5">
              <div className="border border-border bg-card rounded-xl p-6 shadow-xs">
                {!requestSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-destructive" /> Request Deletion Form
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Use this form to submit an instant data deletion request. We will query our database for matching records and queue them for purging.
                    </p>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-semibold">
                        Email Address (Optional)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-background text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs font-semibold">
                        Phone Number (Optional)
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+919876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-background text-sm"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="destructive"
                      className="w-full text-sm font-semibold"
                      disabled={loading || (!email && !phone)}
                    >
                      {loading ? "Registering request..." : "Submit Deletion Request"}
                    </Button>

                    <div className="flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed mt-2">
                      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        Submitting this form will mark all leads containing these details as requested for deletion and queue them for deletion in our PostgreSQL database.
                      </span>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto animate-bounce" />
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-green-600">Request Registered!</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your request has been successfully registered. Our support team will locate and delete all matching data.
                      </p>
                      <div className="p-3 bg-muted rounded-lg border border-border inline-block text-xs font-mono">
                        Ticket ID: <span className="font-bold text-foreground">{ticketId}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRequestSubmitted(false);
                        setEmail("");
                        setPhone("");
                      }}
                      className="mt-2 text-xs"
                    >
                      Submit Another Request
                    </Button>
                  </div>
                )}
              </div>
            </div>
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
