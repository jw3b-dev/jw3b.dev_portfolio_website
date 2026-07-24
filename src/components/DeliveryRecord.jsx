import { motion } from "framer-motion";
import { Factory, Globe2, Building2 } from "lucide-react";

// The delivery record — the register's lead asset (PORTFOLIO_REFERENCE.md §2/§7):
// two decades of municipal water infrastructure across seven countries, before
// Web3. Pairs with AuditStats: audit scoreboard above, delivery record here.
// All three figures are artifact-verified; don't add numbers that aren't.
const RECORD = [
    { icon: Factory, value: "20+", label: "Industrial plants delivered" },
    { icon: Globe2, value: "7", label: "Countries" },
    { icon: Building2, value: "5", label: "Companies founded & run" },
];

const DeliveryRecord = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="relative max-w-6xl mx-auto mb-4 rounded-2xl glass-panel border border-white/5 overflow-hidden"
        >
            {/* PM-green accent — this band is the Deliver hat's proof */}
            <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-green-500 to-green-600" />

            <div className="flex flex-col lg:flex-row items-stretch">
                {/* Framing */}
                <div className="flex-1 p-6 lg:p-8">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-green-400">
                        Delivery Record — Before Web3
                    </span>
                    <p className="mt-3 text-stone-300 leading-relaxed max-w-2xl">
                        Two decades delivering infrastructure where you don&apos;t get a second
                        deploy — municipal water plants across seven countries, now on-chain
                        systems. Same discipline: prove it before you ship it, and write down
                        what you couldn&apos;t prove.
                    </p>
                </div>

                {/* Verified figures */}
                <div className="flex items-center justify-around lg:justify-end gap-6 lg:gap-10 px-6 pb-6 lg:p-8 lg:pl-0">
                    {RECORD.map(({ icon: Icon, value, label }) => (
                        <div key={label} className="flex flex-col items-center lg:items-end text-center lg:text-right">
                            <div className="flex items-center gap-2">
                                <Icon size={16} className="text-green-400/70" />
                                <span className="text-3xl font-bold font-mono text-white">{value}</span>
                            </div>
                            <span className="mt-1 text-[11px] font-mono uppercase tracking-wider text-stone-500 max-w-[9rem]">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default DeliveryRecord;
