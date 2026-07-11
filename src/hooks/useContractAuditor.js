import { useCallback } from 'react';
import { AGENT_AUDIT_URL } from '../config/worker';
import { useAgentStream } from './useAgentStream';

/**
 * useContractAuditor — streams a Solidity audit from the Worker `/audit` route.
 * Thin wrapper over useAgentStream: a deterministic heuristics table streams
 * first, then the AI analysis.
 */
export const useContractAuditor = () => {
    const { output, run, isLoading, error, reset } = useAgentStream(AGENT_AUDIT_URL);

    const auditContract = useCallback(
        (code) => {
            if (!code || !code.trim()) return;
            return run({ code });
        },
        [run],
    );

    return { report: output, auditContract, isLoading, error, reset };
};
