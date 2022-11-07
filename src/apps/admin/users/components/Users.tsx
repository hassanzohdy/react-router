import Link from "../../../../router/components/Link/Link";
import router from "../../../../router/router";

export default function Users() {
  return (
    <div>
      <h1>Users Page</h1>
      <Link to="/">Home</Link>

      <h2>{router.getCurrentApp()?.name} App</h2>
      <Link to="/users" app="/">
        Users In Front Office
      </Link>
      <Link to="/users" app="/admin">
        Users In Admin
      </Link>
    </div>
  );
}
