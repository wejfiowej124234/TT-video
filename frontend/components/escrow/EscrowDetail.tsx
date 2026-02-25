"use client";

import StatusBadge from "./StatusBadge";

export default function EscrowDetail({ escrowId }: { escrowId: string }) {
  return (
    <div className="space-y-10">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h3 font-semibold">Escrow #{escrowId}</h1>
          <p className="text-meta text-ink-500">
            On-chain agreement bound to snapshot.
          </p>
        </div>
        <StatusBadge status="Funded" />
      </div>

      {/* Amount + Parties */}
      <div className="rounded-md bg-white p-8 shadow-soft space-y-6">
        <div>
          <p className="text-meta text-ink-500">Total Amount</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            2,300.00 USDC
          </h2>
        </div>

        <div className="grid gap-6 text-small md:grid-cols-2">
          <div>
            <p className="text-meta text-ink-500">Traveler</p>
            <p className="font-mono text-ink-600">0x12ab...89ef</p>
          </div>
          <div>
            <p className="text-meta text-ink-500">Guide</p>
            <p className="font-mono text-ink-600">0x98cd...12aa</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-md bg-white p-8 shadow-soft">
        <h3 className="text-h4 font-semibold mb-6">On-chain Activity</h3>
        <ul className="space-y-4 text-small">
          <li>EscrowCreated — Block #123456</li>
          <li>Deposited — 12 confirmations</li>
        </ul>
      </div>

      {/* Action Panel */}
      <div className="rounded-md bg-white p-8 shadow-soft space-y-4">
        <button
          type="button"
          className="w-full rounded-sm bg-trust-500 py-3 text-white transition duration-200 hover:opacity-90"
        >
          Release Funds
        </button>

        <p className="text-meta text-ink-500">
          Funds will be released to the guide upon confirmation.
        </p>
      </div>
    </div>
  );
}
