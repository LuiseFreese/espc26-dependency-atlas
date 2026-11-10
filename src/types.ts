export type AssetType = "Application" | "API" | "Database" | "External Service";
export type Criticality = "Low" | "Medium" | "High";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  criticality: Criticality;
  ownerId?: string;
  ownerName?: string;
  description?: string;
}

/** "Dependent requires Required to operate." */
export interface Dependency {
  id: string;
  name: string;
  dependentId: string;
  requiredId: string;
  description?: string;
}

export interface Owner {
  id: string;
  name: string;
  email?: string;
}

export type ImpactState = "unavailable" | "direct" | "indirect" | "unaffected";
