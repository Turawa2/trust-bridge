'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { ARBITRATION_ADDRESS, ARBITRATION_ABI } from '@/lib/contracts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ArbitrationPage() {
    const { address } = useAccount();
    const [targetEscrow, setTargetEscrow] = useState('');

    const { writeContract, isPending } = useWriteContract();

    // Check if user is arbitrator
    const { data: isArbiter } = useReadContract({
        address: ARBITRATION_ADDRESS,
        abi: ARBITRATION_ABI,
        functionName: 'isArbitrator',
        args: address ? [address] : undefined,
    });

    const handleVote = (forFreelancer: boolean) => {
        if (!targetEscrow) return;
        writeContract({
            address: ARBITRATION_ADDRESS,
            abi: ARBITRATION_ABI,
            functionName: 'vote',
            args: [targetEscrow as `0x${string}`, forFreelancer],
        });
    };

    const handleRegister = () => {
        writeContract({
            address: ARBITRATION_ADDRESS,
            abi: ARBITRATION_ABI,
            functionName: 'registerAsArbitrator',
        });
    };

    return (
        <div className="container mx-auto p-10 max-w-3xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Arbitration Court ⚖️</h1>
                <ConnectButton />
            </div>

            <div className="grid gap-6">
                {/* Registration Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Arbitrator Status</CardTitle>
                        <CardDescription>
                            {isArbiter ? "You are a registered arbitrator." : "You are NOT a registered arbitrator."}
                        </CardDescription>
                    </CardHeader>
                    {!isArbiter && (
                        <CardContent>
                            <Button onClick={handleRegister} disabled={isPending}>
                                Register as Arbitrator (Demo Only)
                            </Button>
                        </CardContent>
                    )}
                </Card>

                {/* Voting Section */}
                {isArbiter && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Resolve Dispute</CardTitle>
                            <CardDescription>Enter the disputed Contract Address to cast your binding vote.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                placeholder="Escrow Contract Address (0x...)"
                                value={targetEscrow}
                                onChange={(e) => setTargetEscrow(e.target.value)}
                            />

                            <div className="flex gap-4 pt-4">
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleVote(true)}
                                    disabled={isPending || !targetEscrow}
                                >
                                    Vote for Freelancer 👷
                                </Button>
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleVote(false)}
                                    disabled={isPending || !targetEscrow}
                                >
                                    Vote for Client 🧑‍💼
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
