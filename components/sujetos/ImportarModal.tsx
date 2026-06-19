"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ErrorFila {
  fila: number;
  error: string;
}

interface ResultadoImportacion {
  importados: number;
  errores: number;
  detalleErrores: ErrorFila[];
}

async function importarArchivo(file: File): Promise<ResultadoImportacion> {
  const formData = new FormData();
  formData.append("archivo", file);
  const res = await fetch("/api/sujetos/importar", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Error al importar");
  }
  return res.json();
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportarModal({ open, onOpenChange }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importar = useMutation({
    mutationFn: importarArchivo,
    onSuccess: (data) => {
      setResultado(data);
      queryClient.invalidateQueries({ queryKey: ["sujetos"] });
    },
  });

  function handleArchivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setArchivo(file);
    setResultado(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".csv"))) {
      setArchivo(file);
      setResultado(null);
    }
  }

  function handleCerrar() {
    setArchivo(null);
    setResultado(null);
    importar.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleCerrar}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar sujetos obligados</DialogTitle>
        </DialogHeader>

        {!resultado ? (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={handleArchivoChange}
              />
              {archivo ? (
                <div>
                  <p className="font-medium">{archivo.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(archivo.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground">Arrastra un archivo .xlsx o .csv aquí</p>
                  <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Columnas requeridas: dni, nombres, apellidos, cargo, nivelJerarquico, correo, unidadOrganicaId
            </p>

            {importar.error && (
              <div className="rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm">
                {importar.error.message}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCerrar}>Cancelar</Button>
              <Button
                disabled={!archivo || importar.isPending}
                onClick={() => archivo && importar.mutate(archivo)}
              >
                {importar.isPending ? "Importando..." : "Importar"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 rounded-md bg-green-50 text-green-800 p-4 text-center">
                <p className="text-2xl font-bold">{resultado.importados}</p>
                <p className="text-sm">Importados</p>
              </div>
              <div className="flex-1 rounded-md bg-red-50 text-red-800 p-4 text-center">
                <p className="text-2xl font-bold">{resultado.errores}</p>
                <p className="text-sm">Errores</p>
              </div>
            </div>

            {resultado.detalleErrores.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Detalle de errores:</p>
                <div className="max-h-48 overflow-y-auto rounded-md border text-xs">
                  {resultado.detalleErrores.map((e) => (
                    <div key={e.fila} className="px-3 py-2 border-b last:border-0">
                      <span className="font-medium">Fila {e.fila}:</span> {e.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleCerrar}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
