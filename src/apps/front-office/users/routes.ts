import router from "../../../router/router";
import User from "../../../User";
import BaseLayout from "./BaseLayout";
import Users from "./components/Users";

router.add("/users", Users, [], BaseLayout);
router.add("/users/:id/:name", User, [], BaseLayout);
