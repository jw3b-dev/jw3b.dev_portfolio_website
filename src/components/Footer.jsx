import { Github, Linkedin, Twitter, ArrowUp, Mail, FileText, Globe, Cpu, Shield, Activity } from "lucide-react";
import StoryLogo from "./StoryLogo";
import { Link } from "react-router-dom";
import ParticleCanvas from "./jw3b.devParticleCanvas";

const Footer = () => {
    
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { icon: Github, href: "https://github.com/jw3b", label: "GitHub" },
        { icon: Linkedin, href: "https://linkedin.com/in/jw3b", label: "LinkedIn" },
        { icon: Twitter, href: "https://twitter.com/jw3b_dev", label: "Twitter" }
    ];

    const sitemap = [
        { label: "Home", href: "/" },
        { label: "About", href: "/#about" },
        { label: "Services", href: "/#services" },
        { label: "Projects", href: "/#projects" },
        { label: "Mission Control", href: "/hire-me", highlight: true }
    ];

    return (
        <footer className="relative pt-20 pb-10 px-4 mt-auto w-full z-10 border-t border-white/5 bg-black/20 overflow-hidden text-center md:text-left">
             {/* Local Particles for Footer */}
             <div className="absolute inset-0 opacity-40 pointer-events-none">
                <ParticleCanvas />
             </div>

             {/* Massive Background Typography - Perfectly Centered */}
             <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.03] z-0 overflow-hidden">
                <span className="text-[20vw] font-black leading-none text-white tracking-tighter whitespace-nowrap">JW3B</span>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16 text-left">
                    
                    {/* Brand Block - Large */}
                    <div className="md:col-span-5 flex flex-col justify-between p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors duration-500 group relative overflow-hidden backdrop-blur-md">
                         <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         
                         <div className="mb-8">
                             <div className="flex items-center gap-3 mb-6">
                                <StoryLogo size={40} />
                                <span className="text-2xl font-bold tracking-tighter text-white uppercase">John Wellard</span>
                             </div>
                             <p className="text-stone-400 leading-relaxed max-w-sm">
                                Full-Stack Blockchain Engineering & Security Auditing. 
                                Building the decentralized future with mathematical precision and military-grade security.
                             </p>
                         </div>

                         <div className="flex gap-4">
                            {socialLinks.map((social) => (
                                <a 
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 rounded-full bg-white/5 text-stone-400 hover:text-white hover:bg-cyan-500/20 hover:scale-110 transition-all duration-300 border border-white/5 hover:border-cyan-500/30"
                                    aria-label={social.label}
                                >
                                    <social.icon size={20} />
                                </a>
                            ))}
                         </div>
                    </div>

                    {/* Navigation Block - Vertical List */}
                    <div className="md:col-span-3 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors duration-500 backdrop-blur-md flex flex-col">
                        <h4 className="text-sm font-mono font-bold text-stone-500 uppercase mb-6 tracking-widest pl-2 border-l-2 border-purple-500/50">Navigation</h4>
                        <nav className="flex flex-col gap-3">
                            {sitemap.map((link) => (
                                link.href.startsWith('/') && !link.href.includes('#') ? (
                                    <Link 
                                        key={link.label} 
                                        to={link.href}
                                        className={`text-lg font-medium transition-colors hover:translate-x-1 duration-300 w-fit ${link.highlight ? "text-cyan-400 hover:text-cyan-300" : "text-stone-300 hover:text-white"}`}
                                    >
                                        {link.label}
                                    </Link>
                                ) : (
                                    <a 
                                        key={link.label} 
                                        href={link.href}
                                        className={`text-lg font-medium transition-colors hover:translate-x-1 duration-300 w-fit ${link.highlight ? "text-cyan-400 hover:text-cyan-300" : "text-stone-300 hover:text-white"}`}
                                    >
                                        {link.label}
                                    </a>
                                )
                            ))}
                        </nav>
                    </div>

                    {/* Status & Contact - Stacked */}
                    <div className="md:col-span-4 flex flex-col gap-6">
                        
                        {/* System Status -> Availability */}
                        <div className="flex-1 p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-colors duration-500 backdrop-blur-md flex items-center justify-between">
                             <div>
                                <h4 className="text-xs font-mono text-stone-500 uppercase mb-1">Availability</h4>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    <span className="text-green-400 font-mono font-bold">OPEN FOR WORK</span>
                                </div>
                             </div>
                             <div className="flex gap-3 text-stone-500">
                                <Cpu size={18} />
                                <Shield size={18} />
                                <Activity size={18} />
                             </div>
                        </div>

                        {/* Contact Card */}
                         <div className="flex-1 p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-600/10 border border-white/10 hover:border-blue-400/30 transition-colors duration-500 backdrop-blur-md flex flex-col justify-center">
                            <h4 className="text-xs font-mono text-blue-300 uppercase mb-2">Initiate Comms</h4>
                            <a href="mailto:contact@jw3b.dev" className="text-xl font-bold text-white hover:text-blue-300 transition-colors truncate flex items-center gap-2 group">
                                <Mail size={20} className="group-hover:rotate-12 transition-transform" />
                                <span>contact@jw3b.dev</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer Bottom Line */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-base text-stone-500 font-mono">
                    <div className="mb-4 md:mb-0 flex items-center gap-2">
                        <span className="text-xl leading-none">&copy;</span> 
                        <span>{currentYear} John Wellard.</span>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        <a href="#" className="hover:text-white transition-colors">Privacy Protocol</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        
                        <button 
                            onClick={scrollToTop}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-stone-300 hover:text-white"
                        >
                            <span>TOP</span>
                            <ArrowUp size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
