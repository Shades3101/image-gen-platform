"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Home, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const TopBarContent = () => {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "camera";

    const navItems = [
        { label: "Camera", value: "camera" },
        { label: "Generate", value: "generate" },
        { label: "Models", value: "models" },
        { label: "Train", value: "train" },
        { label: "Packs", value: "packs" },
    ];

    return (
        <header className="h-16 border-b border-border bg-background sticky top-0 z-30 w-full">
            <div className="container h-full mx-auto flex items-center justify-between px-6">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-1">
                        <span className="text-xl font-extrabold tracking-tighter text-foreground">
                            PIX
                        </span>
                        <span className="text-xl font-extrabold tracking-tighter text-primary">
                            GEN
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 ml-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.value}
                                href={`/dashboard?tab=${item.value}`}
                                className={cn( "label-mono text-xs transition-colors py-1 border-b-2",
                                    activeTab === item.value
                                        ? "text-primary border-primary"
                                        : "text-foreground/60 border-transparent hover:text-foreground hover:border-foreground/30"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-accent rounded-full transition-colors text-foreground/70">
                        <Bell size={20} />
                    </button>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton>
                            <button className="bg-primary text-primary-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-foreground hover:text-background transition-colors">
                                Sign In
                            </button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </div>
        </header>
    );
};

const TopBar = () => {
    return (
        <Suspense fallback={<header className="h-16 border-b border-border bg-background sticky top-0 z-30 w-full" />}>
            <TopBarContent />
        </Suspense>
    );
};

export default TopBar;
