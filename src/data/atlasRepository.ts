// Thin repository over the generated Dataverse services: paging, mapping to domain types, and writes.
import { Espc26_assetsService } from "../generated/services/Espc26_assetsService";
import { Espc26_dependenciesService } from "../generated/services/Espc26_dependenciesService";
import { SystemusersService } from "../generated/services/SystemusersService";
import {
  Espc26_assetsespc26_criticality,
  Espc26_assetsespc26_type,
  type Espc26_assets,
  type Espc26_assetsBase,
} from "../generated/models/Espc26_assetsModel";
import type { Espc26_dependencies, Espc26_dependenciesBase } from "../generated/models/Espc26_dependenciesModel";
import type { Systemusers } from "../generated/models/SystemusersModel";
import type { IGetAllOptions } from "../generated/models/CommonModels";
import type { IOperationResult } from "@microsoft/power-apps/data";
import type { Asset, AssetType, Criticality, Dependency, Owner } from "../types";

const PAGE_SIZE = 500;

export class DataverseError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "DataverseError";
    this.cause = cause;
  }
}

function unwrap<T>(result: IOperationResult<T>, what: string): T {
  if (!result.success) {
    const detail = result.error?.message ?? "Unknown error";
    throw new DataverseError(`${what} failed: ${detail}`, result.error);
  }
  return result.data;
}

/** Follows skip tokens until Dataverse reports no further page. */
async function getAllPages<T>(
  fetchPage: (options: IGetAllOptions) => Promise<IOperationResult<T[]>>,
  options: IGetAllOptions,
  what: string,
): Promise<T[]> {
  const rows: T[] = [];
  let skipToken: string | undefined;
  do {
    const result = await fetchPage({ ...options, maxPageSize: PAGE_SIZE, skipToken });
    rows.push(...unwrap(result, what));
    skipToken = result.skipToken || undefined;
  } while (skipToken);
  return rows;
}

type AssetRow = Pick<
  Espc26_assets,
  | "espc26_assetid"
  | "espc26_name"
  | "espc26_type"
  | "espc26_criticality"
  | "espc26_description"
  | "_espc26_businessowner_value"
> & Record<string, unknown>;

type DependencyRow = Pick<
  Espc26_dependencies,
  "espc26_dependencyid" | "espc26_name" | "espc26_description" | "_espc26_dependentasset_value" | "_espc26_requiredasset_value"
>;

type UserRow = Pick<Systemusers, "systemuserid" | "fullname" | "internalemailaddress" | "domainname">;

function toAsset(row: AssetRow, owners: Map<string, Owner>): Asset {
  const ownerId = row._espc26_businessowner_value ?? undefined;
  const formattedOwner = row["_espc26_businessowner_value@OData.Community.Display.V1.FormattedValue"];
  return {
    id: row.espc26_assetid,
    name: row.espc26_name ?? "(unnamed)",
    type: (Espc26_assetsespc26_type[row.espc26_type] ?? "Application") as AssetType,
    criticality: (Espc26_assetsespc26_criticality[row.espc26_criticality] ?? "Medium") as Criticality,
    description: row.espc26_description ?? undefined,
    ownerId,
    ownerName: ownerId ? (owners.get(ownerId)?.name ?? (typeof formattedOwner === "string" ? formattedOwner : undefined)) : undefined,
  };
}

function toDependency(row: DependencyRow): Dependency | null {
  if (!row._espc26_dependentasset_value || !row._espc26_requiredasset_value) return null;
  return {
    id: row.espc26_dependencyid,
    name: row.espc26_name ?? "",
    description: row.espc26_description ?? undefined,
    dependentId: row._espc26_dependentasset_value,
    requiredId: row._espc26_requiredasset_value,
  };
}

function toOwner(row: UserRow): Owner {
  return {
    id: row.systemuserid,
    name: row.fullname ?? row.domainname ?? "Unknown user",
    email: row.internalemailaddress ?? row.domainname ?? undefined,
  };
}

export async function loadOwners(): Promise<Owner[]> {
  const rows = await getAllPages<UserRow>(
    (o) => SystemusersService.getAll<UserRow>(o),
    {
      select: ["systemuserid", "fullname", "internalemailaddress", "domainname"],
      // Interactive, enabled, licensed people only — no application users or disabled accounts.
      filter: "isdisabled eq false and applicationid eq null and accessmode eq 0",
      orderBy: ["fullname asc"],
    },
    "Loading users",
  );
  return rows.filter((r) => r.fullname && !r.fullname.startsWith("#")).map(toOwner);
}

export async function loadAssets(owners: Map<string, Owner>): Promise<Asset[]> {
  const rows = await getAllPages<AssetRow>(
    (o) => Espc26_assetsService.getAll<AssetRow>(o),
    {
      select: ["espc26_assetid", "espc26_name", "espc26_type", "espc26_criticality", "espc26_description", "_espc26_businessowner_value"],
      filter: "statecode eq 0",
      orderBy: ["espc26_name asc"],
    },
    "Loading assets",
  );
  return rows.map((r) => toAsset(r, owners));
}

export async function loadDependencies(): Promise<Dependency[]> {
  const rows = await getAllPages<DependencyRow>(
    (o) => Espc26_dependenciesService.getAll<DependencyRow>(o),
    {
      select: [
        "espc26_dependencyid",
        "espc26_name",
        "espc26_description",
        "_espc26_dependentasset_value",
        "_espc26_requiredasset_value",
      ],
      filter: "statecode eq 0",
    },
    "Loading dependencies",
  );
  return rows.map(toDependency).filter((d): d is Dependency => d !== null);
}

/** Sets or clears (ownerId = null) the business owner lookup. */
export async function updateAssetOwner(assetId: string, ownerId: string | null): Promise<void> {
  // Lookups are written through the single-valued navigation property; null disassociates.
  const changes = {
    "espc26_BusinessOwner@odata.bind": ownerId ? `/systemusers(${ownerId})` : null,
  } as unknown as Partial<Omit<Espc26_assetsBase, "espc26_assetid">>;
  unwrap(await Espc26_assetsService.update(assetId, changes), "Updating business owner");
}

export async function createDependency(input: {
  dependent: Asset;
  required: Asset;
  description?: string;
}): Promise<Dependency> {
  const record: Omit<Espc26_dependenciesBase, "espc26_dependencyid"> = {
    espc26_name: `${input.dependent.name} → ${input.required.name}`,
    espc26_description: input.description ?? `${input.dependent.name} requires ${input.required.name} to operate.`,
    "espc26_DependentAsset@odata.bind": `/espc26_assets(${input.dependent.id})`,
    "espc26_RequiredAsset@odata.bind": `/espc26_assets(${input.required.id})`,
    statecode: 0,
  };
  const created = unwrap(await Espc26_dependenciesService.create(record), "Creating dependency");
  return {
    id: created.espc26_dependencyid,
    name: record.espc26_name ?? "",
    description: record.espc26_description,
    dependentId: input.dependent.id,
    requiredId: input.required.id,
  };
}
