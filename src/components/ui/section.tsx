type SectionProps = {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export function Section({ title, right, children }: SectionProps) {
  return (
    <section className="rounded-2xl border border-[#d9dee8] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
