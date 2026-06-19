"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SujetoSchema, type SujetoInput } from "@/lib/validaciones/schemas";

interface UnidadOrganica {
  id: string;
  nombre: string;
  organo: string;
}

interface Props {
  sujetoId?: string;
  defaultValues?: Partial<SujetoInput>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

async function fetchUnidades(): Promise<UnidadOrganica[]> {
  const res = await fetch("/api/unidades");
  if (!res.ok) throw new Error("Error al cargar unidades");
  return res.json();
}

async function crearSujeto(data: SujetoInput) {
  const res = await fetch("/api/sujetos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Error al crear sujeto");
  }
  return res.json();
}

async function actualizarSujeto(id: string, data: Partial<SujetoInput>) {
  const res = await fetch(`/api/sujetos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Error al actualizar sujeto");
  }
  return res.json();
}

export function SujetoForm({ sujetoId, defaultValues, onSuccess, onCancel }: Props) {
  const queryClient = useQueryClient();
  const esEdicion = Boolean(sujetoId);

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades"],
    queryFn: fetchUnidades,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SujetoInput>({
    resolver: zodResolver(SujetoSchema),
    defaultValues,
  });

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  const mutacion = useMutation({
    mutationFn: (data: SujetoInput) =>
      esEdicion ? actualizarSujeto(sujetoId!, data) : crearSujeto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sujetos"] });
      onSuccess?.();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutacion.mutateAsync(d))} className="space-y-4">
      {mutacion.error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {mutacion.error.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="dni">DNI *</Label>
          <Input id="dni" {...register("dni")} placeholder="12345678" maxLength={8} />
          {errors.dni && <p className="text-xs text-destructive">{errors.dni.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="correo">Correo institucional *</Label>
          <Input id="correo" type="email" {...register("correo")} placeholder="servidor@entidad.gob.pe" />
          {errors.correo && <p className="text-xs text-destructive">{errors.correo.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="nombres">Nombres *</Label>
          <Input id="nombres" {...register("nombres")} />
          {errors.nombres && <p className="text-xs text-destructive">{errors.nombres.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="apellidos">Apellidos *</Label>
          <Input id="apellidos" {...register("apellidos")} />
          {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="cargo">Cargo *</Label>
          <Input id="cargo" {...register("cargo")} />
          {errors.cargo && <p className="text-xs text-destructive">{errors.cargo.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="nivelJerarquico">Nivel jerárquico *</Label>
          <Select id="nivelJerarquico" {...register("nivelJerarquico")}>
            <option value="">Seleccionar...</option>
            <option value="Directivo">Directivo</option>
            <option value="Profesional">Profesional</option>
            <option value="Técnico">Técnico</option>
          </Select>
          {errors.nivelJerarquico && <p className="text-xs text-destructive">{errors.nivelJerarquico.message}</p>}
        </div>

        <div className="col-span-2 space-y-1">
          <Label htmlFor="unidadOrganicaId">Unidad orgánica *</Label>
          <Select id="unidadOrganicaId" {...register("unidadOrganicaId")}>
            <option value="">Seleccionar unidad...</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </Select>
          {errors.unidadOrganicaId && <p className="text-xs text-destructive">{errors.unidadOrganicaId.message}</p>}
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Jefe inmediato (opcional)</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="jefeNombre">Nombre del jefe</Label>
            <Input id="jefeNombre" {...register("jefeNombre")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="jefeDni">DNI del jefe</Label>
            <Input id="jefeDni" {...register("jefeDni")} maxLength={8} />
            {errors.jefeDni && <p className="text-xs text-destructive">{errors.jefeDni.message}</p>}
          </div>
          <div className="col-span-2 space-y-1">
            <Label htmlFor="jefeCorreo">Correo del jefe</Label>
            <Input id="jefeCorreo" type="email" {...register("jefeCorreo")} />
            {errors.jefeCorreo && <p className="text-xs text-destructive">{errors.jefeCorreo.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || mutacion.isPending}>
          {mutacion.isPending ? "Guardando..." : esEdicion ? "Actualizar" : "Crear sujeto"}
        </Button>
      </div>
    </form>
  );
}
