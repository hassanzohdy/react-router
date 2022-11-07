import events, { EventSubscription } from "@mongez/events";
import { NavigationMode } from "./types";
export type RouterEvents = {
  /**
   * Callback when the router is about to change the current route
   */
  onNavigating: (
    callback: (
      route: string,
      navigationType: NavigationMode,
      previousRoute: string
    ) => void
  ) => EventSubscription;
  //   /**
  //    * Callback when the router has changed the current route
  //    */
  //   onNavigated: (
  //     callback: (route: string, navigationType: NavigationMode) => void
  //   ) => EventSubscription;
  /**
   * Triggered when locale code is about to change
   */
  onLocaleChanging: (
    callback: (localeCode: string, oldLocaleCode: string) => void
  ) => EventSubscription;
  /**
   * Triggered when locale code is changed
   */
  onLocaleChanged: (
    callback: (newLocaleCode: string, oldLocaleCode: string) => void
  ) => EventSubscription;
  /**
   * Triggered when page is about to be rendered
   */
  onRendering: (
    callback: (route: string, navigationType: NavigationMode) => void
  ) => EventSubscription;
  /**
   * Triggered on page is rendered
   */
  onPageRendered: (
    callback: (route: string, navigationType: NavigationMode) => void
  ) => EventSubscription;
};

const routerEvents: RouterEvents = {
  onNavigating: (callback) => {
    return events.subscribe(`router.navigating`, callback);
  },
  //   onNavigated: (callback) => {
  //     return events.subscribe(`router.navigated`, callback);
  //   },
  onLocaleChanging: (callback) => {
    return events.subscribe(`router.localeCodeChanging`, callback);
  },
  onLocaleChanged: (callback) => {
    return events.subscribe(`router.localeChanged`, callback);
  },
  onRendering: (callback) => {
    return events.subscribe(`router.rendering`, callback);
  },
  onPageRendered: (callback) => {
    return events.subscribe(`router.rendered`, callback);
  },
};

export type RouterEventType =
  | "navigating"
  //   | "navigated"
  | "rendering"
  | "rendered"
  | "localeCodeChanging"
  | "localeChanged";

export function triggerEvent(eventName: RouterEventType, ...args: any[]) {
  events.trigger("router." + eventName, ...args);
}

export default routerEvents;
