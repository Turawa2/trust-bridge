'use client';

import {
    useReadContracts,
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount
} from 'wagmi';
import { formatEther } from 'viem';
import { ESCROW_ABI } from '@/lib/contracts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function ContractCard({ address, roleFilter }: { address: `0x${string}`, roleFilter?: 'client' | 'freelancer' }) {
    const { address: userAddress } = useAccount();
    const [ipfsLink, setIpfsLink] = useState('');

    // 1. Fetch Contract Data
    const { data, isLoading, refetch } = useReadContracts({
        contracts: [
            { address, abi: ESCROW_ABI, functionName: 'client' },
            { address, abi: ESCROW_ABI, functionName: 'freelancer' },
            { address, abi: ESCROW_ABI, functionName: 'amount' },
            { address, abi: ESCROW_ABI, functionName: 'status' },
            { address, abi: ESCROW_ABI, functionName: 'deliverableIpfs' },
            { address, abi: ESCROW_ABI, functionName: 'deadline' },
        ],
    });

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    if (isSuccess) {
        refetch(); // Refresh data after action
    }

    if (isLoading || !data) {
        return <Card className="animate-pulse h-64 bg-secondary/20" />;
    }

    const [client, freelancer, amount, status, deliverable, deadline] = data.map(r => r.result);

    // Status Enum Mapping
    const STATUS_LABELS = ['Pending', 'Active', 'Completed', 'Disputed', 'Refunded'];
    const statusIndex = Number(status);
    const statusLabel = STATUS_LABELS[statusIndex];

    // Helper Checkers
    const isClient = userAddress === client;
    const isFreelancer = userAddress === freelancer;
    const isActive = statusIndex === 1;
    const isPendingDeposit = statusIndex === 0;

    // Filter Logic: If filter is passed, return null if role doesn't match
    // Note: We return null *after* hooks are called to respect Rules of Hooks
    if (roleFilter === 'client' && !isClient) return null;
    if (roleFilter === 'freelancer' && !isFreelancer) return null;

    // Actions
    const handleDeposit = () => {
        writeContract({
            address,
            abi: ESCROW_ABI,
            functionName: 'deposit',
            value: amount as bigint,
        });
    };

    const handleSubmitWork = () => {
        if (!ipfsLink) return;
        writeContract({
            address,
            abi: ESCROW_ABI,
            functionName: 'submitWork',
            args: [ipfsLink],
        });
    };

    const handleApprove = () => {
        writeContract({
            address,
            abi: ESCROW_ABI,
            functionName: 'approve',
        });
    };

    const handleDispute = () => {
        writeContract({
            address,
            abi: ESCROW_ABI,
            functionName: 'dispute',
        });
    };

    return (
        <Card className="w-full mb-4 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg break-all">{address?.slice(0, 6)}...{address?.slice(-4)}</CardTitle>
                            {isClient && <Badge variant="outline" className="border-blue-500 text-blue-500">MY ROLE: CLIENT</Badge>}
                            {isFreelancer && <Badge variant="outline" className="border-purple-500 text-purple-500">MY ROLE: FREELANCER</Badge>}
                        </div>
                        <CardDescription>
                            Client: {String(client).slice(0, 6)}...{String(client).slice(-4)} |
                            Freelancer: {String(freelancer).slice(0, 6)}...{String(freelancer).slice(-4)}
                        </CardDescription>
                    </div>
                    <Badge variant={isActive ? "default" : "secondary"} className={
                        statusIndex === 2 ? "bg-green-500" :
                            statusIndex === 3 ? "bg-red-500" : ""
                    }>
                        {statusLabel}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground block">Amount</span>
                        <span className="font-bold text-lg">{amount ? formatEther(amount as bigint) : '0'} ETH</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block">Deadline</span>
                        <span>{deadline ? new Date(Number(deadline) * 1000).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>

                {/* Deliverable Section */}
                {String(deliverable) && (
                    <div className="p-3 bg-secondary/30 rounded border">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Deliverable</span>
                        <p className="font-mono text-sm break-all mt-1">{String(deliverable)}</p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-0">
                {/* STATUS & ACTIONS MESSAGES */}

                {/* 1. Pending State Messages */}
                {isPendingDeposit && (
                    <div className="w-full p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-center text-sm mb-2">
                        {isClient
                            ? "⚠️ Action Required: Deposit funds to activate this contract."
                            : "⏳ Waiting for Client to deposit funds. Work cannot start yet."}
                    </div>
                )}

                {/* 2. Freelancer: Ready to Work */}
                {isFreelancer && isActive && !String(deliverable) && (
                    <div className="w-full text-center text-sm text-green-600 mb-2 font-medium">
                        ✅ Contract Active! You can submit work now.
                    </div>
                )}

                {/* ACTION BUTTONS */}

                {/* Client: Deposit */}
                {isClient && isPendingDeposit && (
                    <Button onClick={handleDeposit} disabled={isPending} className="w-full">
                        {isPending ? 'Depositing...' : `Deposit ${amount ? formatEther(amount as bigint) : ''} ETH`}
                    </Button>
                )}

                {/* Freelancer: Submit Work */}
                {isFreelancer && isActive && (
                    <div className="w-full space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Paste IPFS Link or URL to Work"
                                value={ipfsLink}
                                onChange={(e) => setIpfsLink(e.target.value)}
                            />
                            <Button onClick={handleSubmitWork} disabled={isPending || !ipfsLink}>
                                Submit Work 📤
                            </Button>
                        </div>
                    </div>
                )}

                {/* Client: Approve Work */}
                {isClient && isActive && String(deliverable) && (
                    <Button onClick={handleApprove} disabled={isPending} className="w-full bg-green-600 hover:bg-green-700">
                        Approve & Release Funds 💸
                    </Button>
                )}

                {/* Freelancer Waiting for Approval */}
                {isFreelancer && isActive && String(deliverable) && (
                    <div className="w-full p-2 bg-blue-500/10 border border-blue-500/20 rounded text-center text-sm">
                        ⏳ Work submitted. Waiting for Client approval.
                    </div>
                )}

                {/* Both: Dispute */}
                {isActive && (isClient || isFreelancer) && (
                    <Button variant="destructive" onClick={handleDispute} disabled={isPending} className="w-full mt-2">
                        Raise Dispute 🚩
                    </Button>
                )}

                {isConfirming && <p className="text-xs text-center text-yellow-500 font-bold animate-pulse">Transaction Confirming...</p>}
            </CardFooter>
        </Card>
    );
}
