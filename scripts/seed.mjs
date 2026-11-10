// Seeds (or re-syncs) the demo data. Idempotent: rows are upserted through the `seedkey` alternate key,
// so running it twice never creates duplicates. Real (non-seeded) rows are never touched.
// Usage: npm run seed
import { config, get, getAll, request, del, log } from "./dataverse.mjs";
import { asset, dependency, ASSET_TYPE, CRITICALITY } from "./schema.mjs";
import { assets, dependencies, owners } from "./seed-data.mjs";
import personas from "../config/demo-personas.json" with { type: "json" };

const p = config.prefix;
const allowed = personas.allowedUpnPrefixes.map((x) => x.toLowerCase());
const isAllowed = (upn) => allowed.some((prefix) => (upn ?? "").toLowerCase().startsWith(prefix));

export async function resolveOwners() {
  const users = await getAll(
    `systemusers?$select=systemuserid,fullname,domainname&$filter=isdisabled eq false and applicationid eq null and accessmode eq 0&$orderby=fullname`,
  );
  // Hard rule: only allow-listed demo personas can ever become business owners.
  const eligible = users.filter((u) => u.domainname && u.fullname && isAllowed(u.domainname));
  if (!eligible.length) throw new Error("None of the allow-listed demo personas (config/demo-personas.json) exist in this environment.");

  const resolved = {};
  let fallbackIndex = 0;
  for (const [alias, upnPrefix] of Object.entries(owners)) {
    if (!isAllowed(upnPrefix)) throw new Error(`Owner alias '${alias}' (${upnPrefix}) is not in config/demo-personas.json`);
    let user = eligible.find((u) => u.domainname.toLowerCase().startsWith(upnPrefix.toLowerCase()));
    if (!user) {
      // Deterministic fallback — still restricted to the allow-list.
      user = eligible[fallbackIndex++ % eligible.length];
      log(`Owner '${alias}' not found, using '${user.fullname}' instead`);
    }
    resolved[alias] = user;
  }
  return resolved;
}

async function upsertByKey(entitySet, key, body) {
  const path = `${entitySet}(${p}_seedkey='${encodeURIComponent(key)}')`;
  return request("PATCH", path, body, { Prefer: "return=representation" });
}

async function runWithConcurrency(items, limit, fn) {
  const queue = [...items];
  const results = [];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      results.push(await fn(item));
    }
  });
  await Promise.all(workers);
  return results;
}

export async function seed() {
  log(`Seeding ${assets.length} assets and ${dependencies.length} dependencies into ${config.orgUrl}`);
  const ownerUsers = await resolveOwners();

  const assetKeys = new Set(assets.map((a) => a[0]));
  for (const [dep, req] of dependencies) {
    if (!assetKeys.has(dep) || !assetKeys.has(req)) throw new Error(`Dependency ${dep} -> ${req} references an unknown asset`);
    if (dep === req) throw new Error(`Self dependency in seed data: ${dep}`);
  }
  const names = new Map(assets.map((a) => [a[0], a[1]]));

  let created = 0;
  let updated = 0;
  await runWithConcurrency(assets, 4, async ([key, name, type, criticality, ownerAlias, description]) => {
    if (!(type in ASSET_TYPE)) throw new Error(`Unknown type '${type}' for ${key}`);
    if (!(criticality in CRITICALITY)) throw new Error(`Unknown criticality '${criticality}' for ${key}`);
    const body = {
      [asset.columns.name]: name,
      [asset.columns.type]: ASSET_TYPE[type],
      [asset.columns.criticality]: CRITICALITY[criticality],
      [asset.columns.description]: description,
      [asset.columns.seedKey]: key,
    };
    if (ownerAlias) {
      body[`${asset.businessOwnerSchema}@odata.bind`] = `/systemusers(${ownerUsers[ownerAlias].systemuserid})`;
    }
    const row = await upsertByKey(asset.entitySet, key, body);
    const existedBefore = row["@odata.etag"] && row.modifiedon !== row.createdon;
    existedBefore ? updated++ : created++;
    if (!ownerAlias && row[`_${asset.columns.businessOwner}_value`]) {
      // Seed says "no owner" but the row has one (e.g. changed during a demo) -> clear it.
      await del(`${asset.entitySet}(${row[asset.primaryId]})/${asset.businessOwnerSchema}/$ref`);
    }
  });
  log(`Assets: ${created} created, ${updated} updated`);

  created = 0;
  updated = 0;
  await runWithConcurrency(dependencies, 4, async ([dep, req]) => {
    const key = `${dep}->${req}`;
    const body = {
      [dependency.columns.name]: `${names.get(dep)} → ${names.get(req)}`,
      [dependency.columns.description]: `${names.get(dep)} requires ${names.get(req)} to operate.`,
      [dependency.columns.seedKey]: key,
      [`${dependency.dependentAssetSchema}@odata.bind`]: `/${asset.entitySet}(${p}_seedkey='${dep}')`,
      [`${dependency.requiredAssetSchema}@odata.bind`]: `/${asset.entitySet}(${p}_seedkey='${req}')`,
    };
    const row = await upsertByKey(dependency.entitySet, key, body);
    row.modifiedon !== row.createdon ? updated++ : created++;
  });
  log(`Dependencies: ${created} created, ${updated} updated`);

  const assetCount = (await get(`${asset.entitySet}?$select=${asset.primaryId}&$filter=${p}_seedkey ne null&$count=true`))["@odata.count"];
  const depCount = (await get(`${dependency.entitySet}?$select=${dependency.primaryId}&$filter=${p}_seedkey ne null&$count=true`))["@odata.count"];
  log(`Seeded rows now in Dataverse: ${assetCount} assets, ${depCount} dependencies`);
}

const isMain = process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, "/")}`).href;
if (isMain) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
