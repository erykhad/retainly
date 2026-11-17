import { resolveListIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function ListIcon({
  icon,
  color,
  className,
  size = 16,
}: {
  icon: string;
  color: string;
  className?: string;
  size?: number;
}) {
  const Icon = resolveListIcon(icon);
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      <Icon size={size} />
    </span>
  );
}
