const ROLE_HOME_PATHS = {
  admin: "/admin",
  cashier: "/kasir",
};

export function getRoleHomePath(role) {
  if (typeof role !== "string") {
    return null;
  }

   const normalizedRole = role.trim().toLowerCase();

  return ROLE_HOME_PATHS[normalizedRole] ?? null;
}