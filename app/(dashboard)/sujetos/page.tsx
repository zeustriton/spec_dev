"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SujetosTable } from "@/components/sujetos/SujetosTable";
import { SujetoForm } from "@/components/sujetos/SujetoForm";
import { ImportarModal } from "@/components/sujetos/ImportarModal";

export default function SujetosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showCrear, setShowCrear] = useState(false);
  const [showImportar, setShowImportar] = useState(false);

  const esAdmin = session?.user?.rol === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sujetos Obligados</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de servidores públicos sujetos a presentar DJI
          </p>
        </div>
        {esAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportar(true)}>
              Importar CSV/Excel
            </Button>
            <Button onClick={() => setShowCrear(true)}>
              + Nuevo sujeto
            </Button>
          </div>
        )}
      </div>

      <SujetosTable
        puedeEditar={esAdmin}
        onVerDetalle={(id) => router.push(`/sujetos/${id}`)}
        onEditar={(id) => router.push(`/sujetos/${id}`)}
      />

      <Dialog open={showCrear} onOpenChange={setShowCrear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo sujeto obligado</DialogTitle>
          </DialogHeader>
          <SujetoForm
            onSuccess={() => setShowCrear(false)}
            onCancel={() => setShowCrear(false)}
          />
        </DialogContent>
      </Dialog>

      <ImportarModal open={showImportar} onOpenChange={setShowImportar} />
    </div>
  );
}
