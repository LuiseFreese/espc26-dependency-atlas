// Logical schema for the Dependency Atlas demo. Shared by provision/seed/reset and documented in README.
import { config } from "./dataverse.mjs";

const p = config.prefix;

export const ASSET_TYPE = {
  Application: 100000000,
  API: 100000001,
  Database: 100000002,
  "External Service": 100000003,
};

export const CRITICALITY = {
  Low: 100000000,
  Medium: 100000001,
  High: 100000002,
};

export const asset = {
  schemaName: `${p}_Asset`,
  logicalName: `${p}_asset`,
  entitySet: `${p}_assets`,
  displayName: "Asset",
  pluralName: "Assets",
  primaryId: `${p}_assetid`,
  columns: {
    name: `${p}_name`,
    type: `${p}_type`,
    criticality: `${p}_criticality`,
    description: `${p}_description`,
    seedKey: `${p}_seedkey`,
    businessOwner: `${p}_businessowner`,
  },
  businessOwnerSchema: `${p}_BusinessOwner`,
  businessOwnerRelationship: `${p}_systemuser_${p}_asset_businessowner`,
  seedKeyAlternateKey: `${p}_asset_seedkey`,
};

export const dependency = {
  schemaName: `${p}_Dependency`,
  logicalName: `${p}_dependency`,
  entitySet: `${p}_dependencies`,
  displayName: "Dependency",
  pluralName: "Dependencies",
  primaryId: `${p}_dependencyid`,
  columns: {
    name: `${p}_name`,
    dependentAsset: `${p}_dependentasset`,
    requiredAsset: `${p}_requiredasset`,
    description: `${p}_description`,
    seedKey: `${p}_seedkey`,
  },
  dependentAssetSchema: `${p}_DependentAsset`,
  requiredAssetSchema: `${p}_RequiredAsset`,
  dependentRelationship: `${p}_asset_dependency_dependent`,
  requiredRelationship: `${p}_asset_dependency_required`,
  seedKeyAlternateKey: `${p}_dependency_seedkey`,
};
