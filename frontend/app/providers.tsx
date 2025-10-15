"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { ReactiveDotProvider, ChainProvider } from "@reactive-dot/react"
import { defineConfig } from "@reactive-dot/core"
import { createLightClientProvider } from "@reactive-dot/core/providers/light-client.js"
import { InjectedWalletProvider } from "@reactive-dot/core/wallets.js"
import { paseo } from "@polkadot-api/descriptors"
import { registerDotConnect } from "dot-connect"
import "dot-connect/font.css"

export function Providers({ children }: { children: React.ReactNode }) {
    const [clientConfig, setClientConfig] = useState<ReturnType<typeof defineConfig> | null>(null)

    const initRanRef = useRef(false)
    useEffect(() => {
        if (initRanRef.current) return
        const lightClientProvider = createLightClientProvider()
        const cfg = defineConfig({
            chains: {
                paseo: {
                    descriptor: paseo,
                    provider: lightClientProvider.addRelayChain({ id: "paseo" }),
                },
            },
            wallets: [new InjectedWalletProvider()],
        })
        registerDotConnect({ wallets: cfg.wallets ?? [] })
        setClientConfig(cfg)
        initRanRef.current = true
    }, [])

    if (!clientConfig) {
        return null
    }

    return (
        <ReactiveDotProvider config={clientConfig}>
            <ChainProvider chainId="paseo">
                <Suspense>
                    {children}
                </Suspense>
            </ChainProvider>
        </ReactiveDotProvider>
    )
}


