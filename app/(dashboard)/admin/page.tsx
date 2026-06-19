"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import type { Rol } from "@prisma/client";

interface Usuario {
  id: string;
  email: string;
  name: string | null;
  rol: Rol;
  activo: boolean;
}

async function fetchUsuarios(): Promise<Usuario[]> {
  const res = await fetch("/api/admin/usuarios");
  if (!res.ok) throw new Error("Error al cargar usuarios");
  return res.json();
}

async function actualizarRol(id: string, rol: Rol) {
  const res = await fetch(`/api/admin/usuarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rol }),
  });
  if (!res.ok) throw new Error("Error al actualizar rol");
  return res.json();
}

async function probarCron() {
  const res = await fetch("/api/admin/test-cron", { method: "POST" });
  return res.json();
}

const ROLES: Rol[] = ["ADMIN", "OPERADOR", "ALTA_DIRECCION"];

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { data: usuarios = [], isLoading } = useQuery({ queryKey: ["usuarios"], queryFn: fetchUsuarios });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, rol }: { id: string; rol: Rol }) => actualizarRol(id, rol),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  });

  const cronMutation = useMutation({ mutationFn: probarCron });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administración</h1>
        <p className="text-sm text-muted-foreground mt-1">Configuración y gestión del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuarios del sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Correo</th>
                  <th className="text-left py-2 font-medium">Nombre</th>
                  <th className="text-left py-2 font-medium">Rol</th>
                  <th className="text-left py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-3">{u.email}</td>
                    <td className="py-3 text-muted-foreground">{u.name ?? "—"}</td>
                    <td className="py-3">
                      <Select
                        value={u.rol}
                        onChange={(e) => actualizarMutation.mutate({ id: u.id, rol: e.target.value as Rol })}
                        className="w-40 h-7 text-xs"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </Select>
                    </td>
                    <td className="py-3">
                      <Badge variant={u.activo ? "success" : "secondary"}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado del sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => cronMutation.mutate()}
              disabled={cronMutation.isPending}
            >
              {cronMutation.isPending ? "Ejecutando..." : "Probar motor de alertas"}
            </Button>
            {cronMutation.data && (
              <span className="text-sm text-muted-foreground">
                Alertas: {cronMutation.data.alertasEnviadas ?? 0} · Incumplimientos: {cronMutation.data.incumplimientosDetectados ?? 0}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            El cron job se ejecuta automáticamente a las 6:00 AM según la configuración de servidor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
