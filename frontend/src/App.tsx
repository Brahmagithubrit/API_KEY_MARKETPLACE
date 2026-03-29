import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useConfig,
} from "wagmi";
import { getPublicClient, waitForTransactionReceipt } from "wagmi/actions";
import { contractAddress, abi } from "./config/contract";
import { parseEther, formatEther } from "viem";
import { useEffect, useState } from "react";

interface Api {
  id: bigint;
  owner: string;
  endpoint: string;
  pricePerCall: bigint;
  totalEarned: bigint;
  active: boolean;
}


function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return <div className={`toast ${type}`}>{msg}</div>;
}

function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();
  const config = useConfig();

  const [endpoint, setEndpoint] = useState("");
  const [price, setPrice] = useState("");
  const [apis, setApis] = useState<Api[]>([]);
  const [creditsMap, setCreditsMap] = useState<Record<string, bigint>>({});
  const [buyQtyMap, setBuyQtyMap] = useState<Record<string, string>>({});
  const [activePanel, setActivePanel] = useState<"user" | "dev">("user");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Ready");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchApis = async () => {
    try {
      const client = getPublicClient(config);
      if (!client) return;

      const currentCounter = await client.readContract({
        address: contractAddress,
        abi,
        functionName: "counter",
      }) as bigint;

      const list: Api[] = [];
      for (let i = 1n; i <= currentCounter; i++) {
        try {
          const api = await client.readContract({
            address: contractAddress,
            abi,
            functionName: "apis",
            args: [i],
          }) as [bigint, string, string, bigint, bigint, boolean];

          list.push({
            id:           api[0],
            owner:        api[1],
            endpoint:     api[2],
            pricePerCall: api[3],
            totalEarned:  api[4],
            active:       api[5],
          });
        } catch (err) {
          console.error("Failed to fetch api", i, err);
        }
      }
      setApis(list);
    } catch (err) {
      console.error("fetchApis error:", err);
    }
  };

  const fetchCredits = async () => {
    if (!address || apis.length === 0) return;
    try {
      const client = getPublicClient(config);
      if (!client) return;

      const map: Record<string, bigint> = {};
      for (const api of apis) {
        try {
          const credit = await client.readContract({
            address: contractAddress,
            abi,
            functionName: "credits",
            args: [address, api.id],
          }) as bigint;
          map[api.id.toString()] = credit;
        } catch (err) {
          console.error("fetchCredits error for api", api.id, err);
        }
      }
      setCreditsMap(map);
    } catch (err) {
      console.error("fetchCredits error:", err);
    }
  };

  useEffect(() => { fetchApis(); }, []);
  useEffect(() => { fetchCredits(); }, [apis, address]);

  const registerApi = async () => {
    if (!endpoint || !price) return;
    try {
      setLoading(true);
      setStatusMsg("Awaiting MetaMask confirmation…");

      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "registerApi",
        args: [endpoint, parseEther(price)],
      });

      setStatusMsg("Transaction submitted, waiting for receipt…");
      await waitForTransactionReceipt(config, { hash });

      setStatusMsg("Confirmed! Refreshing…");
      await fetchApis();
      setEndpoint("");
      setPrice("");
      showToast("API registered successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err?.shortMessage || "Transaction failed", "error");
    } finally {
      setLoading(false);
      setStatusMsg("Ready");
    }
  };

  const buyCredits = async (api: Api) => {
    const qty = BigInt(buyQtyMap[api.id.toString()] || "1");
    if (qty <= 0n) return;
    try {
      setLoading(true);
      setStatusMsg("Awaiting MetaMask confirmation…");

      const totalValue = api.pricePerCall * qty;

      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "buyCredits",
        args: [api.id],
        value: totalValue,
      });

      setStatusMsg("Transaction submitted, waiting for receipt…");
      await waitForTransactionReceipt(config, { hash });

      await fetchCredits();
      await fetchApis();
      showToast(`Bought ${qty} credit(s)!`, "success");
    } catch (err: any) {
      console.error(err);
      showToast(err?.shortMessage || "Transaction failed", "error");
    } finally {
      setLoading(false);
      setStatusMsg("Ready");
    }
  };

  const useCredit = async (api: Api) => {
    try {
      setLoading(true);
      setStatusMsg("Awaiting MetaMask confirmation…");

      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "useCredit",
        args: [api.id],
      });

      setStatusMsg("Transaction submitted, waiting for receipt…");
      await waitForTransactionReceipt(config, { hash });

      await fetchCredits();
      await fetchApis();
      showToast("Credit used!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err?.shortMessage || "Transaction failed", "error");
    } finally {
      setLoading(false);
      setStatusMsg("Ready");
    }
  };

  const withdraw = async (api: Api) => {
    try {
      setLoading(true);
      setStatusMsg("Awaiting MetaMask confirmation…");

      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "withdraw",
        args: [api.id],
      });

      setStatusMsg("Transaction submitted, waiting for receipt…");
      await waitForTransactionReceipt(config, { hash });

      await fetchApis();
      showToast("Withdrawn successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err?.shortMessage || "Transaction failed", "error");
    } finally {
      setLoading(false);
      setStatusMsg("Ready");
    }
  };

  const myApis = apis.filter(
    (api) => api.owner.toLowerCase() === address?.toLowerCase()
  );

  return (
    <>
      <style>{styles}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="app">
        <header className="header">
          <div className="logo">API<span>Chain</span></div>
          {isConnected && address && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="address-pill">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
              <button className="btn btn-ghost" onClick={() => disconnect()}>
                Disconnect
              </button>
            </div>
          )}
        </header>

        {!isConnected ? (
          <div className="connect-screen">
            <div style={{ fontSize: 48 }}>⬡</div>
            <h2>Decentralised<br />API Marketplace</h2>
            <p>Register APIs, buy credits, and monetise your endpoints on-chain.</p>
            <button
              className="btn btn-primary"
              style={{ padding: "12px 32px", fontSize: 14 }}
              onClick={() => connect({ connector: connectors[0] })}
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="tabs">
              <button
                className={`tab ${activePanel === "user" ? "active" : ""}`}
                onClick={() => setActivePanel("user")}
              >
                Browse APIs
              </button>
              <button
                className={`tab ${activePanel === "dev" ? "active" : ""}`}
                onClick={() => setActivePanel("dev")}
              >
                My APIs
              </button>
            </div>

            {activePanel === "dev" && (
              <>
                <div className="register-card">
                  <h3>Register New API</h3>
                  <div className="form-row">
                    <input
                      placeholder="https://api.yourservice.com/v1/endpoint"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                    />
                    <input
                      placeholder="Price (ETH)"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      style={{ textAlign: "right" }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={registerApi}
                      disabled={loading || !endpoint || !price}
                    >
                      {loading ? "…" : "Register"}
                    </button>
                  </div>
                </div>

                <p className="section-heading">Your Registered APIs ({myApis.length})</p>
                <div className="api-grid">
                  {myApis.length === 0 ? (
                    <div className="empty">
                      <div className="empty-icon">📭</div>
                      You haven't registered any APIs yet.
                    </div>
                  ) : (
                    myApis.map((api) => (
                      <div key={api.id.toString()} className="api-card owner">
                        <div className="api-info">
                          <div className="api-endpoint">{api.endpoint}</div>
                          <div className="api-meta">
                            <span className="meta-chip price">
                              {formatEther(api.pricePerCall)} ETH / call
                            </span>
                            <span className="meta-chip earned">
                              ⬡ {formatEther(api.totalEarned)} ETH earned
                            </span>
                            {!api.active && (
                              <span className="meta-chip inactive-tag">Inactive</span>
                            )}
                            <span className="meta-chip owner-tag">Owner</span>
                          </div>
                        </div>
                        <div className="api-actions">
                          <button
                            className="btn btn-warn"
                            onClick={() => withdraw(api)}
                            disabled={loading || api.totalEarned === 0n}
                            title={api.totalEarned === 0n ? "Nothing to withdraw" : ""}
                          >
                            Withdraw
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {activePanel === "user" && (
              <>
                <p className="section-heading">Available APIs ({apis.length})</p>
                <div className="api-grid">
                  {apis.length === 0 ? (
                    <div className="empty">
                      <div className="empty-icon">🔍</div>
                      No APIs registered yet.
                    </div>
                  ) : (
                    apis.map((api) => {
                      const userCredits = creditsMap[api.id.toString()] ?? 0n;
                      const isOwner = api.owner.toLowerCase() === address?.toLowerCase();
                      const qty = buyQtyMap[api.id.toString()] || "1";

                      return (
                        <div
                          key={api.id.toString()}
                          className={`api-card ${isOwner ? "owner" : ""} ${!api.active ? "inactive" : ""}`}
                        >
                          <div className="api-info">
                            <div className="api-endpoint">{api.endpoint}</div>
                            <div className="api-meta">
                              <span className="meta-chip price">
                                {formatEther(api.pricePerCall)} ETH / call
                              </span>
                              <span className="meta-chip credits">
                                {userCredits.toString()} credit{userCredits !== 1n ? "s" : ""}
                              </span>
                              {isOwner && (
                                <span className="meta-chip owner-tag">You own this</span>
                              )}
                              {!api.active && (
                                <span className="meta-chip inactive-tag">Inactive</span>
                              )}
                            </div>
                          </div>

                          <div className="api-actions">
                            {api.active && (
                              <div className="buy-row">
                                <input
                                  className="buy-qty"
                                  type="number"
                                  min="1"
                                  value={qty}
                                  onChange={(e) =>
                                    setBuyQtyMap((prev) => ({
                                      ...prev,
                                      [api.id.toString()]: e.target.value,
                                    }))
                                  }
                                  title="Number of credits to buy"
                                />
                                <button
                                  className="btn btn-primary"
                                  onClick={() => buyCredits(api)}
                                  disabled={loading}
                                >
                                  Buy
                                </button>
                              </div>
                            )}

                            {userCredits > 0n && api.active && (
                              <button
                                className="btn btn-use"
                                onClick={() => useCredit(api)}
                                disabled={loading}
                              >
                                Use
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="status-bar">
        <div className={`status-dot ${loading ? "loading" : "ready"}`} />
        {statusMsg}
        {loading && <span style={{ marginLeft: "auto", color: "var(--accent)" }}>pending…</span>}
      </div>
    </>
  );
}

export default App;