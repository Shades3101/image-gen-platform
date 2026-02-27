"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Loader2, PackageOpen } from "lucide-react";

interface TPack {
    id: string;
    name: string;
    description: string;
    imageUrl1: string;
    imageUrl2: string;
}

interface TModel {
    id: string;
    name: string;
    thumbnail: string;
    trainingStatus: string;
}

const PacksTab = () => {
    const [packs, setPacks] = useState<TPack[]>([]);
    const [models, setModels] = useState<TModel[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<string>();
    const [loading, setLoading] = useState(true);
    const [generatingPack, setGeneratingPack] = useState<string | null>(null);
    const { getToken } = useAuth();

    useEffect(() => {
        (async () => {
            try {
                const [packsRes, modelsRes] = await Promise.all([
                    axios.get(`${BACKEND_URL}/pack/bulk`),
                    (async () => {

                        const token = await getToken();
                        return axios.get(`${BACKEND_URL}/models`, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            },
                        });
                    })(),
                ]);
                setPacks(packsRes.data.packs ?? []);
                const readyModels = modelsRes.data.models.filter(
                    (m: TModel) => m.trainingStatus === "Generated"
                );
                setModels(readyModels);
                if (readyModels.length > 0) {
                    setSelectedModelId(readyModels[0].id);
                }
            } catch (e) {
                console.error("Failed to load packs/models:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleGenerate = async (packId: string) => {

        if (!selectedModelId) {
            alert("Please select a model first.");
            return;
        }
        setGeneratingPack(packId);

        try {
            const token = await getToken();
            await axios.post(`${BACKEND_URL}/pack/generate`, { 
                packId, modelId: selectedModelId 
            },{
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            alert("Pack generation started! Check the Camera tab for results.");
        } catch (e) {
            console.error("Pack generation failed:", e);
            alert("Generation failed. Please try again.");
        } finally {
            setGeneratingPack(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Model Selector */}
            <div className="border-harsh bg-secondary p-6 space-y-4">
                <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tighter">Style Packs</h2>
                    <p className="label-mono text-xs">Select a model, then click a pack to generate images</p>
                </div>

                {models.length === 0 && !loading ? (
                    <div className="p-3 bg-background border-harsh text-xs text-muted-foreground">
                        No trained models available. Train a model first to use packs.
                    </div>
                ) : (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {models.map((model) => (
                            <div
                                key={model.id}
                                onClick={() => setSelectedModelId(model.id)}
                                className={`shrink-0 p-2 border cursor-pointer transition-all flex items-center gap-2 ${selectedModelId === model.id
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-foreground/30"
                                    }`}
                            >
                                {model.thumbnail && (
                                    <img src={model.thumbnail} alt={model.name} className="w-8 h-8 object-cover" />
                                )}
                                <span className="text-xs font-bold uppercase tracking-tight">{model.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Packs Grid */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <Card key={i} className="border-harsh bg-secondary p-6">
                            <Skeleton className="h-40 rounded mb-4" />
                            <Skeleton className="h-5 w-1/2 rounded mb-2" />
                            <Skeleton className="h-3 w-3/4 rounded" />
                        </Card>
                    ))}
                </div>
            )}

            {!loading && packs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                    <PackageOpen size={48} />
                    <p className="label-mono">No packs available</p>
                </div>
            )}

            {!loading && packs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {packs.map((pack) => (
                        <Card key={pack.id} className="group overflow-hidden border-harsh bg-secondary">
                            <div className="flex gap-1 p-2">
                                {pack.imageUrl1 && (
                                    <img src={pack.imageUrl1} alt={pack.name} className="w-1/2 aspect-square object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                )}
                                {pack.imageUrl2 && (
                                    <img src={pack.imageUrl2} alt={pack.name} className="w-1/2 aspect-square object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                )}
                            </div>
                            <div className="p-6 space-y-3">
                                <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-primary transition-colors">
                                    {pack.name}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{pack.description}</p>
                                <div className="pt-4 border-t border-border">
                                    <Button size="sm" onClick={() => handleGenerate(pack.id)}
                                        disabled={!selectedModelId || generatingPack === pack.id}
                                        className="bg-primary text-primary-foreground label-mono text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                                    >
                                        {generatingPack === pack.id ? (
                                            <><Loader2 size={12} className="mr-2 animate-spin" /> Generating...</>
                                        ) : (
                                            <><ShoppingBag size={12} className="mr-2" /> Generate</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PacksTab;
