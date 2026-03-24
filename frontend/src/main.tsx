import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { WagmiProvider, createConfig, http } from "wagmi";
import { localhost, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const config = createConfig({
  chains: [localhost], 
  transports: {
    [localhost.id]: http(),
  },
  connectors: [injected()],
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>
);