export function LedgerFooter({ left, right }: { left: string; right: string }) {
  return (
    <footer className="border-t border-surface-container-high pt-space-md pb-space-lg font-mono text-caption-mono uppercase tracking-widest text-secondary">
      <div className="flex items-center justify-between gap-space-md">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <p className="mt-space-sm normal-case tracking-normal">
        Øvelsesdata fra{" "}
        <a
          href="https://wger.de"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-primary"
        >
          wger.de
        </a>
      </p>
    </footer>
  );
}
