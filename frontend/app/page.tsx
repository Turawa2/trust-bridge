'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start text-center sm:text-left">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          TrustBridge 🤝
        </h1>
        <p className="leading-7 [&:not(:first-child)]:mt-6 max-w-lg">
          Decentralized Escrow for Freelancers. Hold funds safely in a smart contract and release them only when the work is done.
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <ConnectButton />
        </div>
      </main>
    </div>
  );
}
