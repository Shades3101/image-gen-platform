const features = [
    {
        number: "01",
        title: "Describe Anything",
        description: "Type a sentence. Get a masterpiece. Our models understand context, mood, composition, and style from natural language.",
    },
    {
        number: "02",
        title: "30+ Art Styles",
        description: "Photorealism, oil painting, anime, watercolor, concept art — switch between styles with a single word.",
    },
    {
        number: "03",
        title: "Own Everything",
        description: "Full commercial rights on every pixel. Use it on products, campaigns, albums — it's yours.",
    },
    {
        number: "04",
        title: "Ship Fast",
        description: "Sub-5 second generation. 4K upscaling. Batch processing. Built for professionals who don't wait.",
    },
];

const FeaturesSection = () => {
    return (
        <section id="features" className="py-32 border-b border-border">
            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
                    {/* Left sticky label */}
                    <div className="lg:w-1/3">
                        <span className="label-mono">Capabilities</span>
                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mt-4 text-foreground">
                            NOT YOUR
                            <br />
                            AVERAGE
                            <br />
                            <span className="text-primary">AI TOOL.</span>
                        </h2>
                    </div>

                    {/* Right feature list */}
                    <div className="lg:w-2/3">
                        {features.map((feature, index) => (
                            <div
                                key={feature.number}
                                className={`py-10 ${index !== features.length - 1 ? "border-b border-border" : ""} group`}
                            >
                                <div className="flex items-start gap-8">
                                    <span className="font-mono text-sm text-primary font-bold mt-1">
                                        {feature.number}
                                    </span>
                                    <div>
                                        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-secondary-foreground mt-3 text-base leading-relaxed max-w-lg font-light">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
