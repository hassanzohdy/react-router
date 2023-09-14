import { setLinkOptions } from "./components/Link/Link";
import { setQueryStringOptions } from "./query-string";
import router from "./router";
import { RouterConfigurations } from "./types";

let routerConfigurations: Partial<RouterConfigurations> = {};

export function setRouterConfigurations(configurations: RouterConfigurations) {
  if (configurations.basePath) {
    router.setBasePath(configurations.basePath);
  }

  if (configurations.notFound) {
    router.setNotFound(configurations.notFound);
  }

  if (configurations.lazyLoading) {
    router.setLazyLoading(configurations.lazyLoading);
  }

  if (configurations.rootComponent) {
    router.setRootComponent(configurations.rootComponent);
  }

  if (configurations.strictMode !== undefined) {
    router.strictMode(configurations.strictMode);
  }

  if (configurations.localization) {
    router.setLocalization(configurations.localization);
  }

  if (configurations.forceRefresh !== undefined) {
    router.forceRefresh(configurations.forceRefresh);
  }

  if (configurations.urlMatcher) {
    router.setMatcher(configurations.urlMatcher);
  }

  if (configurations.queryString) {
    setQueryStringOptions(configurations.queryString);
  }

  if (configurations.link) {
    setLinkOptions(configurations.link);
  }

  if (configurations.scrollToTop !== false) {
    router.setScrollToTop(configurations.scrollToTop);
  }

  if (configurations.autoRedirectToLocaleCode !== undefined) {
    router.setAutoRedirectToDefaultLocaleCode(
      configurations.autoRedirectToLocaleCode
    );
  }

  routerConfigurations = { ...routerConfigurations, ...configurations };
}

export function getRouterConfig(
  key: keyof RouterConfigurations,
  defaultValue: any
) {
  return routerConfigurations[key] || defaultValue;
}

export function getRouterConfigurations() {
  return routerConfigurations;
}
