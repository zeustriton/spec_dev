"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface SujetoRow {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  estado: string;
  unidadOrganica: { nombre: string };
  obligaciones: { id: string }[];
}

interface Props {
  puedeEditar: boolean;
  onEditar?: (id: string) => void;
  onVerDetalle?: (id: string) => void;
}

async function fetchSujetos(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/sujetos?${qs}`);
  if (!res.ok) throw new Error("Error al cargar sujetos");
  return res.json() as Promise<{ data: SujetoRow[]; total: number; page: number; limit: number }>;
}

async function desactivarSujeto(id: string) {
  const res = await fetch(`/api/sujetos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al desactivar sujeto");
}

export function SujetosTable({ puedeEditar, onEditar, onVerDetalle }: Props) {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["sujetos", { search, estado, page }],
    queryFn: () =>
      fetchSujetos({
        ...(search ? { search } : {}),
        ...(estado ? { estado } : {}),
        page: String(page),
        limit: "20",
      }),
  });

  const desactivar = useMutation({
    mutationFn: desactivarSujeto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sujetos"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nombre, DNI o cargo..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }} className="w-36">
          <option value="">Todos</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </Select>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">DNI</th>
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 font-medium">Cargo</th>
              <th className="text-left px-4 py-3 font-medium">Unidad</th>
              <th className="text-left px-4 py-3 font-medium">Obligaciones</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
              {puedeEditar && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron sujetos
                </td>
              </tr>
            )}
            {data?.data.map((s) => (
              <tr key={s.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-mono">{s.dni}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onVerDetalle?.(s.id)}
                    className="font-medium hover:underline text-left"
                  >
                    {s.apellidos}, {s.nombres}
                  </button>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.cargo}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.unidadOrganica.nombre}</td>
                <td className="px-4 py-3">
                  <Badge variant={s.obligaciones.length > 0 ? "warning" : "secondary"}>
                    {s.obligaciones.length} pendiente{s.obligaciones.length !== 1 ? "s" : ""}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={s.estado === "ACTIVO" ? "success" : "secondary"}>
                    {s.estado}
                  </Badge>
                </td>
                {puedeEditar && (
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onEditar?.(s.id)}>
                        Editar
                      </Button>
                      {s.estado === "ACTIVO" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`¿Desactivar a ${s.nombres} ${s.apellidos}?`)) {
                              desactivar.mutate(s.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          Desactivar
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.total > data.limit && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {(page - 1) * data.limit + 1}–{Math.min(page * data.limit, data.total)} de {data.total}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={page * data.limit >= data.total}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
