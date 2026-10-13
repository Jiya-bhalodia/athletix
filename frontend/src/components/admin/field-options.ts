import type { Option } from "./CrudPage";

export const opts = (values: readonly string[]): Option[] =>
  values.map((value) => ({ value, label: value }));
