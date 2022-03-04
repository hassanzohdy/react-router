import { Obj } from "@mongez/reinforcements";
import { RouterConfigurations } from "./types";

export let routerConfigurations: RouterConfigurations = {};

export function setRouterConfigurations(configurations: RouterConfigurations) {
  routerConfigurations = Obj.merge(routerConfigurations, configurations);
}

export function getRouterConfig(key?: string, defaultValue?: any): any {
  if (arguments.length === 0) return routerConfigurations;

  return Obj.get(routerConfigurations, key as string, defaultValue);
}

export function setRouterConfig(key: string, newValue?: any): any {
  Obj.set(routerConfigurations, key, newValue);
}
