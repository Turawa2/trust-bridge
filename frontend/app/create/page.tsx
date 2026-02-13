'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useRouter } from 'next/navigation';
import { ESCROW_FACTORY_ABI, ESCROW_FACTORY_ADDRESS, ARBITRATION_ADDRESS } from '@/lib/contracts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function CreateContract() {
    const router = useRouter();
    const [freelancer, setFreelancer] = useState('');
    const [amount, setAmount] = useState('');
    const [deadline, setDeadline] = useState('7'); // Default 7 days

    const { data: hash, writeContract, isPending } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, router]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!freelancer || !amount) return;

        // Convert days to seconds
        const deadlineSeconds = BigInt(deadline) * 24n * 60n * 60n;

        // Arbiter is the Arbitration Contract address
        const arbiter = ARBITRATION_ADDRESS;

        writeContract({
            address: ESCROW_FACTORY_ADDRESS,
            abi: ESCROW_FACTORY_ABI,
            functionName: 'createEscrow',
            args: [freelancer as `0x${string}`, arbiter, deadlineSeconds],
            value: parseEther(amount),
        });
    };

    return (
        <div className="container mx-auto p-10 max-w-2xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">New Contract 📝</h1>
                <ConnectButton />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Create Escrow Agreement</CardTitle>
                    <CardDescription>Deposit funds safely. They will only be released when you approve the work.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="freelancer">Freelancer Address</Label>
                            <Input
                                id="freelancer"
                                placeholder="0x..."
                                value={freelancer}
                                onChange={(e) => setFreelancer(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (ETH)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.001"
                                placeholder="1.0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deadline">Deadline (Days)</Label>
                            <Input
                                id="deadline"
                                type="number"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending || isConfirming}>
                            {isPending ? 'Confirming in Wallet...' :
                                isConfirming ? 'Transaction Pending...' :
                                    'Create & Deposit Escrow'}
                        </Button>

                        {isSuccess && (
                            <div className="p-4 bg-green-900/20 border border-green-500 rounded text-green-500 text-center">
                                Contract Created Successfully! 🎉
                            </div>
                        )}

                        {hash && (
                            <div className="text-xs text-center text-gray-500 break-all">
                                Tx: {hash}
                            </div>
                        )}

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
