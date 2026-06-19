import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { Rol } from "@prisma/client";
import Link from "next/link";

const navItems: { href: string; label: string; roles: Rol[] }[] = [
  { href: "/", label: "Tablero", roles: ["ADMIN", "OPERADOR", "ALTA_DIRECCION"] },
  { href: "/sujetos", label: "Sujetos Obligados", roles: ["ADMIN", "OPERADOR"] },
  { href: "/alertas", label: "Historial Alertas", roles: ["ADMIN", "OPERADOR"] },
  { href: "/reportes", label: "Reportes", roles: ["ADMIN", "ALTA_DIRECCION"] },
  { href: "/admin", label: "Administración", roles: ["ADMIN"] },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rol = session.user.rol;
  const itemsVisibles = navItems.filter((item) => item.roles.includes(rol));

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <p className="font-bold text-sm text-foreground">Sistema Alertas DJI</p>
          <p className="text-xs text-muted-foreground mt-1">Ley N.° 31227</p>
        </div>
        <nav className="flex-1 p-2">
          {itemsVisibles.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 text-sm rounded-md text-foreground hover:bg-muted mb-1"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground">{session.user.email}</p>
          <p className="text-xs text-muted-foreground">{rol}</p>
          <Link href="/api/auth/signout" className="text-xs text-destructive hover:underline mt-1 block">
            Cerrar sesión
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
