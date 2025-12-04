"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/store";
import { useParams } from "next/navigation";
import { usePaymentLogs } from "@/hooks/booking-stage/use-booking";
import {
  ExternalLink,
  Calendar,
  User,
  FileText,
  IndianRupee,
  Clock,
} from "lucide-react";

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate().toString().padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return {
    full: `${day} ${month} ${year}`,
    time: `${hours}:${minutes} ${ampm}`,
  };
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -50, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const dotVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10,
      delay: 0.2,
    },
  },
};

const lineVariants = {
  hidden: { height: 0 },
  visible: {
    height: "100%",
    transition: {
      duration: 1.5,
      ease: "easeInOut",
    },
  },
};

type PaymentLogsProps = {
  leadIdProps?: number;
};
export default function PaymentLogs({ leadIdProps }: PaymentLogsProps) {
  const { lead } = useParams();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) || 0;

  // 1. URL param → 2. props → 3. null fallback
  const urlLeadId = lead ? Number(lead) : null;
  const finalLeadId = urlLeadId || leadIdProps;

  // If still null → show fallback UI
  if (!finalLeadId) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
        Lead ID not available.
      </div>
    );
  }

  // Use finalLeadId for API
  const { data, isLoading } = usePaymentLogs(finalLeadId, vendorId);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-2"
          />
          <p className="text-muted-foreground font-medium">
            Loading payment logs...
          </p>
        </motion.div>
      </div>
    );
  }

  const logs = data?.payment_logs || [];

  if (!logs.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
      >
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <IndianRupee className="w-10 h-10 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium text-lg">
          No payment records available.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-2 py-1">
      {/* <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Payment Timeline
        </h2>
        <p className="text-muted-foreground">Track all payment transactions</p>
      </motion.div> */}

      {/* Scrollable container for cards */}
      <div className="overflow-y-auto pr-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative pl-16"
        >
          {/* Animated vertical line */}
          <motion.div
            variants={lineVariants as any}
            className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary origin-top"
            style={{ height: `calc(100% - 2rem)` }}
          />

          {logs
            .filter((log) => log.amount > 0) // ✅ Only show logs with amount > 0
            .map((log, index) => (
              <motion.div
                key={log.id}
                variants={itemVariants as any}
                className="relative mb-6 last:mb-0"
              >
                {/* Animated timeline dot with glow, above the line */}
                <motion.div
                  variants={dotVariants as any}
                  className="absolute -left-[35px] top-6 z-20" // Increased z-index
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(59, 130, 246, 0.4)",
                        "0 0 0 8px rgba(59, 130, 246, 0)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                    className="w-6 h-6 -mx-4 rounded-full bg-primary border-4 border-background shadow-lg"
                  />
                </motion.div>

                {/* Content card with gradient border effect */}
                <motion.div
                  // whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="overflow-hidden border-[1px] duration-300">
                    {/* Enhanced Header with amount */}
                    <div className="px-6 border-b flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4 mb-2">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Amount Received
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-primary">
                              ₹{log.amount.toLocaleString("en-IN")}
                            </span>
                            {/* <Badge variant="outline" className="text-sm bg-primary/10 text-primary border-primary/30">
                            Confirmed
                          </Badge> */}
                          </div>
                        </div>
                      </div>
                      {log.payment_file && (
                        <Button
                          variant="default"
                          size="lg"
                          onClick={() =>
                            window.open(log.payment_file!, "_blank")
                          }
                          className="gap-2 bg-primary/90 hover:bg-primary transition-all shadow-md hover:shadow-lg"
                        >
                          <ExternalLink size={18} />
                          View Proof
                        </Button>
                      )}
                    </div>

                    {/* Details section with icons */}
                    <div className="px-4 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Paid On
                            </p>
                            <p className="text-sm font-medium">
                              {formatDate(log.payment_date).full}
                            </p>
                            {/* <p className="text-xs text-muted-foreground">
                              {formatDate(log.payment_date).time}
                            </p> */}
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ x: 5 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Entry Date
                            </p>
                            <p className="text-sm font-medium">
                              {formatDate(log.entry_date).full}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(log.entry_date).time}
                            </p>
                          </div>
                        </motion.div>
                      </div>

                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <User className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Entered By
                          </p>
                          <p className="text-sm font-medium">
                            {log.entered_by}
                          </p>
                        </div>
                      </motion.div>

                      {log.payment_text && (
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Description
                            </p>
                            <p className="text-sm font-medium leading-relaxed">
                              {log.payment_text}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
        </motion.div>
      </div>
    </div>
  );
}
