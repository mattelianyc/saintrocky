import Image from "next/image";
import Link from "next/link";
import { Card } from "@saintrocky/ui";

export default function NotFound() {
  return (
    <main className="sr-NotFoundShell">
      <Card className="sr-NotFoundCard">
        <Image
          src="/images/travolta.gif"
          alt="Confused Travolta looking around a 404 page"
          width={335}
          height={302}
          priority
          unoptimized
        />
        <div className="sr-NotFoundCopy">
          <p className="sr-Eyebrow">404</p>
          <h1>Page not found.</h1>
          <p>
            Travolta checked every route segment. This one does not exist.
          </p>
        </div>
        <Link href="/" className="sr-NotFoundLink">
          Go back home
        </Link>
      </Card>
    </main>
  );
}
