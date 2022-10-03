import { MiddlewareProps } from "./../../types";

export default function Middleware(props: MiddlewareProps) {
  let { route, history, match } = props;

  let { params } = match || {};

  return <route.component params={params} history={history} />;
}
