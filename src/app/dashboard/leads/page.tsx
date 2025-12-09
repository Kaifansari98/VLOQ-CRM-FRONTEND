
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function LeadsGenerationPage() {
  return (
    <>

        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          {/* Left side - SidebarTrigger + Breadcrumb */}
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2 pr-4">
            <AnimatedThemeToggler />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {/* ✅ Generate Leads Modal Trigger */}

            <Card className="aspect-video flex items-center justify-center cursor-pointer hover:bg-muted/50 transition">
              <p className="text-muted-foreground">
                Click here to Generate Leads
              </p>
            </Card>
            <Card className="aspect-video flex items-center justify-center">
              <p className="text-muted-foreground">Conversion Rates</p>
            </Card>
            <Card className="aspect-video flex items-center justify-center">
              <p className="text-muted-foreground">Lead Sources</p>
            </Card>
          </div>

          <Card className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-2">
                Lead Management Dashboard
              </h3>
              <p className="text-muted-foreground">
                Your lead generation tools will go here
              </p>
            </div>
          </Card>
        </div>
 
    </>
  );
}
