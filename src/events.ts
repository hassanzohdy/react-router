import events, { EventSubscription } from "@mongez/events";
import { routerEventType, RouterEventLocaleChangeCallback } from "./types";

const routerEventsNamespace: string = "router.";

const routerEvents = {
  onLocaleCodeChange(
    callback: RouterEventLocaleChangeCallback
  ): EventSubscription {
    return events.subscribe(
      routerEventsNamespace + "localeCodeChange",
      callback
    );
  },
  // TODO
  onNavigating() {},
  // TODO
  onNavigation() {},
  trigger(eventName: routerEventType, ...args: any[]): void {
    events.trigger(routerEventsNamespace + eventName, ...args);
  },
};

export default routerEvents;
