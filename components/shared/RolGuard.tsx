"use client";

import { useSession } from "next-auth/react";
import type { Rol } from "@prisma/client";

interface Props {
  roles: Rol[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RolGuard({ roles, children, fallback = null }: Props) {
  const { data: session } = useSession();
  if (!session?.user?.rol || !roles.includes(session.user.rol)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
