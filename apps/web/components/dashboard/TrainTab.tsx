"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "@/components/upload";
import { Loader2, Cpu } from "lucide-react";

type ModelType = "Man" | "Woman" | "Others";
type Ethnicity = "White" | "Black" | "AsianAmerican" | "EastAsian" | "SouthEastAsian" | "SouthAsian" | "MiddleEastern" | "Pacific" | "Hispanic";
type EyeColor = "Brown" | "Blue" | "Hazel" | "Gray";

const TrainTab = () => {
    const { getToken } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [type, setType] = useState<ModelType>("Man");
    const [age, setAge] = useState<number | undefined>();
    const [ethnicity, setEthnicity] = useState<Ethnicity | undefined>();
    const [eyeColor, setEyeColor] = useState<EyeColor | undefined>();
    const [bald, setBald] = useState(false);
    const [zipUrl, setZipUrl] = useState("");

    const canProceedStep1 = name && type && age && ethnicity && eyeColor;

    async function trainModel() {

        if (!canProceedStep1 || !zipUrl) {
            return;
        }

        setSubmitting(true);

        try {
            const token = await getToken();
            await axios.post(`${BACKEND_URL}/ai/training`, {
                name,
                zipUrl,
                type,
                age,
                ethnicity,
                eyeColor,
                bald
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("Training request sent successfully");
            setSubmitted(true);
            setStep(3);
        } catch (e) {
            console.error("Training failed:", e);
            alert("Training request failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 gap-4">
                {[
                    { id: 1, label: "Model Details" },
                    { id: 2, label: "Upload Images" },
                    { id: 3, label: "Training" },
                ].map((s) => (
                    <div key={s.id} className="flex items-center gap-3 shrink-0">
                        <div className={`w-8 h-8 flex items-center justify-center font-mono text-xs border-harsh ${step >= s.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                            {s.id}
                        </div>
                        <span className={`label-mono ${step === s.id ? "text-primary" : "text-muted-foreground"}`}>{s.label}</span>
                        {s.id < 3 && <div className="w-12 h-px bg-border" />}
                    </div>
                ))}
            </div>

            <Card className="p-8 border-harsh bg-secondary space-y-8">
                {/* Step 1: Model Details */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="label-mono">Model Name *</Label>
                                <Input placeholder="e.g. My Portrait v1" className="border-harsh bg-background h-12" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="label-mono">Age *</Label>
                                <Input type="number" placeholder="e.g. 25" className="border-harsh bg-background h-12" value={age ?? ""}
                                    onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="label-mono">Type *</Label>
                                <Select value={type} onValueChange={(v) => setType(v as ModelType)}>
                                    <SelectTrigger className="border-harsh bg-background h-12">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="border-harsh bg-secondary">
                                        <SelectItem value="Man">Man</SelectItem>
                                        <SelectItem value="Woman">Woman</SelectItem>
                                        <SelectItem value="Others">Others</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="label-mono">Ethnicity *</Label>
                                <Select value={ethnicity} onValueChange={(v) => setEthnicity(v as Ethnicity)}>
                                    <SelectTrigger className="border-harsh bg-background h-12">
                                        <SelectValue placeholder="Select ethnicity" />
                                    </SelectTrigger>
                                    <SelectContent className="border-harsh bg-secondary">
                                        <SelectItem value="White">White</SelectItem>
                                        <SelectItem value="Black">Black</SelectItem>
                                        <SelectItem value="AsianAmerican">Asian American</SelectItem>
                                        <SelectItem value="EastAsian">East Asian</SelectItem>
                                        <SelectItem value="SouthEastAsian">South East Asian</SelectItem>
                                        <SelectItem value="SouthAsian">South Asian</SelectItem>
                                        <SelectItem value="MiddleEastern">Middle Eastern</SelectItem>
                                        <SelectItem value="Pacific">Pacific</SelectItem>
                                        <SelectItem value="Hispanic">Hispanic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="label-mono">Eye Color *</Label>
                                <Select value={eyeColor} onValueChange={(v) => setEyeColor(v as EyeColor)}>
                                    <SelectTrigger className="border-harsh bg-background h-12">
                                        <SelectValue placeholder="Select eye color" />
                                    </SelectTrigger>
                                    <SelectContent className="border-harsh bg-secondary">
                                        <SelectItem value="Brown">Brown</SelectItem>
                                        <SelectItem value="Blue">Blue</SelectItem>
                                        <SelectItem value="Hazel">Hazel</SelectItem>
                                        <SelectItem value="Gray">Gray</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="label-mono">Bald</Label>
                                <div className="flex items-center gap-3 h-12">
                                    <Switch checked={bald} onCheckedChange={setBald} />
                                    <span className="text-xs text-muted-foreground">{bald ? "Yes" : "No"}</span>
                                </div>
                            </div>
                        </div>

                        <Button onClick={() => setStep(2)} disabled={!canProceedStep1}
                            className="w-full bg-primary text-primary-foreground font-black uppercase tracking-widest h-14 disabled:opacity-40">
                            Continue to Upload →
                        </Button>
                    </div>
                )}

                {/* Step 2: Upload */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Upload onUploadDone={(url) => setZipUrl(url)} />

                        {zipUrl && (
                            <div className="p-3 bg-primary/10 border border-primary/30 text-xs label-mono text-primary">
                                ✓ Images uploaded successfully
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-harsh label-mono py-6">
                                Back
                            </Button>
                            <Button onClick={trainModel} disabled={!zipUrl || submitting}
                                className="flex-[2] bg-primary text-primary-foreground font-black uppercase tracking-widest py-6 disabled:opacity-40">
                                
                                {submitting ? (
                                    <><Loader2 className="mr-2 animate-spin" size={18} /> Submitting...</>
                                ) : (
                                    "Start Training"
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Success */}
                {step === 3 && submitted && (
                    <div className="text-center py-12 space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="relative mx-auto w-24 h-24">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-primary">
                                <Cpu size={32} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold uppercase tracking-tighter">Training Initiated</h3>
                            <p className="text-sm label-mono text-muted-foreground">Estimated time: 15-20 minutes</p>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Your model &quot;{name}&quot; is now training. Check the Models tab to track its progress.
                        </p>
                        <Button onClick={() => router.push("/dashboard?tab=models")}
                            className="bg-primary text-primary-foreground font-black uppercase tracking-widest px-8">
                            View Models
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TrainTab;
