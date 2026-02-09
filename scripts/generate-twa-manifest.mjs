import fs from "node:fs";
import path from "node:path";

const packageId = process.env.TWA_PACKAGE_NAME || "com.fasomarket.app";
const appName = process.env.TWA_APP_NAME || "FasoMarket";
const host = process.env.TWA_HOST;

if (!host) {
  console.error("Missing TWA_HOST. Example: TWA_HOST=myapp.vercel.app npm run twa:manifest");
  process.exit(1);
}

const normalizedHost = host.replace(/^https?:\/\//, "").replace(/\/+$/, "");
const fullScopeUrl = `https://${normalizedHost}/`;

const manifest = {
  packageId,
  host: normalizedHost,
  name: appName,
  launcherName: appName,
  display: "standalone",
  themeColor: "#0f766e",
  navigationColor: "#ffffff",
  backgroundColor: "#ffffff",
  enableNotifications: false,
  startUrl: "/",
  iconUrl: `${fullScopeUrl}icons/icon-512.png`,
  maskableIconUrl: `${fullScopeUrl}icons/icon-512-maskable.png`,
  appVersionName: "1",
  appVersionCode: 1,
  fullScopeUrl,
  minSdkVersion: 21,
  orientation: "portrait",
};

const outputPath = path.join(process.cwd(), "twa-manifest.json");
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`twa-manifest.json generated at ${outputPath}`);
console.log(`packageId=${packageId}`);
console.log(`host=${normalizedHost}`);
