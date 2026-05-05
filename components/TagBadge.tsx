export default function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center bg-win-silver-light px-1.5 py-0.5 text-[10px] font-bold text-black">
      #{tag}
    </span>
  );
}
