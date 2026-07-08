import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <p className="font-display text-6xl font-bold text-foreground">404</p>
      <p className="text-sm text-muted-foreground">That page doesn't exist.</p>
      <Link
        to="/"
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        Back home
      </Link>
    </div>
  );
}
