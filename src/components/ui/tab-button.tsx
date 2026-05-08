import { cx } from "./class-name";

type TabButtonProps = {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
};

export function TabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "h-9 rounded-full px-4 text-sm font-medium transition",
        active ? "bg-[#184e77] text-white shadow-sm" : "bg-[#eef2f6] text-[#526174]",
      )}
    >
      {children}
    </button>
  );
}
