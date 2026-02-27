"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

const CtaSection = () => {
    return (
        <section id="start" className="py-32">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-8">
                        <span className="label-mono">Get Started</span>
                        <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter mt-4 text-foreground leading-[0.95]">
                            50 FREE
                            <br />
                            GENERATIONS.
                            <br />
                            <span className="text-primary">NO CARD.</span>
                        </h2>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <p className="text-secondary-foreground font-light text-lg leading-relaxed">
                            Join 500K+ creators who stopped compromising on visuals. Your imagination is the only requirement.
                        </p>

                        <SignedIn>
                            <Link href="/dashboard">
                                <button className="bg-primary text-primary-foreground px-8 py-5 text-sm font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors w-full text-center cursor-pointer">
                                    Go to Dashboard →
                                </button>
                            </Link>
                        </SignedIn>

                        <SignedOut>
                            <SignInButton>
                                <button className="bg-primary text-primary-foreground px-8 py-5 text-sm font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors w-full text-center cursor-pointer">
                                    Start Creating →
                                </button>
                            </SignInButton>
                        </SignedOut>

                        <span className="label-mono text-center">No credit card required</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CtaSection;
