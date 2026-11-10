// Provisions a companion model-driven app ("Dependency Atlas Admin") over the same two tables.
// Purpose on stage: prove "data and platform, not apps" — a zero-code UI on the identical Dataverse rows,
// so an owner change made in the React code app shows up here immediately.
// Idempotent: forms/views are updated in place, the app/sitemap are created only if missing.
// Usage: npm run provision:mda   (after `npm run provision`)
import { config, get, post, patch, log } from "./dataverse.mjs";
import { asset, dependency } from "./schema.mjs";

const p = config.prefix;
const APP_UNIQUE_NAME = `${p}_DependencyAtlasAdmin`;
const APP_NAME = "Dependency Atlas Admin";
const SOLUTION_HEADER = { "MSCRM.SolutionUniqueName": config.solutionUniqueName };

// Unified Interface control class ids
const CLS = {
  text: "{4273EDBD-AC1D-40d3-9FB2-095C621B552D}",
  picklist: "{3EF39988-22BB-4f0b-BBBE-64B5A3748AEE}",
  lookup: "{270BD3DB-D9AF-4782-9025-509E298DEC0A}",
  memo: "{E0DECE4B-6FC8-4a8f-A065-082708572369}",
};

const guid = () => `{${crypto.randomUUID().toUpperCase()}}`;

function cell(logical, classid, label, idPrefix = "") {
  return `<cell id="${guid()}"><labels><label description="${label}" languagecode="1033" /></labels><control id="${idPrefix}${logical}" classid="${classid}" datafieldname="${logical}" /></cell>`;
}

function mainForm(sectionLabel, fields) {
  const body = fields.map((f) => `<row>${cell(f.logical, f.classid, f.label)}</row>`).join("");
  // Header shows the second to fourth fields read-only; control ids must differ from the body ones.
  const header = fields
    .slice(1, 4)
    .map((f) => cell(f.logical, f.classid, f.label, "header_").replace("<control ", '<control disabled="true" '))
    .join("");
  return (
    `<form><tabs><tab verticallayout="true" id="${guid()}" IsUserDefined="1" name="general">` +
    `<labels><label description="General" languagecode="1033" /></labels><columns><column width="100%"><sections>` +
    `<section showlabel="false" showbar="false" IsUserDefined="0" id="${guid()}" columns="1" name="main">` +
    `<labels><label description="${sectionLabel}" languagecode="1033" /></labels><rows>${body}</rows></section></sections></column></columns></tab></tabs>` +
    `<header id="${guid()}" columns="111" labelwidth="115" celllabelalignment="Left" celllabelposition="Top"><rows><row>${header}</row></rows></header></form>`
  );
}

async function updateMainForm(entityLogical, formxml) {
  const forms = await get(`systemforms?$select=formid,name&$filter=objecttypecode eq '${entityLogical}' and type eq 2`);
  for (const f of forms.value) {
    await patch(`systemforms(${f.formid})`, { formxml }, SOLUTION_HEADER);
    log(`  Updated main form '${f.name}' on ${entityLogical}`);
  }
}

async function updateDefaultView(entityLogical, objectTypeCode, primaryId, columns, orderBy) {
  const views = await get(
    `savedqueries?$select=savedqueryid,name&$filter=returnedtypecode eq '${entityLogical}' and querytype eq 0 and isdefault eq true`,
  );
  const layoutxml =
    `<grid name="resultset" object="${objectTypeCode}" jump="${p}_name" select="1" icon="1" preview="1"><row name="result" id="${primaryId}">` +
    columns.map(([name, width]) => `<cell name="${name}" width="${width}" />`).join("") +
    `</row></grid>`;
  const fetchxml =
    `<fetch version="1.0" mapping="logical"><entity name="${entityLogical}"><attribute name="${primaryId}" />` +
    columns.map(([name]) => `<attribute name="${name}" />`).join("") +
    `<order attribute="${orderBy}" descending="false" /><filter type="and"><condition attribute="statecode" operator="eq" value="0" /></filter></entity></fetch>`;
  for (const v of views.value) {
    await patch(`savedqueries(${v.savedqueryid})`, { layoutxml, fetchxml }, SOLUTION_HEADER);
    log(`  Updated view '${v.name}' on ${entityLogical}`);
  }
}

async function ensureApp() {
  // Unpublished app modules are invisible to plain GETs; RetrieveUnpublishedMultiple sees both.
  const existing = await get(
    `appmodules/Microsoft.Dynamics.CRM.RetrieveUnpublishedMultiple()?$select=appmoduleid,name&$filter=uniquename eq '${APP_UNIQUE_NAME}'`,
  );
  if (existing.value.length) {
    log(`App '${APP_NAME}' exists (${existing.value[0].appmoduleid})`);
    return existing.value[0].appmoduleid;
  }
  const res = await post(
    "appmodules",
    {
      name: APP_NAME,
      uniquename: APP_UNIQUE_NAME,
      description: "Zero-code companion to the Dependency Atlas code app: same Dataverse tables, generated UI.",
      clienttype: 4,
      formfactor: 1,
      navigationtype: 0,
      webresourceid: "953b9fac-1e5e-e611-80d6-00155ded156f",
    },
    SOLUTION_HEADER,
  );
  const id = res.entityId.match(/\(([^)]+)\)/)[1];
  log(`Created app '${APP_NAME}' (${id})`);
  return id;
}

async function ensureSiteMap(appId) {
  const existing = await get(`sitemaps?$select=sitemapid&$filter=sitemapnameunique eq '${APP_UNIQUE_NAME}_SiteMap'`);
  if (existing.value.length) {
    log(`Sitemap exists (${existing.value[0].sitemapid})`);
    return existing.value[0].sitemapid;
  }
  const sitemapxml =
    `<SiteMap IntroducedVersion="7.0.0.0"><Area Id="atlas" ResourceId="SitemapDesigner.NewTitle" DescriptionResourceId="SitemapDesigner.NewTitle" ShowGroups="true" IntroducedVersion="7.0.0.0">` +
    `<Titles><Title LCID="1033" Title="Landscape" /></Titles>` +
    `<Group Id="landscape" ResourceId="SitemapDesigner.NewGroup" DescriptionResourceId="SitemapDesigner.NewGroup" IntroducedVersion="7.0.0.0" IsProfile="false" ToolTipResourseId="SitemapDesigner.Unknown">` +
    `<Titles><Title LCID="1033" Title="Landscape" /></Titles>` +
    `<SubArea Id="assets" Entity="${asset.logicalName}" Client="All,Outlook,OutlookLaptopClient,OutlookWorkstationClient,Web" AvailableOffline="true" PassParams="false" Sku="All,OnPremise,Live,SPLA"><Titles><Title LCID="1033" Title="Assets" /></Titles></SubArea>` +
    `<SubArea Id="dependencies" Entity="${dependency.logicalName}" Client="All,Outlook,OutlookLaptopClient,OutlookWorkstationClient,Web" AvailableOffline="true" PassParams="false" Sku="All,OnPremise,Live,SPLA"><Titles><Title LCID="1033" Title="Dependencies" /></Titles></SubArea>` +
    `</Group></Area></SiteMap>`;
  const res = await post(
    "sitemaps",
    { sitemapname: `${APP_NAME} SiteMap`, sitemapnameunique: `${APP_UNIQUE_NAME}_SiteMap`, sitemapxml },
    SOLUTION_HEADER,
  );
  const id = res.entityId.match(/\(([^)]+)\)/)[1];
  log(`Created sitemap (${id})`);
  await post("AddAppComponents", {
    AppId: appId,
    Components: [{ "@odata.type": "Microsoft.Dynamics.CRM.sitemap", sitemapid: id }],
  });
  return id;
}

async function ensureEntityComponents(appId) {
  const app = (
    await get(`appmodules/Microsoft.Dynamics.CRM.RetrieveUnpublishedMultiple()?$select=appmoduleidunique&$filter=appmoduleid eq ${appId}`)
  ).value[0];
  const existing = await get(
    `appmodulecomponents?$select=objectid&$filter=_appmoduleidunique_value eq ${app.appmoduleidunique} and componenttype eq 1`,
  );
  const have = new Set(existing.value.map((c) => c.objectid.toLowerCase()));
  const components = [];
  for (const def of [asset, dependency]) {
    const meta = await get(`EntityDefinitions(LogicalName='${def.logicalName}')?$select=MetadataId`);
    if (!have.has(meta.MetadataId.toLowerCase())) components.push({ "@odata.type": "Microsoft.Dynamics.CRM.entity", entityid: meta.MetadataId });
  }
  if (components.length) {
    await post("AddAppComponents", { AppId: appId, Components: components });
    log(`  Added ${components.length} table(s) to the app`);
  } else {
    log("  Tables already in the app");
  }
}

async function main() {
  log(`Provisioning model-driven app in ${config.orgUrl}`);

  const assetMeta = await get(`EntityDefinitions(LogicalName='${asset.logicalName}')?$select=ObjectTypeCode`);
  const depMeta = await get(`EntityDefinitions(LogicalName='${dependency.logicalName}')?$select=ObjectTypeCode`);

  await updateMainForm(
    asset.logicalName,
    mainForm("Asset", [
      { logical: asset.columns.name, classid: CLS.text, label: "Asset Name" },
      { logical: asset.columns.type, classid: CLS.picklist, label: "Type" },
      { logical: asset.columns.criticality, classid: CLS.picklist, label: "Criticality" },
      { logical: asset.columns.businessOwner, classid: CLS.lookup, label: "Business Owner Reference" },
      { logical: asset.columns.description, classid: CLS.memo, label: "Description" },
    ]),
  );
  await updateDefaultView(
    asset.logicalName,
    assetMeta.ObjectTypeCode,
    asset.primaryId,
    [
      [asset.columns.name, 260],
      [asset.columns.type, 140],
      [asset.columns.criticality, 120],
      [asset.columns.businessOwner, 220],
      ["modifiedon", 150],
    ],
    asset.columns.name,
  );

  await updateMainForm(
    dependency.logicalName,
    mainForm("Dependency", [
      { logical: dependency.columns.name, classid: CLS.text, label: "Dependency Name" },
      { logical: dependency.columns.dependentAsset, classid: CLS.lookup, label: "Dependent Asset Reference" },
      { logical: dependency.columns.requiredAsset, classid: CLS.lookup, label: "Required Asset Reference" },
      { logical: dependency.columns.description, classid: CLS.memo, label: "Description" },
    ]),
  );
  await updateDefaultView(
    dependency.logicalName,
    depMeta.ObjectTypeCode,
    dependency.primaryId,
    [
      [dependency.columns.name, 300],
      [dependency.columns.dependentAsset, 220],
      [dependency.columns.requiredAsset, 220],
      ["modifiedon", 150],
    ],
    dependency.columns.name,
  );

  const appId = await ensureApp();
  await ensureSiteMap(appId);
  await ensureEntityComponents(appId);

  log("Publishing…");
  await post("PublishXml", {
    ParameterXml:
      `<importexportxml><entities><entity>${asset.logicalName}</entity><entity>${dependency.logicalName}</entity></entities>` +
      `<appmodules><appmodule>${appId}</appmodule></appmodules></importexportxml>`,
  });
  const validation = await get(`ValidateApp(AppModuleId=${appId})`);
  const issues = validation?.AppValidationResponse?.ValidationIssueList ?? [];
  for (const i of issues) log(`  validation ${i.ErrorType}: ${i.Message}`);
  if (issues.some((i) => String(i.ErrorType) === "0" || i.ErrorType === "Error")) throw new Error("App validation reported errors");

  const url = `${config.orgUrl}/main.aspx?appid=${appId}`;
  console.log(JSON.stringify({ appId, uniqueName: APP_UNIQUE_NAME, url }, null, 2));
  log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
