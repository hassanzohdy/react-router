import events, { EventSubscription } from "@mongez/events";
import { routerEventType, RouterEventLocaleChangeCallback } from "./types";

const routerEventsNamespace: string = "router.";

const routerChangeEvent = `${routerEventsNamespace}change`;

// const history = window.history;

// const pushState = history.pushState;
// history.pushState = function () {
//   pushState.apply(history, arguments as any);

//   events.trigger(routerChangeEvent);
// };

// const replaceState = history.replaceState;
// history.replaceState = function () {
//   replaceState.apply(history, arguments as any);

//   events.trigger(routerChangeEvent);
// };

// window.onpopstate = (e) => {
//   events.trigger(routerChangeEvent, e.state);
// };

export const routerEvents = {
  onLocaleCodeChange(
    callback: RouterEventLocaleChangeCallback
  ): EventSubscription {
    return events.subscribe(
      routerEventsNamespace + "localeCodeChange",
      callback
    );
  },
  onChange(callback: any) {
    return events.subscribe(routerChangeEvent, callback);
  },
  trigger(eventName: routerEventType, ...args: any[]): void {
    events.trigger(routerEventsNamespace + eventName, ...args);
  },
};
