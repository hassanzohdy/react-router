import { Obj } from "@mongez/reinforcements";
import { RouterConfigurations } from "./types";

export let currentConfigurations: RouterConfigurations = {};

export function setRouterConfigurations(configurations: RouterConfigurations) {
  currentConfigurations = Obj.merge(currentConfigurations, configurations);
}

export function getRouterConfig(key: string, defaultValue?: any): any {
  return Obj.get(currentConfigurations, key, defaultValue);
}
