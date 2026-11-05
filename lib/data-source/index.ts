import { apiSource } from "./api";
import { demoSource } from "../demo/store";
import { DATA_SOURCE, type DataSource } from "./types";

/** The active data source, picked at build time by NEXT_PUBLIC_DATA_SOURCE ("demo" by default, or "api"). */
export const dataSource: DataSource = DATA_SOURCE === "api" ? apiSource : demoSource;
export * from "./types";
