export function Vidro({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`superficie rounded-md border border-azul/10 bg-branco transition-colors duration-200 hover:border-azul/40 ${className}`}
    >
      {children}
    </div>
  );
}
