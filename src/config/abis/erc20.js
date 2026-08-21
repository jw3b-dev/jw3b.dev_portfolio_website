/*
 * Minimal ERC-20 ABI — only what the escrow flow needs (P5 audit fix).
 *
 * The escrow's fund() ends in safeTransferFrom, so the client must approve the escrow to move
 * its USDC first. Hand-written and deliberately tiny: importing a full ERC-20 ABI would drag
 * dozens of unused entries into the bundle for two calls.
 */
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
]
