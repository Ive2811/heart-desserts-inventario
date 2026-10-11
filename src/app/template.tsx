// Se vuelve a montar en cada navegación: la página entra con un desvanecimiento suave
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>
}
