type Stat = { label: string; value: string; caption: string };

/** Nøgletal som mørkeblå kort – samme stil som makro-kortene på kostsiden */
export function ExerciseStats({ stats }: { stats: Stat[] }) {
  return (
    <section aria-label="Progression i kg" className="grid grid-cols-3 gap-[12px]">
      {stats.map((stat) => (
        <div key={stat.label} className="flex min-h-[86px] flex-col bg-navy px-[10px] pt-[12px] pb-[10px] text-cream">
          <p className="font-serif text-[10px] uppercase">{stat.label}</p>
          <p className="mt-[8px] font-inter text-[18px] leading-[20px] font-bold whitespace-nowrap">{stat.value}</p>
          <p className="mt-[4px] font-inter text-[9px] leading-[11px] text-cream/75 uppercase">{stat.caption}</p>
        </div>
      ))}
    </section>
  );
}
