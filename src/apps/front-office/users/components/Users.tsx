import { useEffect, useState } from "react";
import Link from "../../../../router/components/Link/Link";
import Preloader from "../../../../router/components/Preloader/Preloader";
import router from "../../../../router/router";
import { changeLocaleCode } from "../../../../router/utilities";

export default function Users() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return <Preloader loading />;
  }

  return (
    <div>
      <h1>Users Page</h1>
      <Link to="/">Home</Link>
      <Link to="/users/12/hasan">Single User</Link>
      <br />
      <Link to="/users">Users</Link>

      <br />
      <Link to="/users">Users</Link>

      <button
        type="button"
        onClick={() =>
          changeLocaleCode(router.getCurrentLocaleCode() === "en" ? "ar" : "en")
        }
      >
        Switch Language
      </button>
    </div>
  );
}
