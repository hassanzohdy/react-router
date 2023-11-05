import { isNumeric } from "./helpers";
import { ObjectType } from "./types";

export function toObjectParser(query: string) {
  const vars = query.split("&");
  const result: ObjectType = {};

  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split("=");
    const isArrayKey = pair[0].includes("[]");

    const key = pair[0].replace("[]", "");
    let value: string | number = pair[1];

    if (isNumeric(value)) {
      value = Number(value);
    } else {
      value = decodeURIComponent(value);
    }

    const keys = key.split("[");

    let currentObj = result;
    for (let j = 0; j < keys.length; j++) {
      const currentKey = keys[j].replace("]", "");
      if (j === keys.length - 1) {
        if (isArrayKey) {
          if (!currentObj[currentKey]) {
            currentObj[currentKey] = [];
          }
          currentObj[currentKey].push(value);
        } else {
          currentObj[currentKey] = value;
        }
      } else {
        if (!currentObj[currentKey]) {
          currentObj[currentKey] = {};
        }
        currentObj = currentObj[currentKey];
      }
    }
  }

  return result;
}
export function toStringParser(params: ObjectType, parentKey?: string): string {
  const newParams: ObjectType = { ...params };
  const queryString = Object.keys(newParams)
    .map((key) => {
      const value = newParams[key];
      const updatedKey = parentKey ? `${parentKey}[${key}]` : key;

      if (typeof value === "object" && !Array.isArray(value)) {
        return toStringParser(value, updatedKey);
      } else if (Array.isArray(value)) {
        return value.map((v) => `${updatedKey}[]=${v}`).join("&");
      } else {
        return `${updatedKey}=${value}`;
      }
    })
    .join("&");

  return queryString;
}
