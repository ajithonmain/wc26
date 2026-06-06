interface FlagImgProps {
  iso: string | null | undefined;
  name: string;
  size?: number;
}

export default function FlagImg({ iso, name, size = 28 }: FlagImgProps): React.ReactElement {
  if (!iso) {
    return (
      <span
        style={{ width: size, height: size }}
        className="inline-flex items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/50 shrink-0 overflow-hidden"
        aria-label={name}
      >
        ?
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w160/${iso}.png`}
      alt={name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="rounded-full object-cover shrink-0"
      loading="lazy"
    />
  );
}
