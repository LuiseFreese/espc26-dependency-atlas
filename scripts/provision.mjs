// Provisions the Dependency Atlas publisher, solution, tables, columns, lookups and alternate keys.
// Idempotent: every step checks for existing metadata before creating anything.
// Usage: npm run provision   (requires `az login` and DATAVERSE_URL in .env)
import { config, get, getAll, post, label, log } from "./dataverse.mjs";
import { asset, dependency, ASSET_TYPE, CRITICALITY } from "./schema.mjs";

const SOLUTION_HEADER = { "MSCRM.SolutionUniqueName": config.solutionUniqueName };

// Dataverse briefly returns 0x80040216 "An unexpected error occurred" for metadata writes
// right after a table is created, while the new table is still propagating.
async function postMetadata(path, body) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await post(path, body, SOLUTION_HEADER);
    } catch (err) {
      const transient = err.status === 400 && /0x80040216/.test(err.body ?? "");
      if (!transient || attempt >= 8) throw err;
      log(`  transient metadata error, retrying in 15s (attempt ${attempt})`);
      await new Promise((r) => setTimeout(r, 15000));
    }
  }
}

async function ensurePublisher() {
  const existing = await get(
    `publishers?$select=publisherid,customizationprefix&$filter=uniquename eq '${config.publisherUniqueName}'`,
  );
  if (existing.value.length) {
    const pub = existing.value[0];
    if (pub.customizationprefix !== config.prefix) {
      throw new Error(
        `Publisher '${config.publisherUniqueName}' exists with prefix '${pub.customizationprefix}', expected '${config.prefix}'.`,
      );
    }
    log(`Publisher '${config.publisherUniqueName}' exists (${pub.publisherid})`);
    return pub.publisherid;
  }
  const res = await post("publishers", {
    uniquename: config.publisherUniqueName,
    friendlyname: config.publisherFriendlyName,
    customizationprefix: config.prefix,
    customizationoptionvalueprefix: 10000,
    description: "Publisher for the ESPC26 keynote Dependency Atlas demo",
  });
  const id = res.entityId.match(/\(([^)]+)\)/)[1];
  log(`Created publisher '${config.publisherUniqueName}' (${id})`);
  return id;
}

async function ensureSolution(publisherId) {
  const existing = await get(`solutions?$select=solutionid&$filter=uniquename eq '${config.solutionUniqueName}'`);
  if (existing.value.length) {
    log(`Solution '${config.solutionUniqueName}' exists (${existing.value[0].solutionid})`);
    return existing.value[0].solutionid;
  }
  const res = await post("solutions", {
    uniquename: config.solutionUniqueName,
    friendlyname: config.solutionFriendlyName,
    version: "1.0.0.0",
    description: "Dependency Atlas – ESPC26 keynote demo (Power Apps Code App + Dataverse)",
    "publisherid@odata.bind": `/publishers(${publisherId})`,
  });
  const id = res.entityId.match(/\(([^)]+)\)/)[1];
  log(`Created solution '${config.solutionUniqueName}' (${id})`);
  return id;
}

async function entityExists(logicalName) {
  try {
    await get(`EntityDefinitions(LogicalName='${logicalName}')?$select=MetadataId`);
    return true;
  } catch (err) {
    if (err.status === 404) return false;
    throw err;
  }
}

async function attributeExists(entity, attribute) {
  try {
    await get(`EntityDefinitions(LogicalName='${entity}')/Attributes(LogicalName='${attribute}')?$select=MetadataId`);
    return true;
  } catch (err) {
    if (err.status === 404) return false;
    throw err;
  }
}

async function relationshipExists(schemaName) {
  try {
    await get(`RelationshipDefinitions(SchemaName='${schemaName}')?$select=MetadataId`);
    return true;
  } catch (err) {
    if (err.status === 404) return false;
    throw err;
  }
}

function stringAttribute(schemaName, display, description, maxLength, required = "None") {
  return {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    SchemaName: schemaName,
    DisplayName: label(display),
    Description: label(description),
    RequiredLevel: { Value: required },
    MaxLength: maxLength,
    FormatName: { Value: "Text" },
  };
}

function memoAttribute(schemaName, display, description) {
  return {
    "@odata.type": "Microsoft.Dynamics.CRM.MemoAttributeMetadata",
    SchemaName: schemaName,
    DisplayName: label(display),
    Description: label(description),
    RequiredLevel: { Value: "None" },
    MaxLength: 4000,
    Format: "TextArea",
  };
}

function picklistAttribute(schemaName, display, description, options, required = "ApplicationRequired") {
  return {
    "@odata.type": "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
    SchemaName: schemaName,
    DisplayName: label(display),
    Description: label(description),
    RequiredLevel: { Value: required },
    OptionSet: {
      "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
      IsGlobal: false,
      OptionSetType: "Picklist",
      Options: Object.entries(options).map(([text, value]) => ({ Value: value, Label: label(text) })),
    },
  };
}

async function ensureEntity(def, primaryDisplay, primaryDescription, description) {
  if (await entityExists(def.logicalName)) {
    log(`Table '${def.logicalName}' exists`);
    return;
  }
  await post(
    "EntityDefinitions",
    {
      "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
      SchemaName: def.schemaName,
      DisplayName: label(def.displayName),
      DisplayCollectionName: label(def.pluralName),
      Description: label(description),
      OwnershipType: "OrganizationOwned",
      IsActivity: false,
      HasActivities: false,
      HasNotes: false,
      Attributes: [
        {
          ...stringAttribute(`${config.prefix}_Name`, primaryDisplay, primaryDescription, 200, "ApplicationRequired"),
          IsPrimaryName: true,
        },
      ],
    },
    SOLUTION_HEADER,
  );
  log(`Created table '${def.logicalName}'`);
}

async function ensureAttribute(entityLogical, logicalName, metadata) {
  if (await attributeExists(entityLogical, logicalName)) {
    log(`  Column '${entityLogical}.${logicalName}' exists`);
    return;
  }
  await postMetadata(`EntityDefinitions(LogicalName='${entityLogical}')/Attributes`, metadata);
  log(`  Created column '${entityLogical}.${logicalName}'`);
}

async function ensureLookup({
  relationshipSchema,
  referencedEntity,
  referencingEntity,
  lookupSchema,
  display,
  description,
  required,
  deleteBehavior,
  menuLabel,
}) {
  if (await relationshipExists(relationshipSchema)) {
    log(`  Lookup '${referencingEntity}.${lookupSchema.toLowerCase()}' exists`);
    return;
  }
  await postMetadata(
    "RelationshipDefinitions",
    {
      "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
      SchemaName: relationshipSchema,
      ReferencedEntity: referencedEntity,
      ReferencingEntity: referencingEntity,
      AssociatedMenuConfiguration: {
        Behavior: "UseLabel",
        Group: "Details",
        Label: label(menuLabel),
        Order: 10000,
      },
      CascadeConfiguration: {
        Assign: "NoCascade",
        Share: "NoCascade",
        Unshare: "NoCascade",
        Reparent: "NoCascade",
        Merge: "NoCascade",
        Delete: deleteBehavior,
      },
      Lookup: {
        "@odata.type": "Microsoft.Dynamics.CRM.LookupAttributeMetadata",
        SchemaName: lookupSchema,
        DisplayName: label(display),
        Description: label(description),
        RequiredLevel: { Value: required },
      },
    },
  );
  log(`  Created lookup '${referencingEntity}.${lookupSchema.toLowerCase()}' -> ${referencedEntity}`);
}

async function ensureAlternateKey(entityLogical, keySchema, keyColumn) {
  const keys = await get(`EntityDefinitions(LogicalName='${entityLogical}')/Keys?$select=SchemaName,EntityKeyIndexStatus`);
  let key = keys.value.find((k) => k.SchemaName === keySchema);
  if (!key) {
    await post(
      `EntityDefinitions(LogicalName='${entityLogical}')/Keys`,
      {
        SchemaName: keySchema,
        DisplayName: label("Seed Key"),
        KeyAttributes: [keyColumn],
      },
      SOLUTION_HEADER,
    );
    log(`  Created alternate key '${keySchema}'`);
  } else {
    log(`  Alternate key '${keySchema}' exists (${key.EntityKeyIndexStatus})`);
  }
  // Key index creation is asynchronous; seeding relies on the key being active.
  for (let i = 0; i < 60; i++) {
    const refreshed = await get(`EntityDefinitions(LogicalName='${entityLogical}')/Keys?$select=SchemaName,EntityKeyIndexStatus`);
    key = refreshed.value.find((k) => k.SchemaName === keySchema);
    if (key?.EntityKeyIndexStatus === "Active") return;
    if (key?.EntityKeyIndexStatus === "Failed") throw new Error(`Alternate key '${keySchema}' failed to activate`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`Alternate key '${keySchema}' did not become active in time`);
}

async function ensureComponentInSolution(solutionId, objectId, componentType) {
  const existing = await get(
    `solutioncomponents?$select=solutioncomponentid&$filter=_solutionid_value eq ${solutionId} and objectid eq ${objectId}`,
  );
  if (existing.value.length) return;
  await post("AddSolutionComponent", {
    ComponentId: objectId,
    ComponentType: componentType,
    SolutionUniqueName: config.solutionUniqueName,
    AddRequiredComponents: false,
  });
  log(`  Added component ${objectId} (type ${componentType}) to solution`);
}

async function main() {
  log(`Provisioning against ${config.orgUrl}`);
  const publisherId = await ensurePublisher();
  const solutionId = await ensureSolution(publisherId);

  // --- Asset --------------------------------------------------------------
  await ensureEntity(asset, "Asset Name", "Name of the application, API, database or external service", "A system in the landscape");
  await ensureAttribute(
    asset.logicalName,
    asset.columns.type,
    picklistAttribute(`${config.prefix}_Type`, "Type", "Kind of asset", ASSET_TYPE),
  );
  await ensureAttribute(
    asset.logicalName,
    asset.columns.criticality,
    picklistAttribute(`${config.prefix}_Criticality`, "Criticality", "Business criticality of the asset", CRITICALITY),
  );
  await ensureAttribute(
    asset.logicalName,
    asset.columns.description,
    memoAttribute(`${config.prefix}_Description`, "Description", "What the asset does"),
  );
  await ensureAttribute(
    asset.logicalName,
    asset.columns.seedKey,
    stringAttribute(`${config.prefix}_SeedKey`, "Seed Key", "Stable identifier for demo-seeded rows (empty for real data)", 100),
  );
  await ensureLookup({
    relationshipSchema: asset.businessOwnerRelationship,
    referencedEntity: "systemuser",
    referencingEntity: asset.logicalName,
    lookupSchema: asset.businessOwnerSchema,
    display: "Business Owner Reference",
    description: "Person accountable for the asset from a business perspective (not the Dataverse record owner)",
    required: "None",
    deleteBehavior: "RemoveLink",
    menuLabel: "Business-owned Assets",
  });

  // --- Dependency -----------------------------------------------------------
  await ensureEntity(
    dependency,
    "Dependency Name",
    "Readable name, e.g. 'Customer Portal → Identity API'",
    "Dependent Asset requires Required Asset to operate",
  );
  await ensureAttribute(
    dependency.logicalName,
    dependency.columns.description,
    memoAttribute(`${config.prefix}_Description`, "Description", "Why the dependency exists"),
  );
  await ensureAttribute(
    dependency.logicalName,
    dependency.columns.seedKey,
    stringAttribute(`${config.prefix}_SeedKey`, "Seed Key", "Stable identifier for demo-seeded rows (empty for real data)", 100),
  );
  await ensureLookup({
    relationshipSchema: dependency.dependentRelationship,
    referencedEntity: asset.logicalName,
    referencingEntity: dependency.logicalName,
    lookupSchema: dependency.dependentAssetSchema,
    display: "Dependent Asset Reference",
    description: "The asset that needs the required asset to operate",
    required: "ApplicationRequired",
    deleteBehavior: "Cascade",
    menuLabel: "Requires (outgoing dependencies)",
  });
  await ensureLookup({
    relationshipSchema: dependency.requiredRelationship,
    referencedEntity: asset.logicalName,
    referencingEntity: dependency.logicalName,
    lookupSchema: dependency.requiredAssetSchema,
    display: "Required Asset Reference",
    description: "The asset that the dependent asset relies on",
    required: "ApplicationRequired",
    // Only one cascade-delete (parental) relationship is allowed per table pair, so this side restricts.
    deleteBehavior: "Restrict",
    menuLabel: "Required by (incoming dependencies)",
  });

  // --- Alternate keys for idempotent seeding --------------------------------
  await ensureAlternateKey(asset.logicalName, asset.seedKeyAlternateKey, asset.columns.seedKey);
  await ensureAlternateKey(dependency.logicalName, dependency.seedKeyAlternateKey, dependency.columns.seedKey);

  // --- Make sure both tables are solution components (type 1 = Entity) ------
  for (const def of [asset, dependency]) {
    const meta = await get(`EntityDefinitions(LogicalName='${def.logicalName}')?$select=MetadataId`);
    await ensureComponentInSolution(solutionId, meta.MetadataId, 1);
  }

  log("Publishing customizations…");
  await post("PublishAllXml", {});

  const summary = {};
  for (const def of [asset, dependency]) {
    const meta = await get(`EntityDefinitions(LogicalName='${def.logicalName}')?$select=MetadataId,ObjectTypeCode,EntitySetName`);
    summary[def.logicalName] = { metadataId: meta.MetadataId, objectTypeCode: meta.ObjectTypeCode, entitySet: meta.EntitySetName };
  }
  console.log(JSON.stringify({ solutionId, publisherId, tables: summary }, null, 2));
  log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
