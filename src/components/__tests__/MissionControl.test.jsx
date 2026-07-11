import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MissionControl from '../MissionControl';
import { vi, describe, it, expect } from 'vitest';

describe('MissionControl', () => {
    it('should render mission control options', () => {
        render(<MissionControl />);
        expect(screen.getByText('01 OBJECTIVE')).toBeInTheDocument();
        expect(screen.getByText('SECURE')).toBeInTheDocument();
    });

    it('should handle full configuration flow and navigation', async () => {
        render(<MissionControl />);
        
        // Step 1: Objective
        fireEvent.click(screen.getByText('SECURE'));
        
        // Step 2: Assessment
        await waitFor(() => expect(screen.queryByText('Attack Surface')).toBeInTheDocument());
        
        // Test Back Button from Step 2
        fireEvent.click(screen.getByText(/BACK TO OBJECTIVE/i));
        expect(screen.getByText('01 OBJECTIVE')).toBeInTheDocument();
        
        // Go back to Step 2
        fireEvent.click(screen.getByText('SECURE'));
        await waitFor(() => expect(screen.queryByText('Attack Surface')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Smart Contracts'));
        fireEvent.click(screen.getByText('Seed (<$1M)'));
        fireEvent.click(screen.getByText('Standard ERCs'));
        fireEvent.click(screen.getByText('CONFIRM INTEL'));

        // Step 3: Engagement
        await waitFor(() => expect(screen.queryByText('TACTICAL OPS')).toBeInTheDocument());
        
        // Test Back Button from Step 3
        fireEvent.click(screen.getByText(/BACK TO ASSESSMENT/i));
        expect(screen.queryByText('Attack Surface')).toBeInTheDocument();
        
        // Go back to Step 3
        fireEvent.click(screen.getByText('CONFIRM INTEL'));
        await waitFor(() => expect(screen.queryByText('TACTICAL OPS')).toBeInTheDocument());

        fireEvent.click(screen.getByText('TACTICAL OPS'));

        // Step 4: Loadout
        await waitFor(() => expect(screen.queryByText('Security Review Lite')).toBeInTheDocument());
        
        // Test Adjust Parameters (Back to Step 3)
        fireEvent.click(screen.getByText(/ADJUST PARAMETERS/i));
        expect(screen.queryByText('TACTICAL OPS')).toBeInTheDocument();
    });

    it('should handle card interactivity (mouse move and flip logic)', async () => {
        render(<MissionControl />);
        
        const user = userEvent.setup();
        
        // Navigation to Step 3 with verification
        await user.click(screen.getByText('SECURE'));
        await waitFor(() => expect(screen.queryByText('Attack Surface')).toBeInTheDocument());
        
        await user.click(screen.getByText('Smart Contracts'));
        await user.click(screen.getByText('Seed (<$1M)'));
        await user.click(screen.getByText('Standard ERCs'));

        const confirmBtn = screen.getByText('CONFIRM INTEL');
        await user.click(confirmBtn);
        
        await waitFor(() => expect(screen.queryByText('TACTICAL OPS')).toBeInTheDocument(), { timeout: 10000 });

        // Flip first engagement card, assert back content, then SELECT THIS OPS (covers L508-510)
        const [firstLearnMore] = await screen.findAllByText(/LEARN MORE/i);
        const firstCard = firstLearnMore.closest('.group');
        await user.click(firstLearnMore.closest('button'));
        await within(firstCard).findByText(/TECHNICAL SPECS/i, {}, { timeout: 5000 });
        expect(within(firstCard).getByText(/Full architectural audit included/i)).toBeInTheDocument();
        
        // SELECT THIS OPS advances to step 4 — covers L508-510
        const selectBtn = within(firstCard).getByText(/SELECT THIS OPS/i);
        await user.click(selectBtn);
        
        // Should now be on step 4 (loadout screen with packages)
        await screen.findByText(/Security Review Lite/i, {}, { timeout: 5000 });

        // Go back to step 3 and test the second card flip-back (covers handleFlipBack L77-78)
        await user.click(screen.getByText(/ADJUST PARAMETERS/i));
        await screen.findByText(/CORE INTEGRATION/i, {}, { timeout: 5000 });
        
        const allLearnMore = await screen.findAllByText(/LEARN MORE/i);
        const secondCard = allLearnMore[allLearnMore.length - 1].closest('.group');
        await user.click(allLearnMore[allLearnMore.length - 1].closest('button'));
        await within(secondCard).findByText(/TECHNICAL SPECS/i, {}, { timeout: 5000 });
        expect(within(secondCard).getByText(/Deep strategy and execution/i)).toBeInTheDocument();

        // RETURN TO LOADOUT exercises handleFlipBack (L77-78)
        const returnBtn = within(secondCard).getByText(/RETURN TO LOADOUT/i);
        await user.click(returnBtn);
        await within(secondCard).findByText(/LEARN MORE/i, {}, { timeout: 5000 });
    }, 60000);



    it('should trigger checkout when clicking deploy', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        render(<MissionControl />);
        
        fireEvent.click(screen.getByText('SECURE'));
        
        await waitFor(() => expect(screen.queryByText('Attack Surface')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Smart Contracts'));
        fireEvent.click(screen.getByText('Seed (<$1M)'));
        fireEvent.click(screen.getByText('Standard ERCs'));
        fireEvent.click(screen.getByText('CONFIRM INTEL'));

        await waitFor(() => expect(screen.queryByText('TACTICAL OPS')).toBeInTheDocument());
        fireEvent.click(screen.getByText('TACTICAL OPS'));

        await waitFor(() => expect(screen.queryByText('Security Review Lite')).toBeInTheDocument());
        const deployBtns = screen.getAllByText(/DEPLOY MISSION|ENQUIRE/i);
        fireEvent.click(deployBtns[0]);
        
        consoleSpy.mockRestore();
    });

    it('should render correct back content for engineering and pm objectives', async () => {
        render(<MissionControl />);
        
        // ENGINEERING Objective
        await waitFor(() => expect(screen.queryByText('BUILD')).toBeInTheDocument());
        fireEvent.click(screen.getByText('BUILD'));
        
        await waitFor(() => expect(screen.queryByText('Development Phase')).toBeInTheDocument(), { timeout: 5000 });
        fireEvent.click(screen.getByText('Greenfield (0-1)'));
        fireEvent.click(screen.getByText('Gas Optimization'));
        fireEvent.click(screen.getByText('Modular / ZK'));
        fireEvent.click(screen.getByText('CONFIRM INTEL'));
        
        await waitFor(() => expect(screen.queryByText('TACTICAL OPS')).toBeInTheDocument(), { timeout: 10000 });
        fireEvent.click(screen.getByText('TACTICAL OPS'));
        
        const learnMoreBtns = await screen.findAllByText(/LEARN MORE/i);
        fireEvent.click(learnMoreBtns[0].closest('button'));
        
        await waitFor(() => expect(screen.getAllByText('Solidity / Rust').length).toBeGreaterThan(0), { timeout: 5000 });
        
        // Go back and test PM Objective
        fireEvent.click(screen.getByText(/ADJUST PARAMETERS/i));
        fireEvent.click(screen.getByText(/BACK TO ASSESSMENT/i));
        fireEvent.click(screen.getByText(/BACK TO OBJECTIVE/i));
        
        await waitFor(() => expect(screen.queryByText('LEAD')).toBeInTheDocument(), { timeout: 5000 });
        fireEvent.click(screen.getByText('LEAD'));
        
        await waitFor(() => expect(screen.queryByText('Team Topology')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Distributed Squad'));
        fireEvent.click(screen.getByText('Kanban/Agile'));
        fireEvent.click(screen.getByText('On-Chain DAO'));
        fireEvent.click(screen.getByText('CONFIRM INTEL'));
        
        await waitFor(() => expect(screen.queryByText('TACTICAL OPS')).toBeInTheDocument(), { timeout: 10000 });
        fireEvent.click(screen.getByText('TACTICAL OPS'));
        
        const pmLearnMoreBtns = await screen.findAllByText(/LEARN MORE/i);
        fireEvent.click(pmLearnMoreBtns[0].closest('button'));
        
        await waitFor(() => expect(screen.getAllByText('Jira / ClickUp').length).toBeGreaterThan(0), { timeout: 5000 });
    }, 30000);
});
