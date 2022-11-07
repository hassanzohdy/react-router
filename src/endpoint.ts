import Endpoint from "./http";

import cache, {
  PlainSessionStorageDriver,
  setCacheConfigurations,
} from "./cache";

setCacheConfigurations({
  driver: new PlainSessionStorageDriver(),
});

const endpoint = new Endpoint({
  baseURL: "https://apps.mentoor.io/happiness/base/api/admin",
  cache: true,
  cacheOptions: {
    driver: cache,
    expiresAfter: 10,
  },
  headers: {
    os: "adui",
  },
  setAuthorizationHeader: () => {
    return `Bearer 6311262d1cf3f211f730a3f2|eKqi5X35BqUzwQjktZg4cIH2Mr5oKMd4Uma5zpmn`;
  },
});

export default endpoint;
