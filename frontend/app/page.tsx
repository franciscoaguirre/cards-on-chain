"use client"

import { useEffect, useMemo, useState } from "react"
import type { PolkadotSigner } from "polkadot-api"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useConnectedWallets, useWalletDisconnector, useAccounts, useSigner, SignerProvider } from "@reactive-dot/react"
import { ConnectionButton } from "dot-connect/react.js"
import { useRegisterForMatch } from "@contract"
import { CONTRACT_ADDRESS } from "@/lib/contract/definition"
import { checkStatus } from "@/lib/contract/helper"

function PlayCTA({ onStarted }: { onStarted: () => void }) {
  const [matchStatus, registerForMatch] = useRegisterForMatch(CONTRACT_ADDRESS)

  useEffect(() => {
    if (
      typeof matchStatus !== "symbol" &&
      !(matchStatus instanceof Error) &&
      matchStatus.type === "finalized"
    ) {
      console.log('matchStatus finalized')
    }
    console.log('matchStatus effect', checkStatus(matchStatus))
  }, [matchStatus])

  const handleStart = () => {
    const res = registerForMatch()
    console.log('res', res)
    onStarted()
  }

  return (
    <Button onClick={handleStart} className="w-1/2">Find Opponent</Button>
  )
}

export default function Home() {
  const router = useRouter()
  const connectedWallets = useConnectedWallets()
  const accounts = useAccounts()
  const currentSigner = useSigner()
  const [__, disconnectWallet] = useWalletDisconnector();
  const [selectedSigner, setSelectedSigner] = useState<PolkadotSigner | undefined>(undefined)
  const isConnected = useMemo(() => connectedWallets.length > 0, [connectedWallets])
  const needsAccountSelection = isConnected && accounts.length > 0 && !currentSigner && !selectedSigner


  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleDisconnect = async () => {
    if (isDisconnecting) return
    setIsDisconnecting(true)
    try {
      // disconnect hangs for some reason, so here is a little hack to make it work
      setTimeout(async () => {
        try {
          await Promise.race([
            disconnectWallet(),
            new Promise((resolve) => setTimeout(resolve, 2000)),
          ])
        } catch (e) {
          console.error('disconnect error', e)
        }
        setSelectedSigner(undefined)
        setIsDisconnecting(false)
      }, 0)
    } catch (err) {
      console.error(err)
      setIsDisconnecting(false)
    }
  }

  const handleStarted = () => {
    router.push('/game')
  }

  return (
    <main className="min-h-screen crt-effect">
      <div className="container mx-auto p-4 max-w-2xl">
        <header className="mb-6 pixel-border bg-card p-4">
          <h1 className="text-2xl font-bold text-primary text-glow font-mono text-center">{"<CARDGAME.EXE>"}</h1>
          <p className="text-xs text-muted-foreground text-center mt-1">Welcome to the game</p>
        </header>

        <section className="pixel-border bg-card p-6 flex flex-col items-center gap-4">
          <p className="text-center text-sm text-muted-foreground">Connect your wallet to continue.</p>
          {!isConnected ? (
            <div className="w-full flex justify-center">
              <ConnectionButton />
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              {needsAccountSelection && (
                <div className="pixel-border bg-card p-4">
                  <div className="mb-2 text-sm font-medium">Select an account</div>
                  <div className="flex flex-col gap-2">
                    {accounts.map((acct, idx) => (
                      <Button key={idx} variant="outline" onClick={() => setSelectedSigner(acct.polkadotSigner)}>
                        {acct.name ?? "Account"} — {acct.address}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex w-full gap-2">
                <Button variant="secondary" onClick={handleDisconnect} disabled={isDisconnecting} className="w-1/2">{isDisconnecting ? 'Disconnecting…' : 'Disconnect'}</Button>
                {selectedSigner ? (
                  <SignerProvider signer={selectedSigner}>
                    <PlayCTA onStarted={handleStarted} />
                  </SignerProvider>
                ) : (
                  <Button disabled className="w-1/2">Select Account</Button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
