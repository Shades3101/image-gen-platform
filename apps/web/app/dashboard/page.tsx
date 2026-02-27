"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import CameraTab from "@/components/dashboard/CameraTab";
import GenerateTab from "@/components/dashboard/GenerateTab";
import ModelsTab from "@/components/dashboard/ModelsTab";
import TrainTab from "@/components/dashboard/TrainTab";
import PacksTab from "@/components/dashboard/PacksTab";

function DashboardContent() {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "camera";

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-4xl font-extrabold uppercase tracking-tighter mb-2">
                    Dashboard
                </h1>
                <p className="label-mono">Manage your AI creations and models</p>
            </header>

            <Tabs value={activeTab} className="w-full">
                <div className="mt-2">
                    <TabsContent value="camera">
                        <CameraTab />
                    </TabsContent>
                    <TabsContent value="generate">
                        <GenerateTab />
                    </TabsContent>
                    <TabsContent value="models">
                        <ModelsTab />
                    </TabsContent>
                    <TabsContent value="train">
                        <TrainTab />
                    </TabsContent>
                    <TabsContent value="packs">
                        <PacksTab />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

export default function Dashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto min-h-full">
            <Suspense fallback={<div className="label-mono">Loading dashboard...</div>}>
                <DashboardContent />
            </Suspense>
        </div>
    );
}