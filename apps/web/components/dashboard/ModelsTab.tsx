"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface TModel {
    id: string;
    name: string;
    type: string;
    thumbnail: string;
    trainingStatus: string;
    createdAt: string;
}

const ModelsTab = () => {
    const [models, setModels] = useState<TModel[]>([]);
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth();

    useEffect(() => {
        (async () => {
            try {
                console.log("Fetching models...");
                const token = await getToken();
                const response = await axios.get(`${BACKEND_URL}/models`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                });

                setModels(response.data.models);
            } catch (e) {

                console.error("Failed to fetch models:", e);
            } finally {
                console.log("Models fetched.");
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold uppercase tracking-tight">Your Models</h2>
                <Link href="/dashboard?tab=train">
                    <button className="bg-primary text-primary-foreground uppercase label-mono py-2 px-4 h-auto text-[10px] tracking-[0.2em] font-black cursor-pointer hover:bg-foreground hover:text-background transition-colors">
                        Train New Model
                    </button>
                </Link>
            </div>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-6 border-harsh bg-secondary space-y-4">
                            <Skeleton className="h-10 w-10 rounded" />
                            <Skeleton className="h-5 w-3/4 rounded" />
                            <Skeleton className="h-3 w-1/2 rounded" />
                        </Card>
                    ))}
                </div>
            )}

            {!loading && models.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                    <UserCircle size={48} />
                    <p className="label-mono">No models trained yet</p>
                    <Link href="/dashboard?tab=train">
                        <button className="bg-primary text-primary-foreground uppercase font-bold tracking-widest text-xs px-6 py-3 cursor-pointer">
                            Train Your First Model
                        </button>
                    </Link>
                </div>
            )}

            {!loading && models.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {models.map((model) => (
                        <Card key={model.id} className="p-6 border-harsh bg-secondary space-y-4 hover:border-primary transition-colors group">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-background border-harsh text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors overflow-hidden">
                                    {model.thumbnail ? (
                                        <img src={model.thumbnail} alt={model.name} className="w-6 h-6 object-cover" />
                                    ) : (
                                        <UserCircle size={24} />
                                    )}
                                </div>
                                <Badge className={
                                        model.trainingStatus === "Generated"
                                            ? "bg-primary text-primary-foreground border-none label-mono px-2 py-0.5"
                                            : model.trainingStatus === "Failed"
                                                ? "bg-destructive text-white border-none label-mono px-2 py-0.5"
                                                : "bg-muted text-muted-foreground border-none label-mono px-2 py-0.5"
                                    }
                                >
                                    {model.trainingStatus === "Generated" ? "Ready" : model.trainingStatus || "Pending"}
                                </Badge>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold uppercase tracking-tighter mb-1 truncate">{model.name}</h3>
                                <p className="label-mono text-[10px]">{model.type}</p>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Info size={12} /> {new Date(model.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ModelsTab;
