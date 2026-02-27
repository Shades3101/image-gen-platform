"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="container mx-auto flex items-center justify-between px-6 py-5">
                <Link href="/" className="flex items-center gap-1">
                    <span className="text-2xl font-extrabold tracking-tighter text-foreground">
                        PIX
                    </span>
                    <span className="text-2xl font-extrabold tracking-tighter text-primary">
                        GEN
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-10">
                    <a href="#work" className="label-mono hover:text-primary transition-colors">
                        Work
                    </a>
                    <a href="#features" className="label-mono hover:text-primary transition-colors">
                        Features
                    </a>
                    <a href="#start" className="label-mono hover:text-primary transition-colors">
                        Start
                    </a>
                </div>

                <div className="flex items-center gap-4">
                    <SignedIn>
                        <Link href="/dashboard">
                            <button className="bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors cursor-pointer">
                                Launch App →
                            </button>
                        </Link>
                        <UserButton />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton>
                            <button className="bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors cursor-pointer">
                                Sign In →
                            </button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
