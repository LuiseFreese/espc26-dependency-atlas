// Shared Dataverse Web API helper for the setup scripts.
// Auth: uses an Azure CLI access token for the Dataverse org (no secrets stored in the repo).
// Required: `az login` with an account that has System Customizer/Admin rights in the target environment.
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const config = loadConfig();

function loadConfig() {
  const envFile = join(__dirname, "..", ".env");
  const fromFile = {};
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m) fromFile[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  const get = (k, fallback) => process.env[k] ?? fromFile[k] ?? fallback;
  const orgUrl = (get("DATAVERSE_URL") ?? "").replace(/\/+$/, "");
  if (!orgUrl) {
    throw new Error("DATAVERSE_URL is not set. Copy .env.example to .env or export DATAVERSE_URL.");
  }
  return {
    orgUrl,
    environmentId: get("ENVIRONMENT_ID", ""),
    prefix: get("PUBLISHER_PREFIX", "espc26"),
    publisherUniqueName: get("PUBLISHER_UNIQUE_NAME", "espc26"),
    publisherFriendlyName: get("PUBLISHER_FRIENDLY_NAME", "ESPC26 Keynote"),
    solutionUniqueName: get("SOLUTION_UNIQUE_NAME", "DependencyAtlas"),
    solutionFriendlyName: get("SOLUTION_FRIENDLY_NAME", "Dependency Atlas"),
    // Marker used to identify demo-seeded rows so reset/seed never touch anything else.
    seedTag: get("SEED_TAG", "[atlas-seed]"),
  };
}

let cachedToken;
export function getToken() {
  if (cachedToken) return cachedToken;
  if (!/^https:\/\/[a-z0-9.-]+$/i.test(config.orgUrl)) {
    throw new Error(`DATAVERSE_URL '${config.orgUrl}' is not a plain https://host URL`);
  }
  try {
    // .cmd shims on Windows need a shell; the URL is validated above so string interpolation is safe.
    cachedToken = execSync(`az account get-access-token --resource ${config.orgUrl} --query accessToken -o tsv`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (err) {
    throw new Error(`Could not get an Azure CLI token for ${config.orgUrl}. Run 'az login' first.\n${err.stderr ?? err}`);
  }
  return cachedToken;
}

export const api = `${config.orgUrl}/api/data/v9.2`;

export async function request(method, path, body, extraHeaders = {}) {
  const url = path.startsWith("http") ? path : `${api}/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`${method} ${path} -> ${res.status} ${res.statusText}\n${text}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  const entityId = res.headers.get("OData-EntityId");
  if (res.status === 204 || res.headers.get("content-length") === "0") return { entityId };
  const text = await res.text();
  return text ? { ...JSON.parse(text), entityId } : { entityId };
}

export const get = (path, headers) => request("GET", path, undefined, headers);
export const post = (path, body, headers) => request("POST", path, body, headers);
export const patch = (path, body, headers) => request("PATCH", path, body, headers);
export const del = (path) => request("DELETE", path);

/** Follows @odata.nextLink until all pages are retrieved. */
export async function getAll(path, headers) {
  const rows = [];
  let next = path;
  while (next) {
    const page = await get(next, headers);
    rows.push(...(page.value ?? []));
    next = page["@odata.nextLink"];
  }
  return rows;
}

export function guidFromEntityId(entityId) {
  const m = /\(([0-9a-fA-F-]{36})\)/.exec(entityId ?? "");
  return m ? m[1] : undefined;
}

export const label = (text, lcid = 1033) => ({
  "@odata.type": "Microsoft.Dynamics.CRM.Label",
  LocalizedLabels: [{ "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", Label: text, LanguageCode: lcid }],
});

export const log = (...args) => console.log(new Date().toISOString().slice(11, 19), ...args);
