export function PageHero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="pt-space-lg pb-space-xl md:pt-space-xl">
      <h1 className="text-display-hero-mobile uppercase leading-none tracking-tighter text-primary md:text-display-hero">
        {title}
      </h1>
      <p className="mt-space-md max-w-xs leading-relaxed text-secondary md:max-w-md md:text-base">
        {description}
      </p>
    </section>
  );
}
