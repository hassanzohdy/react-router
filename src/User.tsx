import Link from "./router/components/Link/Link";

export default function User({ params }: any) {
  return (
    <div>
      <h1>User Single ({params.id} >> {params.name})</h1>
      <Link to="/">Home 2</Link>
    </div>
  );
}
