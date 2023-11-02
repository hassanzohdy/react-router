# Mongez React Router (MRR)

A powerful react router system to manage React Js App routes.

> For illustrations only, this documentation page will work as with typescript project, but this can be done in javascript projects as well.

## Highlighted Features

- ✅ Declaring routes in a more readable and clean way.
- ✅ Common Layout base for multiple routes so there won't be rerendering for partials such as header and footer.
- ✅ Easy Middleware definitions
- ✅ Lazy loading for entire apps and module to reduce production bundle size.
- ✅ Grouping routes with common features such as setting base path, common middleware between routes.
- ✅ Language switching without reloading the page
- ✅ Base layout to set common components in one place such as Header and Footer of the page.
- ✅ Page Refreshing when navigating to the same route, as an option.
- ✅ Many helpers to navigate between routes using functions.
- ✅ No ugly writing for routes in components.

## React 17 And earlier

If you're using React 17, please use [Version 1 instead](https://github.com/hassanzohdy/react-router/tree/version-1).

Version 2 works with React `18` and higher.

## Installation

`yarn add @mongez/react-router`

Or

`npm i @mongez/react-router`

## Usage

In your `src/index` file import the package and clear the `ReactDOM.render` section.

```tsx
// src/index.ts
import router from "@mongez/react-router";

// remove the following code from the file
import ReactDOM from "react-dom";
import App from "./App";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
```

Now let's add a route for our home page

```tsx
// src/index.ts
import router from "@mongez/react-router";

// Start scanning for all of registered routes
router.scan();
```

## Registering Routes

Now the router will scan for all of the registered routes, and try to match current route with the registered routes.

But we didn't register any route yet, so let's do it.

```tsx
// src/routes.ts
import router from "@mongez/react-router";
import HomePage from "./pages/HomePage";

router.add("/", HomePage);
```

Now let's import the `routes.ts` file in our `src/index.ts` file.

```tsx
// src/index.ts
import router from "@mongez/react-router";
import "./routes";

// Start scanning for all of registered routes
router.scan();
```

Now the app is ready to be served in `/` route.

> Please keep in mind to set `router.scan` after declaring all of your routes first.

## Declaring Routes

There are many ways to declare routes, but the most common way is to use `router.add` function.

```tsx
// src/routes.ts
import router from "@mongez/react-router";
import HomePage from "./pages/HomePage";

router.add("/", HomePage);
```

This is the basic usage, we can also use dynamic paths, for example getting the user id from the url.

```tsx
// src/routes.ts
import router from "@mongez/react-router";
import HomePage from "./pages/HomePage";
import UserDetailsPage from "./pages/UserDetailsPage";

router.add("/", HomePage);
router.add("/users/:id", UserDetailsPage);
```

Now the `UserDetailsPage` will receive `params` object in its props, and the `id` will be available in `params.id`.

```tsx
// src/pages/UserDetailsPage.tsx
import React from "react";

export default function UserDetailsPage({ params }) {
  const userId = params.id;

  return <div>User ID: {userId}</div>;
}
```

## Adding New Route

Routes can be added in the router container using `router.add` method, it accepts four parameters:

- `path`: The path of the route, it can be a string or an array of strings.
- `component`: The component to be rendered when the route is matched.
- `middleware`: an array of middleware to be executed before rendering the component.
- `layout`: the Base layout component that page will be rendered inside it.

```ts
import HomePage from "./HomePage";
import Guardian from "./middleware/Guardian";
import BaseLayout from "./layouts/BaseLayout";
router.add("/", HomePage, [Guardian], BaseLayout);
```

The only required parameter is the `path` and the `component`, the rest are optional.

You can also customize it by passing one argument as an object.

```ts
router.add({
  path: "/",
  component: HomePage,
  middleware: [IsLoggedIn],
  layout: BaseLayout,
});
```

## Route Middleware

Some routes require a step head before navigating to its component. for example the visitor can not access his/her account dashboard unless he/she is logged in, in such a scenario we can use a middleware.

```ts
// src/routes.ts
import router from "@mongez/react-router";

import AccountDashboardPage from "./pages/DashboardPage";
import EditProfilePage from "./pages/EditProfilePage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import SingleOrderHistoryPage from "./pages/SingleOrderHistoryPage";
import Guardian from "./middleware/Guardian";

router.add("/account", AccountDashboardPage, [Guardian]);
router.add("/account/edit-profile", EditProfilePage), [Guardian];
router.add("/account/order-history", OrderHistoryPage, [Guardian]);
router.add("/account/order-history/:id", SingleOrderHistoryPage, [Guardian]);
```

Here we defined our routes, with a new argument in `router.add` which is an array of middleware that will be declared before navigating to our pages.

Now let's see our new Guardian middleware file.

```tsx
// src/middleware/Guardian.tsx
import user from "somewhere-in-the-app";
import React from "react";
import { navigateTo } from "@mongez/react-router";

export default function Guardian() {
  if (user.isNotLoggedIn()) {
    return navigateTo("/login");
  }

  return null;
}
```

Here we defined a component that allows us to check if user is not logged in, then we'll redirect the user to the login route by using `navigateTo` utility from `MRR`.

Now whenever a user hits any of the account routes, the `Guardian` component will be called first, if the user is not logged in then he/she will be redirected to the given route `/login` and called instead of the current page component.

If the middleware returned a value, then it will be displayed instead of the page component.

So the middleware can look like:

```tsx
// src/middleware/Guardian.tsx
import user from "somewhere-in-the-app";
import React from "react";

export default function Guardian() {
  if (user.isNotLoggedIn()) {
    return <h1>You do not have access to this page, please login first.</h1>;
  }

  return null;
}
```

## Page Base Layout

Most of the apps has same layout structure such as a `header` and a `footer` among it the content of the page.

This can be done easily with `MRR` by using `router.partOf` method.

```tsx
// src/components/BaseLayout.tsx
import React from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function BaseLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

Now let's add our New Base layout to our HomePage.

```ts
// src/routes.ts
import router from "@mongez/router";
import HomePage from "./pages/HomePage";
import BaseLayout from "./components/BaseLayout";

router.partOf(BaseLayout, [
  {
    path: "/",
    component: HomePage,
  },
]);
```

Now our `HomePage` component doesn't need to call the header or the footer of the page, it is now part of the `BaseLayout`.

### Extending Base Layout

Let's take another scenario that the account pages have a common sidebar between all of its page, we can make a newer layout that can hold the header, footer and the account sidebar.

```tsx
// src/components/AccountLayout.tsx
import React from "react";
import Header from "./Header";
import Header from "./Footer";
import AccountSidebar from "./AccountSidebar";

export default function AccountLayout({ children }) {
  return (
    <>
      <Header />
      <main>
        <AccountSidebar />
        <div>{children}</div>
      </main>
      <Footer />
    </>
  );
}
```

Now let's our account routes again to use our new layout instead of the base layout.

```ts
// src/routes.ts
import router from "@mongez/react-router";

import AccountDashboardPage from "./pages/DashboardPage";
import EditProfilePage from "./pages/EditProfilePage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import SingleOrderHistoryPage from "./pages/SingleOrderHistoryPage";
import Guardian from "./middleware/Guardian";

import AccountLayout from "./components/AccountLayout";

router.group({
  path: "/account",
  layout: AccountLayout,
  middleware: [Guardian],
  routes: [
    {
      path: "/",
      component: AccountDashboardPage,
    },
    {
      path: "/edit-profile",
      component: EditProfilePage,
    },
    {
      path: "/order-history",
      component: OrderHistoryPage,
    },
    {
      path: "/order-history/:id",
      component: SingleOrderHistoryPage,
    },
  ],
});
```

Now we're almost done, one more thing to do is to extend our base layout as we injected the header and the footer again in the `AccountLayout` component, let's fix this.

```tsx
// src/components/AccountLayout.tsx
import React from "react";
import BaseLayout from "apps/front-office/components/BaseLayout";
import AccountSidebar from "./AccountSidebar";

export default function AccountLayout({ children }) {
  return (
    <BaseLayout>
      <AccountSidebar />
      <div>{children}</div>
    </BaseLayout>
  );
}
```

Now our code is very neat and can be maintained easily.

## Grouped Routes

As we can use `router.add` method do define a route, we can define one or more routes with common settings such as a prefix or a middleware.

In our previous middleware example, we can see that all routes starts with `/account` and they all have the same middleware, we can group these routes in one method using `router.group` method.

```ts
// src/routes.tsx
import router from "@mongez/react-router";
import AccountDashboardPage from "./pages/DashboardPage";
import EditProfilePage from "./pages/EditProfilePage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import SingleOrderHistoryPage from "./pages/SingleOrderHistoryPage";
import Guardian from "./middleware/Guardian";

router.group({
  path: "/account",
  middleware: [Guardian],
  routes: [
    {
      path: "/", // it can be also path: '', just an empty string
      component: AccountDashboardPage,
    },
    {
      path: "/edit-profile",
      component: EditProfilePage,
    },
    {
      path: "/order-history",
      component: OrderHistoryPage,
    },
    {
      path: "/order-history/:id",
      component: SingleOrderHistoryPage,
    },
  ],
});
```

We can also group routes with certain `layout`, so all pages can have a shared `layout`.

```ts
router.group({
  path: "/account",
  middleware: [Guardian],
  layout: BaseLayout,
  routes: [
    {
      path: "/",
      component: AccountDashboardPage,
    },
    {
      path: "/edit-profile",
      component: EditProfilePage,
    },
    {
      path: "/order-history",
      component: OrderHistoryPage,
    },
    {
      path: "/order-history/:id",
      component: SingleOrderHistoryPage,
    },
  ],
});
```

Our code now is more compact and cleaner, also you can pass an additional middleware to any route object if you want to add more middleware to certain routes.

The prefix in the group method will be glued with all routes in the routes array, so the `AccountDashboardPage` route will be `/account/` but the last `/` will be trimmed by `MRR`.

> You can set the path of the `AccountDashboardPage` to be empty string '' it works as well.

## Lazy loading Apps

One of the most powered features in this tool si to lazy load your app especially if you've multiple apps in one project, so let's see how this can be done.

For example, none of the `admin` files will be loaded unless the user navigates to the `/admin` route in the browser, as well as any module inside the admin such as `administrators` module.

## Creating Apps

Any react project, can contain one or more apps in one project, for example a `front-office` for the main website and `admin` dashboard to manage the website.

So let's create these two apps in our `src/apps` directory so it would be like this:

```bash
|--- src
  |--- apps
     |-- front-office
     |-- admin
  |--- index.ts
```

## App Modules Declaration

Each application must have at least two files to work properly.

1. A `front-office-modules.json` to define the app structure, modules and its internal routes.
2. A `front-office-provider.ts` file as an entry point to the application, as it will be called at the very beginning before calling any internal module inside the app.

> The modules.json file name must be in this sequence `appName-modules.json` as we named our admin modules file.
> The app provider must be named as `appName-provider.ts` or `appName-provider.js` if you're using Javascript.

```bash
|--- src
  |--- apps
     |-- front-office
        |-- front-office-modules.json
        |-- front-office-provider.ts
     |-- admin
  |--- index.ts
```

Now open `front-office-modules.json` file and put the following code inside it.

```json
{
  "name": "front-office",
  "path": "/",
  "modules": [
    {
      "entry": ["/"],
      "name": "home"
    }
  ]
}
```

Let's go in depth with each key in this file.

- `name`: App name, it should be the same as the directory name in `src/apps` otherwise it won't work.
- `path`: App base path, for front-office it will be `/` for something like admin it could be `/admin` or whatever you desire.
- `modules`: Defines list of modules that will be included in this app.
- `modules.entry`: is an array that contains the starting segments to make the module be loaded, we'll get into it next.
- `modules.module`: defines the module name, it must match the module directory name.

## Module Structure

Each app consists of list of modules, each module must have at least a `provider` file inside it.

The `provider.ts|.js` file will be called directly once browser hits the entry path of the module which will be illustrated later, in this file our module settings should be imported inside it such as its routes.

### Module Entry Concept

Let's take an example to make it clear.

Let's say we're working on an online store project, which will contain a customer account dashboard, this dashboard may have the following routes:

- `/account/dashboard`
- `/account/edit-profile`
- `/account/order-history`
- `/account/order-history/:id`

All of the previous routes are part of the `account` module in our project, also they all starts with `/account` segment.

In that case our project structure wil look like this:

```bash

|--- src
  |--- apps
      |-- front-office
        |-- account
          |-- components
            |-- DashboardPage.tsx
            |-- EditProfilePage.tsx
            |-- OrderHistoryList.tsx
            |-- SingleOrderHistory.tsx
        |-- front-office-modules.json
        |-- front-office-provider.ts
      |-- admin
  |--- index.ts
```

In that sense, they all share one module which is `account` and they all start with `/account`, to declare this in our `front-office-modules.json` we will only add the starting segment of all of these routes which is `/account`.

> What happens here is Mongez React Router loads the `account` module when it sees the route starts with `/account`.

```json
{
  "name": "front-office",
  "path": "/",
  "modules": [
    {
      "entry": ["/account"],
      "name": "account"
    },
    {
      "entry": ["/"],
      "name": "home"
    }
  ]
}
```

One more thing to mention is that we can also load the module with different routes such as if `/login` is part of our `account` module, then we can add it in our `entry` section.

```json
{
  "name": "front-office",
  "path": "/",
  "modules": [
    {
      "entry": ["/account", "/login"],
      "name": "account"
    },
    {
      "entry": ["/"],
      "name": "home"
    }
  ]
}
```

> The `entry` key accepts only the first segment of the route, so don't define inside it the entire route.

✅

```json
{
  "name": "front-office",
  "path": "/",
  "modules": [
    {
      "entry": ["/account", "/login"],
      "name": "account"
    },
    {
      "entry": ["/"],
      "name": "home"
    }
  ]
}
```

❌

```json
{
  "name": "front-office",
  "path": "/",
  "modules": [
    {
      "entry": ["/account/dashboard", "/account/edit-profile", "/login"],
      "name": "account"
    },
    {
      "entry": ["/"],
      "name": "home"
    }
  ]
}
```

## Defining apps list

Now let's create a `src/shared/apps-list.ts` file to set our apps list.

> For better organization, we'll create a `shared` directory inside our `src` so we can set our shared configurations between multiple apps.

```bash
|--- src
  |--- apps
     |-- front-office
        |-- front-office-modules.json
        |-- front-office-provider.ts
     |-- admin
  |--- shared
     |-- apps-list.ts
  |--- index.ts
```

```ts
// src/shared/config/router.ts
import { setRouterConfigurations, setApps } from "@mongez/react-router";
import frontOfficeApp from "./../apps/front-office/front-office-modules.json";

setApps([frontOfficeApp]);

setRouterConfigurations({
  //
});
```

Now let's define the lazy loading loader, which will load the app provider and the module provider as well.

```ts
// src/shared/config/router.ts
import { setRouterConfigurations, setApps } from "@mongez/react-router";
import frontOfficeApp from "./../apps/front-office/front-office-modules.json";

setApps([frontOfficeApp]);

setRouterConfigurations({
  lazyLoading: {
    loaders: {
      app: (app: string) => import(`./../apps/${app}/${app}-provider.ts`),
      module: (app: string, module: string) =>
        import(`./../apps/${app}/${module}/provider.ts`),
    },
    }
  }
});
```

Here we told the router where you can load the app once the user hits the app path, and also where to find the module provider once the user hits one of the module entry path.

Now let's head back to our index file and import our `apps-list.ts` file.

```tsx
// src/index.ts
import "./src/shared/config/router";

import router from "@mongez/react-router";

router.scan();
```

From now on, you can lazy load any new app or any new module by creating its directory and its provider.

## Defining Module routes

Now we imported our apps list and everything works fine so far except that no routes will be loaded!

The reason behind this that we didn't declare any routes as we only informed `MRR` to load the module provider, so now we need to define our routes for our module.

In `src/apps/front-office/home` we should have two files: `provider.ts` and `routes.ts`.

```ts
// src/apps/front-office/home/provider.ts
import "./routes";
```

We just imported our `routes.ts` file, now let's add our routes there.

```ts
// src/apps/front-office/home/routes.ts
import router from "@mongez/router";
import HomePage from "./components/HomePage";

router.add("/", HomePage);
```

Now we'are ready to go as we're done with our setup.

## Routes Relativity

All routes defined inside the `routes.ts` files in the lazy load mode, are prefixed with the app path, so if we've a route in the admin such as `/admin/login`, the defined route in `src/apps/admin/administrators/routes.ts` will be `/login` without adding `/admin` at the beginning.

```ts
// src/apps/admin/administrators/routes.ts

import LoginPage from "./components";
import router from "@mongez/react-router";

// here we'll define the route as /login not /admin/login
router.add("/login", LoginPage);
```

This is done by `MRR` automatically as it detects the current app path during adding the route information, so you don't need to worry about it.

### Route Path Structure

Based on the app configurations, we've `7` different route structures.

The full route structure is: `/basePath/appPath/(localeCode?)/routePath`

The following are the possible route structures (after the base path segments).

1. `/`: The app path
2. `/en`: The app path appended with locale code
3. `/en/contact-us`: The contact us `route` prefixed with locale code.
4. `/admin`: Admin app home path.
5. `/en/admin`: Admin app home path with `en` locale code.
6. `/en/admin/customers`: Admin app customers page with `en` locale code.
7. `admin/customers`: Admin app customers page with default locale code.

So our full route structure will be something like:

`{/localeCode?}{/app-path?}/route`

> When you define your route don't add the app path or locale code, for example:

✅
`router.add('/contact-us', ContactUs)`

❌
`router.add('/admin/contact-us', ContactUs)`
`router.add('/en/contact-us', ContactUs)`
`router.add('/en/admin/contact-us', ContactUs)`

## Router Configurations

`MRR` is shipped with a powerful router configuration, you can configure the router to your needs.

Let's head back again to our `src/configs/router.ts` and see the available configurations.

```ts
// src/shared/config/router.ts
import { setRouterConfigurations, setApps } from "@mongez/react-router";
import frontOfficeApp from "./../apps/front-office/front-office-modules.json";

setApps([frontOfficeApp]);

setRouterConfigurations({
  localization: {
    localeCodes: ['en', 'ar'],
    defaultLocaleCode: 'en',
changeLanguageReloadMode: 'soft', // soft reload will re-render the current page, hard reload will reload the whole app
  },
  forceRefresh: true, // will re-render the page if user clicks on the same route link
  strictMode: true, // run React in Strict Mode
  rootComponent: Root, // the root component that will wrap the whole app, can be useful for adding global settings for one time to your UI like wrapping the whole app with a context provider.
  lazyLoading: {
    loadingComponent: Progress, // the component that will be rendered while the lazy loaded component is loading
    loaders: {
      app: (app: string) => import(`./../apps/${app}/${app}-provider.ts`),
      module: (app: string, module: string) =>
        import(`./../apps/${app}/${module}/provider.ts`),
    },
    }
  }
});
```

Here is the full list of available configurations

```ts
/**
 * Object Type
 */
export type ObjectType = Record<string, any>;

/**
 * React Component Type
 */
export type Component = React.FC<any> | React.ComponentType<any>;

/**
 * Url Matcher handler
 */
export type UrlMatcher = (pattern: string) => {
  regexp: RegExp;
  keys: { name: string }[];
};

/**
 * Not found configurations
 */
export type NotFoundConfigurations = {
  /**
   * Mode Type
   * If set to `render`, then the 404 component will be rendered.
   * Which requires you to define the 404 component.
   *
   * If set to `redirect`, then the user will be redirected to the defined path.
   * Which requires you to define the redirect path (/404 by default).
   */
  mode?: "render" | "redirect";
  /**
   * 404 Component
   *
   * @default NotFound
   */
  component?: Component;
  /**
   * 404 Redirect Path
   *
   * @default /404
   */
  path?: string;
};

/**
 * Change languages Mode
 */
export type ChangeLanguageReloadMode = "soft" | "hard";

/**
 * Lazy loading options
 */
export type LazyLoadingOptions = {
  /**
   * Loaders Options
   */
  loaders: Loaders;
  /**
   * Preload Component which will be displayed while the app/module is being loading
   */
  loadingComponent?: Component;
  /**
   * Whether to render only the loader or render the loader over the current page
   *
   * If set to `true` then the loader will be rendered over the current page
   * By rendering the loader before the page component, no styling will
   * be applied to the page, you can use this to show a loading screen in your loader
   */
  renderOverPage?: boolean;
};

/**
 * Localization Options
 */
export type LocalizationOptions = {
  /**
   * Change Language reload mode
   * Used when calling `changeLocaleCode` function
   *
   *  If st to `soft` then it will update the url with the new locale code
   * and re-render the current page.
   *
   * If set to `hard` then it will reload the page with the new locale code.
   * @default soft
   */
  changeLanguageReloadMode?: ChangeLanguageReloadMode;
  /**
   * Default locale code
   *
   * @default en
   */
  defaultLocaleCode?: string;
  /**
   * Project localeCodes
   *
   * @default ["en"]
   */
  localeCodes?: string[];
};

/**
 * Query String Options
 */
export type QueryStringOptions = {
  /**
   * Query String Object to String parser
   */
  objectParser?: (queryString: string) => ObjectType;
  /**
   * Query String Object to String parser
   */
  stringParser?: (queryObject: ObjectType) => string;
};

/**
 * Grouped routes options
 */
export type GroupedRoutesOptions = {
  /**
   * Grouped routes
   */
  routes: Route[];
  /**
   * Prefix path for all routes
   */
  path?: string;
  /**
   * Middleware
   */
  middleware?: Middleware;
  /**
   * Layout
   */
  layout?: Component;
};

/**
 * Link component options
 */
export type LinkOptions = {
  /**
   * Component to be used as a link
   *
   * @default 'a'
   */
  component?: Component | string;
};

/**
 * Router Configurations
 */
export type RouterConfigurations = {
  /**
   * Project Base Path
   * Its recommended to set it with production check like this:
   * process.env.NODE_ENV === "production" ? "/project-name" : "/"
   * @default "/"
   */
  basePath?: string;
  /**
   * Scroll to top when navigating to a new page
   *
   * @default smooth
   */
  scrollToTop?: false | "smooth" | "default";
  /**
   * Localization settings
   */
  localization?: LocalizationOptions;
  /**
   * Enable force refresh,
   * If set to true, when the user navigates to the same page,
   * it will re-render the page again.
   *
   *  @default true
   */
  forceRefresh?: boolean;
  /**
   * Url Matcher
   * This can be used to allow more dynamic url matching.
   */
  urlMatcher?: UrlMatcher;
  /**
   * Query string options
   */
  queryString?: QueryStringOptions;
  /**
   * Whether to enable strict mode
   *
   * @default false
   */
  strictMode?: boolean;
  /**
   * Root component that will be used to wrap all the pages
   * This component will be rendered only once.
   */
  rootComponent?: Component;
  /**
   * Suspense fallback
   *
   * @default <></>
   */
  suspenseFallback?: React.ReactNode;
  /**
   * App And Module Loading Options
   */
  lazyLoading?: LazyLoadingOptions;
  /**
   * Not Found Page Settings
   */
  notFound?: NotFoundConfigurations;
  /**
   * Link component options
   */
  link?: LinkOptions;
};
```

Let's see these configurations in details

<!-- Table to illustrate router configurations -->

| Configuration                           | Description                                                                                                                                                                                                                                                                                                | Default                         | Type                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------- | ----------- |
| `basePath`                              | The base path of the project, it's recommended to set it with production check like this: `process.env.NODE_ENV === "production" ? "/project-name" : "/"`                                                                                                                                                  | `/`                             | `string`                              |
| `scrollToTop`                           | Whether to scroll to top of the page when navigating to a new page                                                                                                                                                                                                                                         | `smooth`                        | `false` \| `"smooth"`                 | `"default"` |
| `localization.localeCodes`              | An array contains list of locale codes that will be used in the project                                                                                                                                                                                                                                    | `["en"]`                        | `string[]`                            |
| `localization.defaultLocaleCode`        | The default locale code that will be used in the project                                                                                                                                                                                                                                                   | `en`                            | `string`                              |
| `localization.changeLanguageReloadMode` | The mode that will be used when changing the language, if set to `soft` then it will update the url with the new locale code and re-render the current page, if set to `hard` then it will reload the page with the new locale code                                                                        | `soft`                          | `soft`, `hard`                        |
| `forceRefresh`                          | Whether to force refresh the page when the user navigates to the same page                                                                                                                                                                                                                                 | `true`                          | `boolean`                             |
| `urlMatcher`                            | This can be used to allow more dynamic url matching, for example using, Most of the packages for parsing route patterns work with regular expressions (see [path-to-regexp](https://github.com/pillarjs/path-to-regexp) or a super-tiny alternative [regexparam](https://github.com/lukeed/regexparam)).   |
| `undefined`                             | `(pattern: string) => { regexp: RegExp; keys: { name: string }[]; }`                                                                                                                                                                                                                                       |
| `queryString.objectParser`              | Query String Object to String parser                                                                                                                                                                                                                                                                       | `undefined`                     | `(queryString: string) => ObjectType` |
| `queryString.stringParser`              | Query String Object to String parser                                                                                                                                                                                                                                                                       | `undefined`                     | `(queryObject: ObjectType) => string` |
| `strictMode`                            | If set to true, the entire application will be wrapped in `<React.StrictMode>`                                                                                                                                                                                                                             | `true`                          | `boolean`                             |
| `rootComponent`                         | Root component that will be used to wrap all the pages, this component will be rendered only once                                                                                                                                                                                                          | `undefined`                     | `Component`                           |
| `lazyLoading.loaders`                   | Loaders options for app and module,**this is required** if you're going to use the lazy apps.                                                                                                                                                                                                              | `undefined`                     | `Loaders`                             |
| `lazyLoading.loadingComponent`          | Preload Component which will be displayed while the app/module is being loading                                                                                                                                                                                                                            | `InternalPreloaderComponent`    | `Component`                           |
| `lazyLoading.renderOverPage`            | Whether to render only the loader or render the loader over the current page, if set to `true` then the loader will be rendered over the current page, by rendering the loader before the page component, no styling will be applied to the page, you can use this to show a loading screen in your loader | `false`                         | `boolean`                             |
| `suspenseFallback`                      | Define suspense fallback when using `React.lazy`, that will be used as a fallback to [Suspense Component](https://reactjs.org/docs/code-splitting.html#reactlazy)                                                                                                                                          | `<></>`                         | `React.ReactNode`                     |
| `notFound.component`                    | Component to be rendered when the page is not found                                                                                                                                                                                                                                                        | `InternalNotFoundPageComponent` | `Component`                           |
| `notFound.redirectTo`                   | Redirect to a specific page when the page is not found                                                                                                                                                                                                                                                     | `/404`                          | `string`                              |
| `link.component`                        | Component to be used as a link                                                                                                                                                                                                                                                                             | `a`                             | `Component`                           |
| `autoRedirectToLocaleCode`              | Whether to redirect the user to the default locale code if the current locale code is not found in the project                                                                                                                                                                                             | `auto`                          | `boolean`                             |

> If you're using [Mongez React](https://github.com/hassanzohdy/react), it can be part of the entire application configurations.

## Not Found Pages

You can decide what happens if a route is not found, you can either redirect the user to a specific page or render a custom component.

If you're lazy enough to not make a not found page, you can use [NotFound Component](https://github.com/hassanzohdy/react-components#not-found-component) directly, it does not have any dependencies.

It looks like this:

![Not Found Page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5llfh3np2th1xu4oowj2.png)

A quick example of usage:

```tsx
import { NotFound } from '@mongez/react-components';
import { setRouterConfigurations } from '@mongez/react-router';

setRouterConfigurations({
  notFound: {
    mode 'render',
    component: NotFound,
  }
});
```

## Preload Component

You can use the preload component to show a loading screen while the app/module is being loaded.

You may use [Progress Bar Component](https://github.com/hassanzohdy/react-components#progress-bar)

![Progress Preview](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/99kzuedy4fiezrxgcst4.gif)

```tsx
import { ProgressBar } from "@mongez/react-components";
import { setRouterConfigurations } from "@mongez/react-router";

setRouterConfigurations({
  lazyLoading: {
    loadingComponent: ProgressBar,
  },
});
```

## Root Component

The root component will wrap the entire application regardless wether current route is being lazy loaded or not.

It can be defined in the [router configurations](#router-configurations).

This component will be only rendered once during the application bootstrap.

> Root Component does not receive any props at all.

## Strict Mode

By default, [React Strict Mode](https://react.dev/reference/react/StrictMode) is enabled, you can disable it by setting `strictMode` to `false` in the [router configurations](#router-configurations).

```tsx
import { setRouterConfigurations } from "@mongez/react-router";

setRouterConfigurations({
  strictMode: false,
});
```

## Force Refresh

Force refresh means that if user is on the home page and clicked on the home route again, if `forceRefresh` is enabled then the page will be re-rendered again otherwise it will not.

```tsx
import { setRouterConfigurations } from "@mongez/react-router";

setRouterConfigurations({
  forceRefresh: true, // default is: true
});
```

## Localization

**MRR** needs to know what locale-codes that are allowed in the application so it does not treat it as a route, for example if the project supports `en` and `ar` locale codes, then the router will not treat `/en` and `/ar` as routes.

```tsx
import { setRouterConfigurations } from "@mongez/react-router";

setRouterConfigurations({
  localization: {
    localeCodes: ["en", "ar"],
    defaultLocaleCode: "en",
  },
});
```

## Switch Language Mode

There are two ways to switch the language, either by reloading the page or re-rendering the current page, the first one is called `hard` reload and the second one is called `soft` reload.

By default `MRR` uses the `hard` reload mode, this would be better for SEO as it will reload the page with the new locale code and also for applying styling without feeling any flickering because the entire application will be fully re-rendered.

You can of course override this behavior by setting `changeLanguageReloadMode` in the [router configurations](#router-configurations).

```tsx
import { setRouterConfigurations } from "@mongez/react-router";

setRouterConfigurations({
  localization: {
    changeLanguageReloadMode: "soft", // default is: hard
  },
});
```

## Lazy Loading Components Loader

> Added in V2.1.0

If you're using [React Lazy](https://reactjs.org/docs/code-splitting.html#reactlazy) to lazy load your components, you can use `suspenseFallback` to define a fallback component to be rendered while the component is being loaded.

```tsx
import { setRouterConfigurations } from "@mongez/react-router";

setRouterConfigurations({
  suspenseFallback: <div>Loading...</div>,
});
```

> If the config is not set and there is a `loadingComponent` defined, it will be used instead.

## Link Navigation

Using `Link` component in react will provide some interesting features to make the link more readable and easier to use.

```tsx
// src/apps/front-office/home/components/HomePage.tsx
import React from "react";
import { Link } from "@mongez/react";

export default function HomePage() {
  return (
    <div>
      <Link to="/account">Go To Account Page</Link>
    </div>
  );
}
```

Simply put, a simple navigation to route by using `to` or `href` prop.

To navigate to route in a `new tab`

```tsx
<Link to="/account" newTab>
  Go To Account Page In New Tab
</Link>
```

To navigate to route in `another app`

```tsx
<Link to="/customers/100" app="admin">
  Go To Customer page in admin app.
</Link>
// outputs: /admin/customers/100
```

> The app prop accepts the app name not the app path

To navigate to route with another `locale code`

```tsx
<Link to="/account" localeCode="ar">
  Go To Account Page With Arabic Locale Code
</Link>
// outputs: /ar/account
```

Navigate to another app with a locale code

```tsx
<Link to="/account" app="admin" localeCode="ar">
  Go To Account Page In Admin App With Arabic Locale Code
</Link>
// outputs: /ar/admin/account
```

To navigate to a url, just set the url :p.

```tsx
<Link to="https://google.com">Go To Google</Link>
```

Make the link as email

```tsx
<Link email="hassanzohdy@gmail.com">Email As Link</Link>
// outputs: <a href="mailto:hassanzohdy@gmail.com" .. />
```

Make the link as a telephone number

```tsx
<Link tel="+201002221122">Phone Number As Link</Link>
// outputs: <a href="tel:+201002221122" .. />
```

You can also set the component to be used as a link

```tsx
<Link to="/account" component={MyCustomLinkComponent}>
  Go To Account Page
</Link>
// outputs: <MyCustomLinkComponent to="/account" .. />
```

Passing `onClick` prop can be done as well.

```tsx
<Link to="/account" onClick={handleClick}>
  Go To Account Page
</Link>
```

## Changing Locale Code to another locale code

We can switch to another locale code by using `changeLocaleCode` function

```tsx
import { changeLocaleCode } from '@mongez/react-router';

import React from 'react'

export default function Header() {
  const onClick = e => {
    changeLocaleCode('ar'); // refreshes the page and changes the locale code
  };

  return (
    <div>
      <button onClick={changeLocaleCode}>Switch To Arabic<button>
    </div>
  )
}
```

This will update the `localeCode` in the URL and refresh the page.

Based on the current router configurations, it will be determined whether to make a `soft` reload or a `hard` reload.

If it is a `soft` reload, it will only rerender the current page, otherwise, it will refresh the page.

```tsx
import { changeLocaleCode } from '@mongez/react-router';

import React from 'react'

export default function Header() {
  const onClick = e => {
    changeLocaleCode('ar', 'soft'); // refreshes the page and changes the locale code without reloading the page
    changeLocaleCode('ar', 'hard'); // Reload the page
  };

  return (
    <div>
      <button onClick={changeLocaleCode}>Switch To Arabic<button>
    </div>
  )
}
```

Also you may set the default it in the router configurations by `switchLanguageReloadMode`

## Navigating to route

The `navigateTo` function is one of the most powered functions that allows you to navigate to another page.

```tsx
import { navigateTo } from "@mongez/react-router";

import React from "react";

export default function CreateAccountPage() {
  const createAccount = (e) => {
    axios.post("/register", { email, password }).then((response) => {
      navigateTo("/home");
    });
  };

  return (
    <div>
      <form onSubmit={createAccount}>
        ...
        <button>Create a new account</button>
      </form>
    </div>
  );
}
```

Navigate to with locale code

```ts
navigateTo("/login", "en"); // /en/login
```

Navigate to route with locale code and app.

```ts
navigateTo("/login", "en", "admin"); // /admin/en/login
```

> Please note that the third argument accepts the app name not the app path, if you'd like to use the app path, just add it to the first argument.
> If the project has multiple locale codes, then any navigation using `navigateTo` function will prepend the locale code, for example `navigateTo('/login')` and default locale code is `en`, this will navigate to `/en/login`

## Navigate Back

```tsx
import { navigateBack } from "@mongez/react-router";

import React from "react";

export default function LoginPage() {
  const login = (e) => {
    axios.post("/login", { email, password }).then((response) => {
      navigateBack();
    });
  };

  return (
    <div>
      <form onSubmit={login}>
        ...
        <button>Login</button>
      </form>
    </div>
  );
}
```

Usually used with the login page as we can return the user back once he/she logged in successfully.

## Page Refresh

We can refresh the page so it will re-render again using `refresh` function, this won't cause full page reload but it will acts as a route navigation.

```tsx
import { refresh } from '@mongez/react-router';

import React from 'react'

export default function Header() {
  const refreshPage = () => {
    refresh();
  }

  return (
    <div>
      <button onClick={refreshPage}>Refresh The Page<button>
    </div>
  )
}
```

## Get current page route

To get current page route, we can use `currentRoute` function.

```tsx
// src/apps/front-office/front-office-provider.ts
import { currentRoute } from "@mongez/react-router";

// detect current route
console.log(currentRoute()); // will be something like /login or /account
```

> Please note that currentRoute function does not return the locale code nor the app path, only the route path.

## Managing Query String

Another important feature that must be mentioned here is the `queryString` feature, it allows you to manage the query string in the URL.

### Get Query String As Object

We can use `queryString` object to access all query string methods, to get the entire query string as an object, use `queryString.all()`.

```tsx
import { queryString } from "@mongez/react-router";

// get query string as object

// sitename.com?name=John&age=30&id[]=1&id[]=2
const queryStringParams = queryString.all(); // {name: 'John', age: 30, id: [1, 2]}
```

It will automatically convert the query string to an object, if the query string has an array, it will be converted to an array.

Also any numbers will be converted to numbers.

## Get a single value from query string

To get a single value from the query string, use `queryString.get('key', defaultValue: any)`

```tsx
import { queryString } from "@mongez/react-router";

// get a param from query string
const name = queryString.get("name"); // John

// if not found return default value
const id = queryString.get("id", "12"); // 12
```

### Get Query String as string

To get the entire query string as a string, use `queryString.toString()`

```tsx
import { queryString } from "@mongez/react-router";

// get query string as string
const queryString = queryString.toString(); // name=John&age=30&id[]=1&id[]=2
```

### Update query string

We can also update query string in the url with/without navigating to the route with the new query string by using `update` function, this can be useful for cases such as filtering as we can only update the route without a full new re-render to the page.

```tsx
import { queryString } from "@mongez/react-router";

export default function FilterData() {
  const filter = (e) => {
    // Just dummy data for demo only
    const filterData = {
      name: "",
      email: "",
      age: 0,
      published: true,
    };

    axios.get("/filter", filterData).then((response) => {
      queryString.update(filterData);
    });
  };

  return (
    <div>
      <form onSubmit={filter}>
        ...
        <button>Filter</button>
      </form>
    </div>
  );
}
```

The `update` method accept either an object or a string, if it's an object, it will be converted to a query string and replace the current query string, if it's a string, it will be used to replace to the current query string.

If you want to update the query string and re-render the page, pass `true` as the second argument.

```tsx
queryString.update(filterData, true);
```

## Updating route without navigation (Silent Navigation)

Sometimes you might need to update the route but without navigating to it, this can be done using `silentNavigation` helper function.

```tsx
import { silentNavigation } from "@mongez/react-router";

setTimeout(() => {
  silentNavigation("/home"); // update the route but do not navigate to it
}, 3000);
```

You can also pass the second argument if you want to update the query string as well.

```tsx
import { silentNavigation } from "@mongez/react-router";

setTimeout(() => {
  silentNavigation("/home", { name: "John" }); // update the route but do not navigate to it // /home?name=John
}, 3000);
```

Query string can also be set as string.

```tsx
import { silentNavigation } from "@mongez/react-router";

setTimeout(() => {
  silentNavigation("/home", "name=John"); // update the route but do not navigate to it // /home?name=John
}, 3000);
```

## Get current hash value in url

If the url has a `#hash` value we can get it using `hash` helper function.

```ts
import { getHash } from "@mongez/react-router";

// if the url is something like https://site-name.com/online-store/products/10#comments

console.log(getHash()); // comments
```

## Get Previous Route

To get previous route use `previousRoute` function.

```ts
import { previousRoute, navigateTo } from "@mongez/react-router";
navigateTo("/login");
console.log(previousRoute()); // /
navigateTo("/");
console.log(previousRoute()); // /login
```

## Router Events

You may listen to any router change based on the navigation link change.

```ts
import { routerEvents } from "@mongez/react-router";
```

There are mainly `6` events that can be listened to.

- `onNavigating(callback: (route: string, navigationMode: NavigationMode, previousRoute: string) => void) => EventSubscription`: This event will be fired just before finding the proper route handler for current route, it receives the current route, navigation type and previous route.
- `onDetectingInitialLocaleCode(callback: (localeCode: string) => void) => EventSubscription`: This event will be fired just before detecting the initial locale code, it receives the detected locale code, this will be triggered only once and only if the url has a locale code.
- `onLocaleChanging(callback: (newLocaleCode: string, oldLocaleCode: string)) => EventSubscription`: This event will be fired just before changing the locale code, it receives the current locale and the new locale.
- `onLocaleChanged(callback: (newLocaleCode: string, oldLocaleCode: string)) => EventSubscription`: This event will be fired just after changing the locale code, it receives the current locale and the new locale, this event is triggered only if the change mode is `soft`.
  `onRendering(callback: (route: string, navigationMode: NavigationMode) => void): EventSubscription`
  `onPageRendered: (callback: (route: string, navigationMode: NavigationMode) => void) => EventSubscription`: This event will be fired just after rendering the page, it receives the current route and the navigation mode.

The navigation type determine how is the current route being rendered, it can be one of the following:

- `navigation`: when the user clicks on a link or uses the `navigateTo` function, and normal navigation from url.
- `changeLocaleCode`: when the user changes the locale code using `changeLocaleCode` function.
- `swinging`: when the user uses the back/forward buttons in the browser.
- `refresh`: when calling the `refresh` function.

```ts
import { routerEvents } from "@mongez/react-router";

const subscription = routerEvents.onNavigating(
  (route, navigationMode, previousRoute) => {
    console.log(route, navigationMode, previousRoute);
  }
);
```

Any event returns [Event Subscription](https://github.com/hassanzohdy/mongez-events#unsubscribe-to-event) which can be used to unsubscribe from the event.

```ts
// any time later
subscription.unsubscribe();
```

This will stop listening to the event.

## Auto Redirect To Locale Code

> Added in V2.2.0

For better SEO, if your website has multiple locale codes, it's recommended to redirect the user to the default locale code if the current locale code is not found in the project.

The default value of the configuration is `auto`, if there are multiple locale codes defined in the configurations it will be set to `true` otherwise it will be set to `false`.

```ts
import { setRouterConfigurations } from "@mongez/react-router";

setRouterConfigurations({
  autoRedirectToLocaleCode: true,
});
// this wil always redirect the user to the default locale code if the current locale code is not found in the project.
```

If set to false, it will not redirect the user to the default locale code.

```ts
import { setRouterConfigurations } from "@mongez/react-router";

setRouterConfigurations({
  autoRedirectToLocaleCode: false,
});
```

It will be set to true if there are two or more locale codes defined in the `localization` configurations.

```ts
import { setRouterConfigurations } from "@mongez/react-router";

setRouterConfigurations({
  localization: {
    localeCodes: ["en", "ar"],
  },
});
```

In this case it will be set to `true`.

## Hydration

Starting from Version `2.3.0` MRR will check if the root element has any children, if it has, it will hydrate the application instead of creating a new root tree.

## Change Log

- 2.3.0 (02 Nov 2023)
  - Added hydration feature.
- 2.2.0 (15 Sept 2023)
  - Added `autoRedirectToLocaleCode` configuration.
- 2.1.16 (24 Dec 2022)
  - Fixed when app name is different than app path returning not found.
- 2.1.15 (20 Dec 2022)
  - Revoked `UnstyledLink` component.
- 2.1.14 (19 Dec 2022)
  - Exposed `suspenseFallback` configuration.
  - Now `Link` component has a reset style (removed text decoration and color is inherit).
  - Added `UnstyledLink` if you want to use a link with default style.
- 2.1.0 (14 Nov 2022)
  - Added `lazyLoadingComponent` feature.
- 2.0.31 (12 Nov 2022)
  - Fixed `queryString.all` function to return an empty object if the query string is empty.
- 2.0.30 (12 Nov 2022)
  - Fixed cached path on Link component when changing locale code.
- 2.0.29 (12 Nov 2022)
  - Fixed when clicking ctrl/shift/alt/meta keys, work in default behavior.
- 2.0.25 (09 Nov 2022)
  - Added Added scroll to top feature.
- 2.0.23 (09 Nov 2022)
  - Added `onDetectingInitialLocaleCode` event.
- 2.0.0 (07 Nov 2022)
  - Released Version 2.
