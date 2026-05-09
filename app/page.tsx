"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPublicClient, createWalletClient, custom, http, type Address } from "viem";
import { celo } from "viem/chains";
import { CFRG_TOKEN_ABI, ERC20_APPROVAL_ABI } from "@bamzzstudio/cforge-abi";
import { CELO_STABLECOINS, CFRG_TOKEN, type StableSymbol } from "@bamzzstudio/cforge-addresses";
import {
  CFRG_MINT_AMOUNT_DISPLAY,
  MINIPAY_STABLE_MINT_FEE_DISPLAY,
  WEB_CELO_MINT_FEE_DISPLAY,
  WEB_CELO_MINT_FEE_WEI,
  formatTokenUnits,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  getStableMintFeeUnits,
  isHexAddress,
  shortAddress,
} from "@bamzzstudio/cforge-core";
import { useMiniPayStatus } from "@bamzzstudio/cforge-react";
import { getInjectedEthereum, miniPayTransactionOptions } from "@bamzzstudio/cforge-wallets";

type TxStage = "idle" | "approving" | "minting" | "success" | "error";

const stableOptions = Object.keys(CELO_STABLECOINS) as StableSymbol[];
const publicClient = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org"),
});

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`h-4 w-4 animate-spin rounded-full border-2 ${
        light ? "border-white/40 border-t-white" : "border-ink/40 border-t-ink"
      }`}
    />
  );
}

export default function HomePage() {
  const isMiniPay = useMiniPayStatus();
  const autoConnectTried = useRef(false);
  const [address, setAddress] = useState<Address | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [stableSymbol, setStableSymbol] = useState<StableSymbol>("USDm");
  const [stage, setStage] = useState<TxStage>("idle");
  const [statusText, setStatusText] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [cfrgBalance, setCfrgBalance] = useState<bigint>();
  const [totalSupply, setTotalSupply] = useState<bigint>();
  const [stableBalance, setStableBalance] = useState<bigint>();
  const [allowance, setAllowance] = useState<bigint>();

  const tokenAddress = process.env.NEXT_PUBLIC_CFORGE_TOKEN_ADDRESS || CFRG_TOKEN.address;
  const cfrgAddress = isHexAddress(tokenAddress) && tokenAddress !== "0x0000000000000000000000000000000000000000"
    ? (tokenAddress as Address)
    : undefined;

  const selectedStable = CELO_STABLECOINS[stableSymbol];
  const stableFeeUnits = useMemo(() => getStableMintFeeUnits(stableSymbol), [stableSymbol]);
  const activeMode = isMiniPay ? "minipay" : "web";
  const onCeloMainnet = chainId === celo.id;
  const isConnected = Boolean(address);
  const [isWriting, setIsWriting] = useState(false);

  const hasStableAllowance = typeof allowance === "bigint" && allowance >= stableFeeUnits;
  const hasStableBalance = typeof stableBalance === "bigint" && stableBalance >= stableFeeUnits;

  const loadWalletState = useCallback(async () => {
    const ethereum = getInjectedEthereum();
    if (!ethereum?.request) return;

    const [accounts, chainHex] = await Promise.all([
      ethereum.request({ method: "eth_accounts", params: [] }),
      ethereum.request({ method: "eth_chainId", params: [] }),
    ]);

    const nextAccounts = Array.isArray(accounts) ? (accounts as Address[]) : [];
    setAddress(nextAccounts[0]);
    setChainId(typeof chainHex === "string" ? Number(BigInt(chainHex)) : undefined);
  }, []);

  useEffect(() => {
    loadWalletState();
  }, [loadWalletState]);

  useEffect(() => {
    const ethereum = getInjectedEthereum() as any;
    if (!ethereum?.on) return;

    const onAccountsChanged = (accounts: Address[]) => setAddress(accounts[0]);
    const onChainChanged = (nextChainId: string) => setChainId(Number(BigInt(nextChainId)));

    ethereum.on("accountsChanged", onAccountsChanged);
    ethereum.on("chainChanged", onChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  useEffect(() => {
    if (isMiniPay && !address && !autoConnectTried.current) {
      autoConnectTried.current = true;
      connectWallet();
    }
  }, [address, isMiniPay]);

  const refreshReads = useCallback(async () => {
    if (!cfrgAddress) return;

    const reads: Promise<unknown>[] = [
      publicClient
        .readContract({
          address: cfrgAddress,
          abi: CFRG_TOKEN_ABI,
          functionName: "totalSupply",
        })
        .then((value) => setTotalSupply(value as bigint)),
    ];

    if (address) {
      reads.push(
        publicClient
          .readContract({
            address: cfrgAddress,
            abi: CFRG_TOKEN_ABI,
            functionName: "balanceOf",
            args: [address],
          })
          .then((value) => setCfrgBalance(value as bigint)),
      );
    }

    if (address && isMiniPay) {
      reads.push(
        publicClient
          .readContract({
            address: selectedStable.address,
            abi: ERC20_APPROVAL_ABI,
            functionName: "balanceOf",
            args: [address],
          })
          .then((value) => setStableBalance(value as bigint)),
        publicClient
          .readContract({
            address: selectedStable.address,
            abi: ERC20_APPROVAL_ABI,
            functionName: "allowance",
            args: [address, cfrgAddress],
          })
          .then((value) => setAllowance(value as bigint)),
      );
    }

    await Promise.all(reads);
  }, [address, cfrgAddress, isMiniPay, selectedStable.address]);

  useEffect(() => {
    refreshReads().catch((error) => console.error(error));
  }, [refreshReads]);

  async function connectWallet() {
    const ethereum = getInjectedEthereum();
    if (!ethereum?.request) {
      setStage("error");
      setStatusText("No injected wallet found. Open this app in MiniPay or a Celo wallet browser.");
      return;
    }

    try {
      setIsConnecting(true);
      setStage("idle");
      setStatusText("");
      const accounts = await ethereum.request({ method: "eth_requestAccounts", params: [] });
      const chainHex = await ethereum.request({ method: "eth_chainId", params: [] });
      const nextAccounts = Array.isArray(accounts) ? (accounts as Address[]) : [];
      setAddress(nextAccounts[0]);
      setChainId(typeof chainHex === "string" ? Number(BigInt(chainHex)) : undefined);
    } catch (error) {
      console.error(error);
      setStage("error");
      setStatusText("Wallet connection was rejected.");
    } finally {
      setIsConnecting(false);
    }
  }

  async function ensureCelo() {
    if (onCeloMainnet) return true;
    const ethereum = getInjectedEthereum();
    if (!ethereum?.request) throw new Error("Wallet not available");

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xa4ec" }],
      });
    } catch (error: any) {
      if (error?.code !== 4902) throw error;
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0xa4ec",
            chainName: "Celo",
            nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
            rpcUrls: ["https://forno.celo.org"],
            blockExplorerUrls: ["https://celoscan.io"],
          },
        ],
      });
    }

    setChainId(celo.id);
    return true;
  }

  function getWalletClient() {
    const ethereum = getInjectedEthereum();
    if (!ethereum || !address) throw new Error("Wallet not connected");

    return createWalletClient({
      account: address,
      chain: celo,
      transport: custom(ethereum as any),
    });
  }

  async function approveStable() {
    if (!cfrgAddress) return;
    try {
      await ensureCelo();
      setIsWriting(true);
      setStage("approving");
      setStatusText(`Approving ${stableSymbol} for the CFRG mint fee.`);
      const walletClient = getWalletClient();
      const hash = await walletClient.writeContract({
        address: selectedStable.address,
        abi: ERC20_APPROVAL_ABI,
        functionName: "approve",
        args: [cfrgAddress, stableFeeUnits],
        ...(isMiniPay ? miniPayTransactionOptions() : {}),
      } as any);
      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setStatusText("Approval confirmed. You can mint CFRG now.");
      setStage("idle");
      await refreshReads();
    } catch (error) {
      console.error(error);
      setStage("error");
      setStatusText("Approval failed or was rejected.");
    } finally {
      setIsWriting(false);
    }
  }

  async function mintCfrg() {
    if (!cfrgAddress) return;

    try {
      await ensureCelo();
      setIsWriting(true);
      setStage("minting");
      setStatusText(activeMode === "minipay" ? "Minting CFRG with stablecoin." : "Minting CFRG with CELO.");
      const walletClient = getWalletClient();

      const hash = activeMode === "minipay"
        ? await walletClient.writeContract({
            address: cfrgAddress,
            abi: CFRG_TOKEN_ABI,
            functionName: "mintWithStable",
            args: [selectedStable.address],
            ...miniPayTransactionOptions(),
          } as any)
        : await walletClient.writeContract({
            address: cfrgAddress,
            abi: CFRG_TOKEN_ABI,
            functionName: "mintWithCelo",
            value: WEB_CELO_MINT_FEE_WEI,
          } as any);

      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setStage("success");
      setStatusText(`${CFRG_MINT_AMOUNT_DISPLAY} CFRG minted.`);
      await refreshReads();
    } catch (error) {
      console.error(error);
      setStage("error");
      setStatusText("Mint failed or was rejected.");
    } finally {
      setIsWriting(false);
    }
  }

  const mintDisabled =
    !cfrgAddress ||
    !isConnected ||
    !onCeloMainnet ||
    isWriting ||
    stage === "minting" ||
    (activeMode === "minipay" && (!hasStableAllowance || !hasStableBalance));

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-lg border border-white/10 bg-black/20 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/cforge-golden-coin.png"
              alt=""
              className="h-12 w-12 rounded-full object-contain"
            />
            <div>
              <p className="text-sm text-white/60">Celo token forge</p>
              <h1 className="text-2xl font-semibold tracking-normal text-white">C-forge</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-white/10 px-3 py-2 text-sm text-white/70">
              {isMiniPay ? "MiniPay" : "Web wallet"}
            </span>
            {address ? (
              <a
                href={getExplorerAddressUrl(address)}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
              >
                {shortAddress(address)}
              </a>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 rounded-md bg-forge px-4 py-2 text-sm font-semibold text-ink transition hover:bg-forge/90 disabled:opacity-60"
              >
                {isConnecting && <Spinner />}
                {isConnecting ? "Connecting" : "Connect"}
              </button>
            )}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-white/10 bg-[#15181a]/95 p-5 shadow-2xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 inline-flex rounded-md bg-brass/15 px-2 py-1 text-xs font-medium text-brass">
                  {activeMode === "minipay" ? "0.0002 stablecoin mint" : "0.002 CELO mint"}
                </p>
                <h2 className="text-3xl font-semibold tracking-normal text-white">Mint CFRG</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/64">
                  Mint {CFRG_MINT_AMOUNT_DISPLAY} cforge tokens directly on Celo mainnet. MiniPay users pay the mint fee in stablecoins; web wallets pay in CELO.
                </p>
              </div>
              <div className="rounded-md border border-forge/30 bg-forge/10 px-4 py-3 text-right">
                <p className="text-xs text-forge/80">Mint output</p>
                <p className="text-2xl font-semibold text-forge">{CFRG_MINT_AMOUNT_DISPLAY} CFRG</p>
              </div>
            </div>

            {!cfrgAddress && (
              <div className="mb-5 rounded-md border border-oxide/40 bg-oxide/10 p-4 text-sm text-oxide">
                Add the deployed CFRG contract address to `NEXT_PUBLIC_CFORGE_TOKEN_ADDRESS` before minting.
              </div>
            )}

            {isConnected && !onCeloMainnet && (
              <div className="mb-5 flex flex-col gap-3 rounded-md border border-brass/40 bg-brass/10 p-4 text-sm text-brass sm:flex-row sm:items-center sm:justify-between">
                <span>C-forge runs on Celo mainnet.</span>
                <button
                  onClick={ensureCelo}
                  className="rounded-md bg-brass px-4 py-2 font-semibold text-ink"
                >
                  Switch to Celo
                </button>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-3 text-sm font-black text-forge">C</p>
                <p className="text-xs text-white/50">Your CFRG</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {formatTokenUnits(cfrgBalance as bigint | undefined, 18, 2)}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-3 text-sm font-black text-brass">#</p>
                <p className="text-xs text-white/50">Total supply</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {formatTokenUnits(totalSupply as bigint | undefined, 18, 0)}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-3 text-sm font-black text-oxide">F</p>
                <p className="text-xs text-white/50">Token</p>
                <p className="mt-1 text-2xl font-semibold text-white">CFRG</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
              {activeMode === "minipay" ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/75">MiniPay payment stablecoin</label>
                    <div className="grid grid-cols-3 gap-2">
                      {stableOptions.map((symbol) => (
                        <button
                          key={symbol}
                          onClick={() => setStableSymbol(symbol)}
                          className={`rounded-md border px-3 py-3 text-sm font-semibold transition ${
                            stableSymbol === symbol
                              ? "border-forge bg-forge text-ink"
                              : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-md bg-white/[0.04] p-3">
                      <p className="text-white/50">Mint fee</p>
                      <p className="mt-1 font-semibold text-white">
                        {MINIPAY_STABLE_MINT_FEE_DISPLAY} {stableSymbol}
                      </p>
                    </div>
                    <div className="rounded-md bg-white/[0.04] p-3">
                      <p className="text-white/50">Your {stableSymbol}</p>
                      <p className="mt-1 font-semibold text-white">
                        {formatTokenUnits(stableBalance as bigint | undefined, selectedStable.decimals, 6)}
                      </p>
                    </div>
                  </div>

                  {!hasStableAllowance && (
                    <button
                      onClick={approveStable}
                      disabled={!isConnected || !cfrgAddress || !onCeloMainnet || stage === "approving" || isWriting}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-brass px-4 py-4 font-semibold text-ink transition hover:bg-brass/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {stage === "approving" ? <Spinner /> : <span aria-hidden="true">OK</span>}
                      Approve {stableSymbol}
                    </button>
                  )}

                  <button
                    onClick={mintCfrg}
                    disabled={mintDisabled}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-forge px-4 py-4 font-semibold text-ink transition hover:bg-forge/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {stage === "minting" ? <Spinner /> : <span aria-hidden="true">CF</span>}
                    Mint CFRG
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-md bg-white/[0.04] p-3">
                      <p className="text-white/50">Web mint fee</p>
                      <p className="mt-1 font-semibold text-white">{WEB_CELO_MINT_FEE_DISPLAY} CELO</p>
                    </div>
                    <div className="rounded-md bg-white/[0.04] p-3">
                      <p className="text-white/50">Mint output</p>
                      <p className="mt-1 font-semibold text-white">{CFRG_MINT_AMOUNT_DISPLAY} CFRG</p>
                    </div>
                  </div>

                  <button
                    onClick={isConnected ? mintCfrg : connectWallet}
                    disabled={isConnected ? mintDisabled : isConnecting}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-forge px-4 py-4 font-semibold text-ink transition hover:bg-forge/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {stage === "minting" ? <Spinner /> : <span aria-hidden="true">CF</span>}
                    {isConnected ? "Mint CFRG" : "Connect to mint"}
                  </button>
                </div>
              )}

              {statusText && (
                <div
                  className={`mt-4 flex items-start gap-3 rounded-md border p-3 text-sm ${
                    stage === "error"
                      ? "border-oxide/40 bg-oxide/10 text-oxide"
                      : "border-forge/30 bg-forge/10 text-forge"
                  }`}
                >
                  <span className="mt-0.5 font-black" aria-hidden="true">
                    {stage === "error" ? "!" : "OK"}
                  </span>
                  <div>
                    <p>{statusText}</p>
                    {txHash && (
                      <a
                        href={getExplorerTxUrl(txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs underline"
                      >
                        View transaction <span aria-hidden="true">-&gt;</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-lg border border-white/10 bg-[#15181a]/95 p-5">
              <h3 className="text-lg font-semibold text-white">What you get</h3>
              <p className="mt-2 text-sm leading-6 text-white/64">
                Each successful mint sends {CFRG_MINT_AMOUNT_DISPLAY} CFRG to your connected wallet. Your balance updates here after the Celo transaction confirms.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#15181a]/95 p-5">
              <h3 className="text-lg font-semibold text-white">Mainnet fees</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-white/55">Web app</span>
                  <span className="font-semibold text-white">{WEB_CELO_MINT_FEE_DISPLAY} CELO</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-white/55">MiniPay</span>
                  <span className="font-semibold text-white">{MINIPAY_STABLE_MINT_FEE_DISPLAY} USDm/USDC/USDT</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-white/55">Mint amount</span>
                  <span className="font-semibold text-white">{CFRG_MINT_AMOUNT_DISPLAY} CFRG</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#15181a]/95 p-5">
              <h3 className="text-lg font-semibold text-white">Contract details</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-white/55">Token</span>
                  <span className="font-semibold text-white">cforge (CFRG)</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-white/55">Network</span>
                  <span className="font-semibold text-white">Celo mainnet</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-white/55">Contract</span>
                  {cfrgAddress ? (
                    <a
                      href={getExplorerAddressUrl(cfrgAddress)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-forge underline"
                    >
                      {shortAddress(cfrgAddress)}
                    </a>
                  ) : (
                    <span className="font-semibold text-white">Not set</span>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
