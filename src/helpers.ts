import { trim, rtrim } from "@mongez/reinforcements";
import { getRouterConfig } from "./configurations";

/**
 * Return dynamic segment path generator
 *
 * @param  {string} paramName
 * @returns {string}
 */
export function dynamicSegment(paramName: string = "dynamic"): string {
  return `:${paramName}(.+)`;
}

/**
 * Accept only integer route segment
 *
 * @param  {string} segmentName
 * @returns {string}
 */
export function integerSegment(segmentName: string): string {
  return `:${segmentName}(\d+)`;
}

/**
 * Accept only float route segment
 *
 * @param  {string} segmentName
 * @returns {string}
 */
export function floatSegment(segmentName: string): string {
  return `:${segmentName}(\d+)(.\d+)?`;
}

/**
 * Get current base path
 *
 * @return  {string}
 */
export function basePath(): string {
  return getRouterConfig("basePath", "/");
}

/**
 * Alias to basePath
 */
export function baseName(): string {
  return basePath();
}

/**
 * Get base url of current project
 *
 * @return  {string}
 */
export function baseUrl(): string {
  return rtrim(window.location.origin + basePath(), "/");
}

/**
 * Concatenate the given paths to one single path
 *
 * @param   {...string} segments
 * @returns {string}
 */
export function concatRoute(...segments: string[]) {
  let path: string = segments
    .filter((value) => value && String(value).length > 0)
    .map((segment) => "/" + trim(String(segment), "/"))
    .join("");

  return "/" + trim(path.replace(/(\/)+/g, "/"), "/");
}

/**
 * Get current locale codes
 *
 * @return {string[]}
 */
export function getLocaleCodes(): string[] {
  return getRouterConfig("localeCodes", []);
}

/**
 * Get current direction
 *
 * @returns {string}
 */
export function currentDirection(): string {
  return document.documentElement.dir || "ltr";
}

/**
 * Determine if current direction is matching the given direction
 *
 * @param   {string} direction
 * @returns {boolean}
 */
export function directionIs(direction: "ltr" | "rtl"): boolean {
  return currentDirection() === direction;
}
