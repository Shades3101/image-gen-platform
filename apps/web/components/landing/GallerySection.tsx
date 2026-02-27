import Image from "next/image";

const works = [
    { src: "/gallery-1.png", prompt: "Cyberpunk portrait, neon lights", size: "tall" },
    { src: "/gallery-2.png", prompt: "Underwater city, bioluminescent", size: "wide" },
    { src: "/hero-image.png", prompt: "Floating islands, fantasy landscape", size: "wide" },
    { src: "/gallery-3.png", prompt: "Enchanted forest, fireflies", size: "tall" },
];

const GallerySection = () => {
    return (
        <section id="work" className="py-32 border-b border-border">
            <div className="container mx-auto px-6">
                <div className="flex items-end justify-between mb-16">
                    <div>
                        <span className="label-mono">Selected Works</span>
                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mt-4 text-foreground">
                            MADE WITH <span className="text-primary">PIXGEN</span>
                        </h2>
                    </div>
                    <span className="label-mono hidden sm:block">Hover for prompt</span>
                </div>

                {/* Asymmetric grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1">
                    {/* Image 1 - tall left */}
                    <div className="md:col-span-5 md:row-span-2 group relative overflow-hidden">
                        <Image src={works[0]!.src} alt="PixGen AI generation" width={600} height={800} className="w-full h-full object-cover aspect-[3/4] md:aspect-auto md:h-full" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <span className="font-mono text-xs text-primary">→ &quot;{works[0]!.prompt}&quot;</span>
                        </div>
                    </div>

                    {/* Image 2 - top right */}
                    <div className="md:col-span-7 group relative overflow-hidden">
                        <Image src={works[1]!.src} alt="PixGen AI generation" width={800} height={450} className="w-full aspect-video object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <span className="font-mono text-xs text-primary">→ &quot;{works[1]!.prompt}&quot;</span>
                        </div>
                    </div>

                    {/* Image 3 - bottom right top */}
                    <div className="md:col-span-4 group relative overflow-hidden">
                        <Image src={works[2]!.src} alt="PixGen AI generation" width={500} height={500} className="w-full aspect-square object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <span className="font-mono text-xs text-primary">→ &quot;{works[2]!.prompt}&quot;</span>
                        </div>
                    </div>

                    {/* Image 4 - bottom right bottom */}
                    <div className="md:col-span-3 group relative overflow-hidden">
                        <Image src={works[3]!.src} alt="PixGen AI generation" width={400} height={400} className="w-full aspect-square object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <span className="font-mono text-xs text-primary">→ &quot;{works[3]!.prompt}&quot;</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GallerySection;
