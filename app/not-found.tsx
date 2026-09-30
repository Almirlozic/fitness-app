import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-space-md px-margin py-space-2xl">
      <h1 className="text-headline-sm uppercase text-primary">Øvelsen findes ikke</h1>
      <p className="text-body-md text-secondary">Den er måske slettet eller omdøbt.</p>
      <Link
        href="/"
        className="flex min-h-12 items-center self-start border border-primary px-space-lg text-label-caps uppercase tracking-widest text-primary"
      >
        [ Tilbage til oversigt ]
      </Link>
    </main>
  );
}
