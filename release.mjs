#!/usr/bin/env node

import { services } from "./services.mjs";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let repo = "";

for (const key in services) {
  if (services[key] === false) {
    repo = key;
    break;
  }
}

if (repo === "") {

  writeFileSync(resolve(__dirname, "status.txt"), "completed ✅");

  execSync(
    "git rm .github/workflows/create.yml && git add status.txt",
    { stdio: "inherit" }
  );

  process.exit(0);

} else {

  let response = await fetch(
    "https://api.github.com/repos/cloud-sdk-builds/.github/generate",
    {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${process.env.GH_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: JSON.stringify({
        owner: "cloud-sdk-builds",
        name: repo,
        description:
          "Prebuilt AWS SDK for JavaScript v3 browser modules, ready for direct use via import maps and jsDelivr CDN — no bundler, no build step, just plug and play.",
        include_all_branches: false,
        private: false
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("GitHub API error:", data);
    process.exit(1);
  }

  services[repo] = true;

  writeFileSync(
    resolve(__dirname, "services.mjs"),
    `export const services = ${JSON.stringify(services, null, 2)};\nexport default services;`
  );

  writeFileSync(resolve(__dirname, "status.txt"), "pending ⌛");

  execSync(
    "git add services.mjs status.txt",
    { stdio: "inherit" }
  );

  process.exit(0);
}
