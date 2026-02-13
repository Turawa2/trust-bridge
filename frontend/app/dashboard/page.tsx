'use client';

import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { ESCROW_FACTORY_ABI, ESCROW_FACTORY_ADDRESS } from '@/lib/contracts';
import ContractCard from '@/components/ContractCard';
import { Button } from "@/components/ui/button";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Dashboard() {
    const { address, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<'client' | 'freelancer'>('client');

    // Fetch list of escrows for the connected user
    const { data: userEscrows, isLoading, refetch } = useReadContract({
        address: ESCROW_FACTORY_ADDRESS,
        abi: ESCROW_FACTORY_ABI,
        functionName: 'getUserEscrows',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address, // Only fetch if address exists
        }
    });

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h1 className="text-2xl font-bold">Please Connect Your Wallet 👛</h1>
                <ConnectButton />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">My Contracts 🗂️</h1>
                    <p className="text-muted-foreground mt-1">
                        Viewing contracts for {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-2">
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        Refresh 🔄
                    </Button>
                </div>
            </div>

            {/* Custom Tabs */}
            <div className="flex gap-4 border-b mb-6">
                <button
                    onClick={() => setActiveTab('client')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'client'
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    I Hiring (Client) 👔
                </button>
                <button
                    onClick={() => setActiveTab('freelancer')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'freelancer'
                        ? 'border-b-2 border-purple-500 text-purple-500'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Hired Me (Freelancer) 👷
                </button>
            </div>

            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-secondary/20 animate-pulse rounded-lg"></div>
                    ))}
                </div>
            )}

            {!isLoading && userEscrows && userEscrows.length === 0 && (
                <div className="text-center py-20 bg-secondary/10 rounded-xl border border-dashed text-muted-foreground">
                    <p className="text-lg">No contracts found.</p>
                    <p className="text-sm mt-2">Create one to get started!</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userEscrows && userEscrows.map((escrowAddress: string) => (
                    <ContractCard
                        key={`${escrowAddress}-${activeTab}`}
                        address={escrowAddress as `0x${string}`}
                        roleFilter={activeTab}
                    />
                ))}
            </div>
        </div>
    );
}
