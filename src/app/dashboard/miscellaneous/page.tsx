import { redirect } from "next/navigation";

export default function MiscellaneousRootPage() {
  redirect("/dashboard/miscellaneous/awaiting-approval");
}
