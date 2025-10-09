export type EntityType = "AA" | "FIP" | "FIU";
export type FilterType = "all" | EntityType;
export type Entity = { name: string; id: string; type: EntityType };
