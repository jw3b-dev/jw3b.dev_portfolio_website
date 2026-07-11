/**
 * Unlock Protocol Lock Addresses
 * Mapped to jw3b.dev service tiers as per Website_Upgrade_Strategy.md
 */
export const SERVICE_LOCKS = {
  // Retainer Tiers
  RETAINER_PREMIUM: "0x...", // Premium ($12,500)
  RETAINER_STANDARD: "0x...", // Standard ($10,000)
  RETAINER_FRACTIONAL: "0x...", // Fractional ($6,000)
  
  // Tactical Ops
  SECURITY_LITE: "0x...", // Security Review Lite ($500)
  SPRINT_FACILITATION: "0x...", // Sprint Facilitation ($2,500)
};

/**
 * Mapping of Service Package Names to Lock IDs
 * Used by MissionControl.jsx to resolve addresses at runtime.
 */
export const PACKAGE_TO_LOCK = {
  "Fractional CSO": "RETAINER_PREMIUM",
  "Resident Auditor": "RETAINER_STANDARD",
  "Security Advisor": "RETAINER_FRACTIONAL",
  
  "Tech Lead / CTO": "RETAINER_PREMIUM",
  "Standard Engineer": "RETAINER_STANDARD",
  "Fractional Dev": "RETAINER_FRACTIONAL",
  
  "Head of Product": "RETAINER_PREMIUM",
  "Delivery Lead": "RETAINER_STANDARD",
  "Fractional PM": "RETAINER_FRACTIONAL",
  
  "Security Review Lite": "SECURITY_LITE",
  "Sprint Facilitation": "SPRINT_FACILITATION",
};
