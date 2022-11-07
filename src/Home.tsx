import Link from "./router/components/Link/Link";
export default function Home(props: any) {
  return (
    <>
      <h1>Home</h1>
      <Link to="/users">Users</Link>
    </>
  );
}
