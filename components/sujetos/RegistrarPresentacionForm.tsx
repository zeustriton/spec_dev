"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegistrarPresentacionSchema, type RegistrarPresentacionInput } from "@/lib/validaciones/schemas";

interface Props {
  obligacionId: string;
  fechaVencimiento: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

async function registrarPresentacion(obligacionId: string, data: RegistrarPresentacionInput) {
  const res = await fetch(`/api/obligaciones/${obligacionId}/registrar-presentacion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Error al registrar presentación");
  }
  return res.json();
}

export function RegistrarPresentacionForm({ obligacionId, fechaVencimiento, onSuccess, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistrarPresentacionInput>({
    resolver: zodResolver(RegistrarPresentacionSchema),
    defaultValues: { fechaPresentacion: new Date().toISOString().slice(0, 16) + ":00Z" },
  });

  const fechaSeleccionada = watch("fechaPresentacion");
  const esRetraso =
    fechaSeleccionada &&
    new Date(fechaSeleccionada) > new Date(fechaVencimiento);

  const mutacion = useMutation({
    mutationFn: (data: RegistrarPresentacionInput) => registrarPresentacion(obligacionId, data),
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit((d) => mutacion.mutateAsync(d))} className="space-y-4">
      <h3 className="text-sm font-semibold">Registrar presentación de DJI</h3>

      {esRetraso && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 text-sm">
          ⚠️ La fecha seleccionada es posterior al vencimiento. Se registrará como <strong>regularización extemporánea</strong>.
        </div>
      )}

      {mutacion.error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {mutacion.error.message}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="fechaPresentacion">Fecha de presentación *</Label>
        <Input
          id="fechaPresentacion"
          type="datetime-local"
          {...register("fechaPresentacion")}
        />
        {errors.fechaPresentacion && (
          <p className="text-xs text-destructive">{errors.fechaPresentacion.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="observaciones">Observaciones</Label>
        <Input id="observaciones" {...register("observaciones")} placeholder="Ej: Presentado vía plataforma SERVIR" />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        )}
        <Button type="submit" size="sm" disabled={isSubmitting || mutacion.isPending}>
          {mutacion.isPending ? "Registrando..." : "Confirmar presentación"}
        </Button>
      </div>
    </form>
  );
}
