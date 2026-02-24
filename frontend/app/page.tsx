"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <main style={{ padding: "2rem", maxWidth: "48rem", margin: "0 auto" }}>
      <h1>TravelTrust</h1>
      <p style={{ marginTop: "0.5rem", color: "#666" }}>
        去中心化导游信誉与托管 · Web + DApp 同源
      </p>
      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>DApp 钱包</h2>
        {isConnected ? (
          <div>
            <p style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
              {address}
            </p>
            <button
              type="button"
              onClick={() => disconnect()}
              style={{
                marginTop: "0.5rem",
                padding: "0.5rem 1rem",
                cursor: "pointer",
              }}
            >
              断开钱包
            </button>
          </div>
        ) : (
          <div>
            {connectors.map((c) => (
              <button
                key={c.uid}
                type="button"
                onClick={() => connect({ connector: c })}
                disabled={isPending}
                style={{
                  marginRight: "0.5rem",
                  marginTop: "0.5rem",
                  padding: "0.5rem 1rem",
                  cursor: isPending ? "wait" : "pointer",
                }}
              >
                {isPending ? "连接中…" : c.name}
              </button>
            ))}
          </div>
        )}
      </section>
      <p style={{ marginTop: "2rem", fontSize: "0.875rem", color: "#888" }}>
        技术栈：Next.js + React + TypeScript；DApp：wagmi + viem + WalletConnect
        v2（见 docs/05、06、09）。
      </p>
    </main>
  );
}
