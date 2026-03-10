export function KingsRetentionLogo({ size = "md", showText = true }: { size?: "sm" | "md" | "lg"; showText?: boolean }) {
  const sizeMap = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  const textSizeMap = { sm: "text-base", md: "text-lg", lg: "text-2xl" };

  return (
    <div className="flex items-center gap-3">
      <img src="/kingsretention-logo.svg" alt="KingsRetention" className={`${sizeMap[size]} rounded-xl`} />
      {showText && (
        <span className={`font-display font-bold ${textSizeMap[size]} tracking-tight`}>
          <span className="text-foreground">Kings</span>
          <span className="text-accent">Retention</span>
        </span>
      )}
    </div>
  );
}
