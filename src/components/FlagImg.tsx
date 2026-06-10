import { useState } from "react";

interface FlagImgProps {
  iso: string | null | undefined;
  name: string;
  size?: number;
}

function FallbackBadge({ name, size }: { name: string; size: number }): React.ReactElement {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/50 shrink-0 overflow-hidden"
      aria-label={name}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function FlagImg({ iso, name, size = 28 }: FlagImgProps): React.ReactElement {
  const [failed, setFailed] = useState(false);

  if (!iso || failed) return <FallbackBadge name={name} size={size} />;

  return (
    <img
      src={`https://flagcdn.com/w160/${iso}.png`}
      alt={name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="rounded-full object-cover shrink-0"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
