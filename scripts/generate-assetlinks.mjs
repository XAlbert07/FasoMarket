import fs from "node:fs";
import path from "node:path";

const packageName = process.env.TWA_PACKAGE_NAME || "com.fasomarket.app";
const fingerprintsRaw =
  process.env.TWA_SHA256_CERT_FINGERPRINTS ||
  "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99";

const fingerprints = fingerprintsRaw
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const assetlinks = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: packageName,
      sha256_cert_fingerprints: fingerprints,
    },
  },
];

const outputDir = path.join(process.cwd(), "public", ".well-known");
const outputPath = path.join(outputDir, "assetlinks.json");

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(assetlinks, null, 2)}\n`, "utf8");

console.log(`assetlinks.json generated at ${outputPath}`);
console.log(`package_name=${packageName}`);
console.log(`fingerprints=${fingerprints.length}`);
