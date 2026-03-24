import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useReadContract,
  useConfig,
} from "wagmi";
import { waitForTransactionReceipt } from "viem/actions";
import { contractAddress, abi } from "./config/contract";
import { parseEther } from "viem";
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();
  const config = useConfig();

  const [endpoint, setEndpoint] = useState("");
  const [price, setPrice] = useState("");
  const [apis, setApis] = useState<any[]>([]);
  const [creditsMap, setCreditsMap] = useState<Record<number, number>>({});
  const [activePanel, setActivePanel] = useState<"user" | "dev">("user");

  const { data: counter } = useReadContract({
    address: contractAddress,
    abi,
    functionName: "counter",
  });

  const fetchApis = async () => {
    if (!counter) return;
    const list = [];
    for (let i = 1; i <= Number(counter); i++) {
      try {
        const api: any = await config.getPublicClient().readContract({
          address: contractAddress,
          abi,
          functionName: "apis",
          args: [i],
        });
        list.push(api);
      } catch {}
    }
    setApis(list);
  };

  const fetchCredits = async () => {
    if (!address || apis.length === 0) return;
    const map: Record<number, number> = {};
    for (let api of apis) {
      try {
        const credit: any = await config.getPublicClient().readContract({
          address: contractAddress,
          abi,
          functionName: "credits",
          args: [address, api.id],
        });
        map[Number(api.id)] = Number(credit);
      } catch {}
    }
    setCreditsMap(map);
  };

  useEffect(() => {
    fetchApis();
  }, [counter]);

  useEffect(() => {
    fetchCredits();
  }, [apis, address]);

  const registerApi = async () => {
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "registerApi",
        args: [endpoint, parseEther(price)],
      });
      await waitForTransactionReceipt(config, { hash });
      setEndpoint("");
      setPrice("");
      fetchApis();
    } catch (err) {
      console.error(err);
    }
  };

  const buyCredits = async (id: number, pricePerCall: bigint) => {
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "buyCredits",
        args: [id],
        value: pricePerCall,
      });
      await waitForTransactionReceipt(config, { hash });
      fetchCredits();
    } catch (err) {
      console.error(err);
    }
  };

  const useCredit = async (id: number) => {
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "useCredit",
        args: [id],
      });
      await waitForTransactionReceipt(config, { hash });
      fetchCredits();
    } catch (err) {
      console.error(err);
    }
  };

  const withdraw = async (id: number) => {
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "withdraw",
        args: [id],
      });
      await waitForTransactionReceipt(config, { hash });
      fetchApis();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-root">
      {/* Background grid */}
      <div className="bg-grid" />
      <div className="bg-glow" />

      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <span className="header-logo">⬡</span>
          <span className="header-title">APIChain</span>
          <span className="header-tagline">Decentralized API Marketplace</span>
        </div>

        <div className="header-wallet">
          {!isConnected ? (
            <button
              className="btn btn-connect"
              onClick={() => connect({ connector: connectors[0] })}
            >
              <span className="btn-dot" />
              Connect Wallet
            </button>
          ) : (
            <div className="wallet-info">
              <span className="wallet-dot" />
              <span className="wallet-address">
                {address?.slice(0, 6)}…{address?.slice(-4)}
              </span>
              <button className="btn btn-disconnect" onClick={() => disconnect()}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {!isConnected ? (
          <div className="connect-screen">
            <div className="connect-icon">⬡</div>
            <h2 className="connect-heading">Connect your wallet to begin</h2>
            <p className="connect-sub">
              Access the decentralized API marketplace — buy, sell, and manage
              API credits on-chain.
            </p>
            <button
              className="btn btn-connect btn-connect-lg"
              onClick={() => connect({ connector: connectors[0] })}
            >
              <span className="btn-dot" />
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Panel Toggle */}
            <div className="panel-toggle">
              <button
                className={`toggle-btn ${activePanel === "user" ? "toggle-btn--active" : ""}`}
                onClick={() => setActivePanel("user")}
              >
                <span className="toggle-icon">◈</span> User Panel
              </button>
              <button
                className={`toggle-btn ${activePanel === "dev" ? "toggle-btn--active" : ""}`}
                onClick={() => setActivePanel("dev")}
              >
                <span className="toggle-icon">⬡</span> Dev Panel
              </button>
            </div>

            {/* ── USER PANEL ── */}
            {activePanel === "user" && (
              <section className="panel panel--user">
                <div className="panel-header">
                  <h2 className="panel-title">
                    <span className="panel-title-accent">◈</span> Available APIs
                  </h2>
                  <span className="panel-badge">{apis.length} registered</span>
                </div>

                {apis.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">◌</span>
                    <p>No APIs registered yet.</p>
                  </div>
                ) : (
                  <div className="api-grid">
                    {apis.map((api) => {
                      const userCredits = creditsMap[Number(api.id)] || 0;
                      return (
                        <div className="api-card" key={Number(api.id)}>
                          <div className="api-card-header">
                            <span className="api-id">#{Number(api.id)}</span>
                            <span className="api-price">
                              {Number(api.pricePerCall) / 1e18} ETH
                              <span className="api-price-label"> / call</span>
                            </span>
                          </div>

                          <div className="api-endpoint">{api.endpoint}</div>

                          <div className="api-meta">
                            <div className="api-meta-row">
                              <span className="meta-label">Owner</span>
                              <span className="meta-value meta-value--addr">
                                {api.owner.slice(0, 6)}…{api.owner.slice(-4)}
                              </span>
                            </div>
                            <div className="api-meta-row">
                              <span className="meta-label">Total Earned</span>
                              <span className="meta-value">
                                {Number(api.totalEarned) / 1e18} ETH
                              </span>
                            </div>
                            <div className="api-meta-row">
                              <span className="meta-label">Your Credits</span>
                              <span className={`meta-value credits-badge ${userCredits > 0 ? "credits-badge--active" : ""}`}>
                                {userCredits}
                              </span>
                            </div>
                          </div>

                          <div className="api-card-actions">
                            <button
                              className="btn btn-buy"
                              onClick={() => buyCredits(Number(api.id), api.pricePerCall)}
                            >
                              Buy Credit
                            </button>
                            {userCredits > 0 && (
                              <button
                                className="btn btn-use"
                                onClick={() => useCredit(Number(api.id))}
                              >
                                Use Credit
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ── DEV PANEL ── */}
            {activePanel === "dev" && (
              <section className="panel panel--dev">
                {/* Register */}
                <div className="dev-block">
                  <div className="panel-header">
                    <h2 className="panel-title">
                      <span className="panel-title-accent">⬡</span> Register API
                    </h2>
                  </div>

                  <div className="register-form">
                    <div className="form-group">
                      <label className="form-label">API Endpoint</label>
                      <input
                        className="form-input"
                        placeholder="https://your-api.com/endpoint"
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price per Call (ETH)</label>
                      <input
                        className="form-input"
                        placeholder="0.001"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                    <button className="btn btn-register" onClick={registerApi}>
                      Register API
                    </button>
                  </div>
                </div>

                {/* Withdraw */}
                <div className="dev-block">
                  <div className="panel-header">
                    <h2 className="panel-title">
                      <span className="panel-title-accent">⬡</span> Your APIs & Withdraw
                    </h2>
                  </div>

                  {apis.filter(
                    (api) => api.owner.toLowerCase() === address?.toLowerCase()
                  ).length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">◌</span>
                      <p>You haven't registered any APIs yet.</p>
                    </div>
                  ) : (
                    <div className="api-grid">
                      {apis
                        .filter(
                          (api) =>
                            api.owner.toLowerCase() === address?.toLowerCase()
                        )
                        .map((api) => (
                          <div className="api-card api-card--owned" key={Number(api.id)}>
                            <div className="api-card-header">
                              <span className="api-id">#{Number(api.id)}</span>
                              <span className="api-price">
                                {Number(api.pricePerCall) / 1e18} ETH
                                <span className="api-price-label"> / call</span>
                              </span>
                            </div>

                            <div className="api-endpoint">{api.endpoint}</div>

                            <div className="api-meta">
                              <div className="api-meta-row">
                                <span className="meta-label">Total Earned</span>
                                <span className="meta-value earned-value">
                                  {Number(api.totalEarned) / 1e18} ETH
                                </span>
                              </div>
                            </div>

                            <div className="api-card-actions">
                              <button
                                className="btn btn-withdraw"
                                onClick={() => withdraw(Number(api.id))}
                              >
                                Withdraw Earnings
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <span>APIChain © 2025 — Powered by Ethereum</span>
      </footer>
    </div>
  );
}

export default App;