import { isNumeric } from "./helpers";
import { ObjectType } from "./types";

export function toObjectParser(query: string) {
  const vars = query.split("&");

  const result: ObjectType = {};

  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split("=");

    let isArrayKey = pair[0].includes("[]");

    // check also if it is an array, then push to array
    // also check if the key has [], remove it
    const key = pair[0].replace("[]", "");
    let value: string | number = pair[1];

    if (isNumeric(value)) {
      value = Number(value);
    } else if (typeof value === "string") {
      value = decodeURIComponent(value);
    }

    if (result[key]) {
      if (Array.isArray(result[key])) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      if (isArrayKey) {
        result[key] = [value];
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

export function toStringParser(params: ObjectType) {
  const newParams = { ...params };
  const queryString = Object.keys(newParams)
    .map((key) => {
      const value = newParams[key];

      if (Array.isArray(value)) {
        return value.map((v) => `${key}[]=${v}`).join("&");
      } else {
        return `${key}=${value}`;
      }
    })
    .join("&");

  return queryString;
}
