import { Obj } from "@mongez/reinforcements";
import { RouterConfigurations } from "./types";

export let routerConfigurations: RouterConfigurations = {};

export function setRouterConfigurations(configurations: RouterConfigurations) {
  routerConfigurations = Obj.merge(routerConfigurations, configurations);
}

export function getRouterConfig(key?: string, defaultValue?: any): any {
  if (arguments.length === 0) return routerConfigurations;

  return Obj.get(routerConfigurations, key, defaultValue);
}
