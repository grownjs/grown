import type { RouteMap, RouteInfo, RouteParams, PathParam, NestedRoute } from '@grown/router';
export type { Route } from '@grown/router';

type R1 = NestedRoute<'root', RouteInfo & {
  url: () => string }>;

type R2 = NestedRoute<'page', RouteInfo & {
  url: (params: RouteParams<'/:a+:b'> | PathParam[]) => string }>;

type R3 = NestedRoute<'static', RouteInfo & { url: () => string }>;

type R4 = NestedRoute<'nested.not_found', RouteInfo & {
  url: (params?: RouteParams<'/*match'> | PathParam[]) => string }>;

export type Routes = RouteMap & R1 & R2 & R3 & R4;
