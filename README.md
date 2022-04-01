# Mongez React Router (MRR)

A powerful react router system.

> This package for its current version relies on [React Router DOM](https://v5.reactrouter.com/web/guides/quick-start) and it is part of its dependencies so you don't need to install React Router DOM.

## Why

The main reason for using this package instead of using `React Router DOM` directly is that React Router DOM manages routes in a component syntax, which is really...sucks.

So the main purpose is to make routing is more readable, reusable from everywhere with more features.

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
- ❌ No ugly writing for routes in components.

## Before going on

This documentation will illustrate the package features, however, it is recommended to use it with [Mongez React](https://github.com/hassanzohdy/react) for better project organization.

Route structure is the one used in [React Router DOM](https://v5.reactrouter.com/web/api/Route/path-string-string).

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
import HomePage from "./Home";

router.add("/", HomePage);

// Start scanning for all of registered routes
router.scan();
```

We imported our `HomePage` component which is a normal react component, then we used the `router.add` method to define our first route which defines our home page route.

Next we called `router.scan()` to start scanning all registered routes in the router to call the proper route.

> Please keep in mind to set `router.scan` after declaring all of your routes first.

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

## Apps Path Alias

To make lazy loading apps work, we need to define an absolute path for our apps, using [tsconfig.json](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping) file or by using [link-module-alias](https://www.npmjs.com/package/link-module-alias) which is more recommended.

If you're using `link-module-alias` then open `package.json` file and add to it the following code:

```json
"scripts": {
  "postinstall": "link-module-alias"
},
"_moduleAliases": {
  "apps": "src/apps"
}
```

Then run `yarn postinstall` or `npm run postinstall`.

> Please keep in mind that when you upgrade any package don't forget to run this command again.
> If you're installing new package this command will run automatically so you won't need to run it.
> If the `apps` is not defined in the path alias the lazy app loading won't work and would trigger an error.

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
      "module": "home"
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
      "module": "account"
    },
    {
      "entry": ["/"],
      "module": "home"
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
      "module": "account"
    },
    {
      "entry": ["/"],
      "module": "home"
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
      "module": "account"
    },
    {
      "entry": ["/"],
      "module": "home"
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
      "module": "account"
    },
    {
      "entry": ["/"],
      "module": "home"
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
// src/shared/apps-list.ts

import { setApps } from "@mongez/react-router";

import frontOfficeApp from "apps/front-office/front-office-modules.json";

setApps([frontOfficeApp]);
```

> We used the `apps/` alias directly as we already using path alias.

Now let's head back to our index file and import our `apps-list.ts` file.

```tsx
// src/index.ts
import "./shared/apps-list";

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

## Route Middleware

Some routes require a step head before navigating to its component. for example the visitor can not access his/her account dashboard unless he/she is logged in, in such a scenario we can use a middleware.

In `src/apps/front-office/account/routes.ts` file we can define our routes as follows:

```ts
// src/apps/front-office/account/routes.ts
import router from "@mongez/react-router";

import AccountDashboardPage from "./components/DashboardPage";
import EditProfilePage from "./components/EditProfilePage";
import OrderHistoryPage from "./components/OrderHistoryPage";
import SingleOrderHistoryPage from "./components/SingleOrderHistoryPage";
import Guardian from "./middleware/Guardian";

router.add("/account", AccountDashboardPage, [Guardian]);
router.add("/account/edit-profile", EditProfilePage), [Guardian];
router.add("/account/order-history", OrderHistoryPage, [Guardian]);
router.add("/account/order-history/:id", SingleOrderHistoryPage, [Guardian]);
```

Here we defined our routes, with a new argument in `router.add` which is an array of middleware that will be declared before navigating to our pages.

Now let's see our new Guardian middleware file.

```tsx
// src/apps/front-office/account/middleware/Guardian.tsx
import user from "somewhere-in-the-app";
import React from "react";
import { Redirect } from "@mongez/react-router";

export default function Guardian() {
  if (user.isNotLoggedIn()) {
    return <Redirect to="/login" />;
  }

  return null;
}
```

Here we defined a component that allows us to check if user is not logged in, then we'll redirect the user to the login route by using `Redirect` component from `MRR`.

Now whenever a user hits any of the account routes, the `Guardian` component will be called first, if the user is not logged in then the redirect component will be called instead of the page component.

If the middleware returned a value, then it will be displayed instead of the page component.

So the middleware can look like:

```tsx
// src/apps/front-office/account/middleware/Guardian.tsx
import user from "somewhere-in-the-app";
import React from "react";

export default function Guardian() {
  if (user.isNotLoggedIn()) {
    return <h1>You do not have access to this page, please login first.</h1>;
  }

  return null;
}
```

## Grouped Routes

As we can use `router.add` method do define a route, we can define one or more routes with common settings such as a prefix or a middleware.

In our previous middleware example, we can see that all routes starts with `/account` and they all have the same middleware, we can group these routes in one method using `router.group` method.

```ts
// src/apps/front-office/account/routes.ts
import router from "@mongez/react-router";

import AccountDashboardPage from "./components/DashboardPage";
import EditProfilePage from "./components/EditProfilePage";
import OrderHistoryPage from "./components/OrderHistoryPage";
import SingleOrderHistoryPage from "./components/SingleOrderHistoryPage";
import Guardian from "./middleware/Guardian";

router.group({
  path: "/account",
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

Our code now is more compact and cleaner, also you can pass an additional middleware to any route object if you want to add more middleware to certain routes.

The prefix in the group method will be glued with all routes in the routes array, so the `AccountDashboardPage` route will be `/account/` but the last `/` will be trimmed by `MRR`.

> You can set the path of the `AccountDashboardPage` to be empty string '' it works as well.

## Page Base Layout

Most of the apps has same layout structure such as a header and a footer among it the content of the page.

This can be done easily with `MRR` by using `router.partOf` method.

```tsx
// src/apps/front-office/components/BaseLayout.tsx

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
// src/apps/front-office/home/routes.ts

import router from "@mongez/router";
import HomePage from "./components/HomePage";
import BaseLayout from "apps/front-office/components/BaseLayout";

router.partOf(BaseLayout, [
  {
    path: "/",
    component: HomePage,
  },
]);
```

Now our `HomePage` component doesn't need to call the header or the footer of the page, it is now part of the `BaseLayout`.

This can be useful with `router.group` as well, we can set a common layout between list of pages.

Let's head back to our account module.

```ts
// src/apps/front-office/account/routes.ts
import router from "@mongez/react-router";

import AccountDashboardPage from "./components/DashboardPage";
import EditProfilePage from "./components/EditProfilePage";
import OrderHistoryPage from "./components/OrderHistoryPage";
import SingleOrderHistoryPage from "./components/SingleOrderHistoryPage";
import Guardian from "./middleware/Guardian";

import BaseLayout from "apps/front-office/components/BaseLayout";

router.group({
  path: "/account",
  layout: BaseLayout,
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

Now we added a new property in the group object called `layout` which defines the layout that will render all of the routes pages.

### Extending Base Layout

Let's take another scenario that the account pages have a common sidebar between all of its page, we can make a newer layout that can hold the header, footer and the account sidebar.

```tsx
// src/apps/front-office/account/components/AccountLayout.tsx
import React from "react";
import Header from "apps/front-office/components/Header";
import Header from "apps/front-office/components/Footer";
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
// src/apps/front-office/account/routes.ts
import router from "@mongez/react-router";

import AccountDashboardPage from "./components/DashboardPage";
import EditProfilePage from "./components/EditProfilePage";
import OrderHistoryPage from "./components/OrderHistoryPage";
import SingleOrderHistoryPage from "./components/SingleOrderHistoryPage";
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
// src/apps/front-office/account/components/AccountLayout.tsx
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

## Routes Relativity

All routes defined inside the `routes.ts` files in the lazy load mode, are prefixed with the app path, so if we've a route in the admin such as `/admin/login`, the defined route in `src/apps/admin/administrators/routes.ts` will be `/login` without adding `/admin` at the beginning.

```ts
// src/apps/admin/administrators/routes.ts

import LoginPage from "./components";
import router from "@mongez/react-router";

// here we'll define the route as /login not /admin/login
router.add("/login", LoginPage);
```

### Route Path Structure

Based on the app configurations, we've X route structures.

1. `/`: The app root
2. `/en`: The app root appended with locale code
3. `/en/contact-us`: The contact us route prefixed with locale code.
4. `/admin`: Admin app home path.
5. `/en/admin`: Admin app home path with `en` locale code.
6. `/en/admin/customers`: Admin app customers page with `en` locale code.
7. `admin/customers`: Admin app customers page with default locale code.

So our full route structure will be something like:

`/localeCode(optional)/app-path/route`

> When you define your route don't add the app path or locale code, for example:

✅
`router.add('/contact-us', ContactUs)`

❌
`router.add('/admin/contact-us', ContactUs)`
`router.add('/en/contact-us', ContactUs)`
`router.add('/en/admin/contact-us', ContactUs)`

## Router Configurations

`MRR` doesn't require any configurations to be set, but its recommended to define some configurations such as the locale code used in the project.

In `src/shared` directory let's create a new file `config.ts`

```ts
// src/shared/config.ts
import { setRouterConfigurations } from "@mongez/react-router";

setRouterConfigurations({
  // if your app is multilingual then define all locale codes in the app
  localeCodes: ["en", "ar"],
  // if the production build will be in a directory and not the root, then define the directory path in basePath
  basePath: "/",
});
```

Now import the file in the index file.

```ts
// src/index.ts

// its important to import the config file before any route functions.
import "./shared/config";
import "./shared/apps-list";
import router from "@mongez/react-router";

router.scan();
```

> If you're using [Mongez React](https://github.com/hassanzohdy/react), it can be part of the entire application configurations.

Here is the full list of available configurations

```ts
/**
 * Router configuration options list
 */
type RouterConfigurations = {
  /**
   * Locale codes list
   */
  localeCodes?: string[];
  /**
   * App base path in production
   *
   * @default: /
   */
  basePath?: string;
  /**
   * Router preloader that will be displayed until the module is loaded
   *
   * @default React.Fragment
   */
  preloader?: React.ReactNode;
  /**
   * Determine whether to re-render the page
   * When navigating to any page, even same current page
   *
   * Please note that can not be changed during the application is running
   * as its value is cached at the application bootstrap
   *
   * @default: true
   */
  forceRefresh?: boolean;
  /**
   * Scroll to top of the page when rendering new page
   *
   * @default true
   */
  scrollTop?: boolean;
  /**
   * NotFound Options
   */
  notFound?: {
    /**
     * Not found mode
     * The redirect mode will redirect the client to the path
     *
     * Please note that can not be changed during the application is running
     * as its value is cached at the application bootstrap
     *
     * @default: render
     */
    mode?: "redirect" | "render";
    /**
     * The route that will be redirected when the page is not found
     * Works only when the mode is set to redirect
     *
     * @default: /404
     */
    route?: string;
    /**
     * The component that will be rendered when the page is not found
     * Works only when the mode is set to render
     *
     * @default: React.Fragment
     */
    component?: React.ReactNode;
  };
};
```

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

To navigate to route in a new tab:

```tsx
<Link to="/account" newTab>
  Go To Account Page In New Tab
</Link>
// outputs: <a href="/account" target="_blank" rel="noopener noreferrer">
```

To navigate to route in another locale code:

To navigate to route in another app:

```tsx
<Link to="/customers/100" app="admin">
  Go To Customer page in admin app.
</Link>

// outputs: /admin/customers/100
```

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

> The app prop accepts the app name not the app path

To navigate to a url, just set the url :p.

```tsx
<Link to="https://google.com">Go To Google</Link>
```

Make the link email:

```tsx
<Link mailTo="hassanzohdy@gmail.com">Email As Link</Link>
// outputs: <a href="mailto:hassanzohdy@gmail.com" .. />
```

Make the link as a telephone number:

```tsx
<Link tel="+201002221122">Phone Number As Link</Link>
// outputs: <a href="tel:+201002221122" .. />
```

Of course you can send any other html props such as `className`, `id` and so on.

## Redirect Component

This component usually used with middleware as mentioned earlier in the [Middleware section](#route-middleware).

```tsx
// src/apps/admin/account/middleware/Guardian.tsx
import user from "somewhere-in-the-app";
import React from "react";
import { Redirect } from "@mongez/react-router";

export default function Guardian() {
  if (user.isNotLoggedIn()) {
    return <Redirect to="/login" localeCode="fr" app="admin" />;
  }

  return null;
}
```

The previous guardian will navigate to `/admin/fr/login` as the `admin` app path is `/admin` and the locale code is appended after it then finally the route itself.

## Routes Structure

There are 4 types of routes, let's take an example of `/login` route for more illustrations.

1. A route in the base app: final route: `/login`, which is constructed as `page-route`.
2. A route in the base app with locale code: final route: `/login`, which is constructed as `/locale-code/page-route`.
3. A route in another app, such as admin: `/admin/login`, which is constructed as `/app-path/page-route`.
4. A route in another app with a locale code, such as admin: `/admin/ar/login`, which is constructed as `/app-path/locale-code/page-route`.

## Receiving router params

Let's take a complex route and see how we can take its values.

Our route path will be: `/admin/en/customers/101` and will be rendered in `CustomerPage` Component.

This route path is defined as `/customers/:id`.

```ts
// src/apps/admin/customers/routes.ts

import router from "@mongez/react-router";
import CustomerPage from "./components/CustomerPage";

router.add("/customers/:id", CustomerPage);
```

Now let's head to our `CustomerPage` component.

```tsx
// src/apps/admin/customers/components/CustomerPage.tsx

import React from "react";

export default function CustomerPage({ params }) {
  const { localeCode, id } = params;
  console.log(localeCode); // en
  console.log(id); // 101

  return <div>// component content</div>;
}
```

The `/admin` segment will be ignored, we can only get `localeCode` which is defined by `MRR` internally and our defined segment `/:id` is transformed into `id` from the params object.

## Route Wild Card

Let's take another scenario where we have dynamic routes such as:

`/categories/electronics/smart-phones/tablets`

The route is defining the category tree, as we will access the tablets category page.

In that sense, the route can be something else like `/categories/electronics/smart-phones` where we'll go to Smart Phones category.

To get the dynamic route we can use wildcards.

```ts
// src/apps/front-office/categories/routes.ts

import router from "@mongez/react-router";
import CategoryPage from "./components/CategoryPage";

router.add("/categories/:slug(.+)", CategoryPage);
```

In our `CategoryPage` component

```tsx
// src/apps/front-office/categories/components/CategoryPage.tsx

import React from "react";

export default function CategoryPage({ params }) {
  const { slug } = params;
  console.log(slug); // /electronics/smart-phones

  return <div>// component content</div>;
}
```

You can also use the `dynamicSegment` helper for more readability.

```ts
// src/apps/front-office/categories/routes.ts

import router, { dynamicSegment } from "@mongez/react-router";
import CategoryPage from "./components/CategoryPage";

router.add("/categories/" + dynamicSegment("slug"), CategoryPage);
```

Will achieve the same result.

### More Restrict Route Segments

Sometimes, segments such as `:id` is usually integers only, so we can define a route that accepts only integer values in the route so we don't have to make another validation step on the given id, we can use `integerSegment` helper.

```ts
// src/apps/admin/customers/routes.ts

import router, { integerSegment } from "@mongez/react-router";
import CustomerPage from "./components/CustomerPage";

router.add("/customers/" + integerSegment("id"), CustomerPage);
```

Now if the user hits `/customers/some-text` he/she will be redirected automatically to not found page, a `/customers/101` route will be valid though.

Another helper function `floatSegment` can be used for float values.

## Switching to another locale code

We can switch to another locale code by using `switchLang` function

```tsx
import { switchLang } from '@mongez/react-router';

import React from 'react'

export default function Header() {
  const onClick = e => {
    switchLang('ar'); // refreshes the page and changes the locale code
  };

  return (
    <div>
      <button onClick={changeLocaleCode}>Switch To Arabic<button>
    </div>
  )
}
```

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

## Get full url of the page

To get full page path, we can use `url` function.

```tsx
// src/apps/front-office/front-office-provider.ts
import { url } from "@mongez/react-router";

// detect current route
console.log(url()); // will be something like https://sitename.com/online-store/account
```

## Route Concatenation

Sometimes you may need to concat multiple routes in one route, for example adding a route from a variable with another variable to generate a brand new route, luckily you can use `concatRoute` helper function to do it for you.

```ts
import { concatRoute } from "@mongez/react-router";

const localeCode = "ar";

const route = "login";

const appPath = "/admin";

const fullRoutePath = concatRoute(appPath, localeCode, route); // /admin/ar/login
```

Each argument can start with/without a trailing slash, also any doubled slashes will be converted into one slash and if there is any ending slashed will be trimmed as well.

```ts
import { concatRoute } from "@mongez/react-router";

const localeCode = "ar";

const route = "//login//";

console.log(localeCode, route); // /ar/login
```

## Updating query string

We can also update query string in the url with/without navigating to the route with the new query string by using `updateQueryString` helper function, this can be useful for cases such as filtering as we can only update the route without a full new re-render to the page.

```tsx
import { updateQueryString } from "@mongez/react-router";

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
      updateQueryString(filterData);
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

If we would like to navigate to the same page with the updated query string, we can set the second argument to true.

```tsx
import { updateQueryString } from "@mongez/react-router";

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
      updateQueryString(filterData, true); // update and navigate
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

## Get current hash value in url

If the url has a `#hash` value we can get it using `hash` helper function.

```ts
import { hash } from "@mongez/react-router";

// if the url is something like https://site-name.com/online-store/products/10#comments

console.log(hash()); // comments
```

To get the value with the hash, pass an argument with true value to the function.

```ts
import { hash } from "@mongez/react-router";

// if the url is something like https://site-name.com/online-store/products/10#comments

console.log(hash(true)); // #comments
```

## Get query string

To get a value from query string, we can use the `queryString` helper function, this function returns three internal methods.

To get a key value from query string, we can use `get` method:

```ts
import { queryString } from "@mongez/react-router";

// if the url is something like https://site-name.com/online-store/products?sortBy=price&categoryId=10

console.log(queryString().get("sortBy")); // price

console.log(queryString().get("categoryId")); // 10
```

Please note that if you're going to get multiple values from query string, initiate the `queryString()` in a variable then use the variable instead.

```ts
import { queryString } from "@mongez/react-router";

// if the url is something like https://site-name.com/online-store/products?sortBy=price&categoryId=10

const params = queryString();

console.log(params.get("sortBy")); // price
console.log(params.get("categoryId")); // 10
```

You can also get a default value if the query param does not exist in the url.

```ts
import { queryString } from "@mongez/react-router";

// if the url is something like https://site-name.com/online-store/products?sortBy=price&categoryId=10

const params = queryString();

console.log(params.get("sortBy")); // price

console.log(params.get("sortDirection", "desc")); // desc
```

To get all query string params in object, we can use the `all` method.

```ts
import { queryString } from "@mongez/react-router";

// if the url is something like https://site-name.com/online-store/products?sortBy=price&categoryId=10

console.log(queryString().all()); // {sortBy: price, categoryId: 10}
```

To get it as a string use `toString` method.

```ts
import { queryString } from "@mongez/react-router";

// if the url is something like https://site-name.com/online-store/products?sortBy=price&categoryId=10

console.log(queryString().toString()); // sortBy=price&categoryId=10
```

> Each time you call `queryString()` it starts collecting values from the query params value, so be aware to not cache its value if the query string params will be changed you need to call the method again.

✅

```ts
// src/front-office/products/components/ProductsListPage.tsx
import { queryString } from "@mongez/react-router";

// if the url is something like https://site-name.com/online-store/products?sortBy=price&categoryId=10

console.log(queryString().toString()); // sortBy=price&categoryId=10
import React from "react";

export default function ProductsListPage() {
  const params = queryString();

  console.log(params.get("sortBy")); // price

  // Or you can cache its value when navigating to the products list each time
  const params = React.useMemo(() => queryString(), []);
  return <div>//</div>;
}
```

❌

```ts
// src/front-office/products/components/ProductsListPage.tsx
import { queryString } from "@mongez/react-router";

// if the url is something like https://site-name.com/online-store/products?sortBy=price&categoryId=10

console.log(queryString().toString()); // sortBy=price&categoryId=10
import React from "react";

const params = queryString();

export default function ProductsListPage() {
  console.log(params.get("sortBy")); // empty string

  return <div>//</div>;
}
```

## Get project base url

To get the base url, import `baseUrl` helper function, this will get the domain path suffixed with `basePath` that is defined in [the router configurations section](#router-configurations).

```ts
import { baseUrl } from "@mongez/react-router";

console.log(baseUrl()); // something like https://sitename.com/online-store where /online-store is the basePath of the project.
```

## Get current page direction

To get current page direction use `currentDirection` helper.

`currentDirection(): string`

```ts
import { currentDirection } from "@mongez/react-router";

console.log(currentDirection()); // ltr for example
```

Please note that this utility depends on `document.documentElement`'s `dir` property, if not set, then `ltr` will be returned as default.

## Direction Is

Check if current direction matches the given direction, using `directionIs` utility.

`directionIs(direction: 'ltr' | 'rtl'): boolean`

```ts
import { directionIs } from "@mongez/react-router";

console.log(directionIs("ltr")); // true
console.log(directionIs("rtl")); // false
```

## Change Log

- 1.0.24 (1 Apr 2022)
  - Updated Package to work with React 18.
- 1.0.22 (4 Mar 2022)
- Added Route name amd route original path.
- 1.0.21 (4 Mar 2022)
  - Forced refresh function when `forceRefresh` configuration is set to false.
- 1.0.20 (4 Mar 2022)
  - Fixed Link Component for Relative, Mail to and tel props.
- 1.0.16 (11 Jan 2022)
  - Added [Get current page direction Utility](#get-current-page-direction)
  - Added [Direction Is Utility](#direction-is)

## TODO

- [] Rebuild routing system with React Router DOM V6.
