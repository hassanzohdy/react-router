import router from "../../../router/router";
import User from "../../../User";
import Users from "./components/Users";

router.add("/users", Users);
router.add("/users/test/ok/:no/:id", User);
