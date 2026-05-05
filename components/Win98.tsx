import type { ComponentType, ReactNode } from "react";
import { Folder, Minus, Square, X } from "lucide-react";

type IconProps = { size?: number; strokeWidth?: number };

/**
 * Win98 타이틀바.
 * 윈도우 컨트롤(_, □, ×) 버튼은 장식용 — 기능 없음.
 */
export function TitleBar({
  title,
  active = true,
  icon: Icon = Folder,
  controls = true,
}: {
  title: string;
  active?: boolean;
  icon?: ComponentType<IconProps>;
  controls?: boolean;
}) {
  return (
    <div
      className={`flex h-7 items-center justify-between px-1 text-white ${
        active ? "bg-win-navy" : "bg-win-silver-dark"
      }`}
    >
      <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold">
        <Icon size={14} strokeWidth={2.5} />
        <span className="truncate">{title}</span>
      </div>
      {controls && (
        <div className="flex shrink-0 gap-0.5">
          {[Minus, Square, X].map((I, i) => (
            <span
              key={i}
              aria-hidden
              className="win-raised flex h-[22px] w-[22px] items-center justify-center bg-win-silver text-black"
            >
              <I size={10} strokeWidth={3} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Win98 윈도우 컨테이너 — 양각 외곽 + 검정 섀도우 + 타이틀바.
 */
export function Window({
  title,
  icon,
  children,
  className = "",
  bodyClassName = "p-2",
}: {
  title: string;
  icon?: ComponentType<IconProps>;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`win-raised win-shadow bg-win-silver ${className}`}>
      <TitleBar title={title} icon={icon} />
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
