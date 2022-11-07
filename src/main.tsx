import adminApp from "./apps/admin/admin-app.json";
import frontOffice from "./apps/front-office/front-office-app.json";
import "./index.css";
import router from "./router/router";

router.setAppsList([adminApp, frontOffice]);

router.strictMode(false);

router.setLazyLoading({
  loaders: {
    app: (appName: string) =>
      import(`./apps/${appName}/${appName}-provider.ts`),
    module: (appName: string, moduleName: string) =>
      import(`./apps/${appName}/${moduleName}/provider.ts`),
  },
});

router.setLocaleCodes(["en", "ar"]).scan();
