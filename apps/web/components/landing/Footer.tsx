const Footer = () => {
    return (
        <footer className="border-t border-border py-8">
            <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-1">
                    <span className="text-sm font-extrabold tracking-tighter text-foreground">PIX</span>
                    <span className="text-sm font-extrabold tracking-tighter text-primary">GEN</span>
                </div>
                <span className="label-mono">© 2026 All rights reserved</span>
            </div>
        </footer>
    );
};

export default Footer;
