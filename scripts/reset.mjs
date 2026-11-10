// Restores the demo to its seeded state:
//  1. deletes every dependency that touches a seeded asset (including ones created live during the demo),
//  2. deletes every seeded asset,
//  3. re-runs the seed.
// Rows without a seed key that are not connected to seeded assets are left untouched.
// Usage: npm run reset
import { config, getAll, del, log } from "./dataverse.mjs";
import { asset, dependency } from "./schema.mjs";
import { seed } from "./seed.mjs";

const p = config.prefix;

async function deleteAll(entitySet, ids, label) {
  let done = 0;
  const queue = [...ids];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const id = queue.shift();
        await del(`${entitySet}(${id})`);
        done++;
      }
    }),
  );
  log(`Deleted ${done} ${label}`);
}

async function reset() {
  log(`Resetting demo data in ${config.orgUrl}`);
  const seededAssets = await getAll(`${asset.entitySet}?$select=${asset.primaryId}&$filter=${p}_seedkey ne null`);
  const seededIds = new Set(seededAssets.map((a) => a[asset.primaryId]));

  const allDeps = await getAll(
    `${dependency.entitySet}?$select=${dependency.primaryId},_${dependency.columns.dependentAsset}_value,_${dependency.columns.requiredAsset}_value,${p}_seedkey`,
  );
  const depsToDelete = allDeps.filter(
    (d) =>
      d[`${p}_seedkey`] ||
      seededIds.has(d[`_${dependency.columns.dependentAsset}_value`]) ||
      seededIds.has(d[`_${dependency.columns.requiredAsset}_value`]),
  );
  const liveCreated = depsToDelete.filter((d) => !d[`${p}_seedkey`]).length;
  log(`${seededIds.size} seeded assets, ${depsToDelete.length} dependencies to remove (${liveCreated} created outside the seed)`);

  await deleteAll(dependency.entitySet, depsToDelete.map((d) => d[dependency.primaryId]), "dependencies");
  await deleteAll(asset.entitySet, [...seededIds], "assets");
  await seed();
  log("Reset complete.");
}

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});
