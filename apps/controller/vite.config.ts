import { ViteDevServer, defineConfig } from "vite";

import basicSsl from "@vitejs/plugin-basic-ssl";
import fs from "fs";
import os from "os";
import path from "path";
import react from "@vitejs/plugin-react";

function setNetworkAddress() {
  return {
    name: "set-network-address",
    configureServer(server: ViteDevServer) {
      server.httpServer?.once("listening", () => {
        const address = server.httpServer?.address();
        if (typeof address === "object" && address !== null) {
          const networkInterfaces = os.networkInterfaces();
          const addresses = Object.values(networkInterfaces)
            .flat()
            .filter((iface) => iface?.family === "IPv4" && !iface.internal)
            .map((iface) => iface?.address);

          if (addresses.length > 0) {
            const networkAddress = `https://${addresses[0]}:${address.port}`;
            process.env.CONTROLLER_NETWORK_ADDRESS = networkAddress;
            console.log(
              `Network address set to: ${process.env.CONTROLLER_NETWORK_ADDRESS}`
            );

            // Write the network address to a file in the Display app's directory so it can access it on startup
            const filePath = path.resolve(
              __dirname,
              "../display/tmp/network-address.txt"
            );
            fs.writeFileSync(filePath, networkAddress, "utf8");
          }
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl(), setNetworkAddress()],
});
