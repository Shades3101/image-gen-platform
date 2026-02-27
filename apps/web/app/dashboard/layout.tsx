import TopBar from "@/components/dashboard/TopBar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto relative w-full">
                {children}
            </main>
        </div>
    );
}
