import type { Rol } from "@prisma/client";

export type Accion =
  | "sujetos:read"
  | "sujetos:write"
  | "sujetos:delete"
  | "sujetos:import"
  | "obligaciones:read"
  | "obligaciones:write"
  | "presentacion:registrar"
  | "alertas:read"
  | "reportes:tablero"
  | "reportes:exportar"
  | "reportes:semanal"
  | "admin:usuarios"
  | "admin:config";

const permisosPorRol: Record<Rol, Accion[]> = {
  ADMIN: [
    "sujetos:read", "sujetos:write", "sujetos:delete", "sujetos:import",
    "obligaciones:read", "obligaciones:write",
    "presentacion:registrar",
    "alertas:read",
    "reportes:tablero", "reportes:exportar", "reportes:semanal",
    "admin:usuarios", "admin:config",
  ],
  OPERADOR: [
    "sujetos:read",
    "obligaciones:read",
    "alertas:read",
    "reportes:tablero",
  ],
  ALTA_DIRECCION: [
    "reportes:tablero",
    "reportes:exportar",
  ],
};

export function tienePermiso(rol: Rol, accion: Accion): boolean {
  return permisosPorRol[rol]?.includes(accion) ?? false;
}

export function rolesConPermiso(accion: Accion): Rol[] {
  return (Object.keys(permisosPorRol) as Rol[]).filter((rol) =>
    tienePermiso(rol, accion)
  );
}
