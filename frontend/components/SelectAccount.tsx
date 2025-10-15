import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getInjectedExtensions, connectInjectedExtension, type InjectedExtension } from "polkadot-api/pjs-signer";
import type { PolkadotSigner } from "polkadot-api";

interface SelectAccountProps {
  setSigner: (signer: PolkadotSigner) => void;
}

export function SelectAccount({ setSigner }: SelectAccountProps) {
  const [selectedWallet, setSelectedWallet] = useState<InjectedExtension | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [extensions, setExtensions] = useState<string[]>([]);

  useEffect(() => {
    // Only get extensions on the client side
    setExtensions(getInjectedExtensions());
  }, []);

  const handleWalletSelect = async (extensionName: string) => {
    setLoading(true);
    try {
      const extension = await connectInjectedExtension(extensionName);
      const walletAccounts = extension.getAccounts();
      setSelectedWallet(extension);
      setAccounts(walletAccounts);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (account: any) => {
    setSigner(account.polkadotSigner);
  };

  if (selectedWallet && accounts.length > 0) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <section className="pixel-border bg-card p-6">
          <h2 className="text-xl font-bold text-center mb-4">Select Account</h2>
          <p className="text-center text-sm text-muted-foreground mb-4">
            Choose an account from {selectedWallet.name}
          </p>
          
          <div className="space-y-2">
            {accounts.map((account, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="w-full text-left justify-start"
                onClick={() => handleAccountSelect(account)}
              >
                <div>
                  <div className="font-medium">{account.name || `Account ${idx + 1}`}</div>
                  <div className="text-xs text-muted-foreground">{account.address}</div>
                </div>
              </Button>
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full mt-4"
            onClick={() => {
              setSelectedWallet(null);
              setAccounts([]);
            }}
          >
            Back to Wallets
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <section className="pixel-border bg-card p-6 flex flex-col items-center gap-4">
        <h2 className="text-xl font-bold text-center">Connect Your Wallet</h2>
        <p className="text-center text-sm text-muted-foreground">
          Choose a wallet to connect and start playing
        </p>
        
        {loading ? (
          <div>Loading accounts...</div>
        ) : (
          <div className="w-full space-y-2">
            {extensions.map((extension, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="w-full"
                onClick={() => handleWalletSelect(extension)}
              >
                {extension}
              </Button>
            ))}
            {extensions.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No wallet extensions found. Please install a Polkadot wallet.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
