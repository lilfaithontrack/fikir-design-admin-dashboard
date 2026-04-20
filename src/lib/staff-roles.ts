import type { UserRole } from '@prisma/client';

export type StaffRole = UserRole;

/** Roles allowed to create, edit, or delete staff accounts */
export const ROLES_THAT_MANAGE_STAFF: UserRole[] = ['admin', 'manager'];

export function canManageStaff(role: UserRole): boolean {
  return ROLES_THAT_MANAGE_STAFF.includes(role);
}

/** Ordered for filters and dropdowns (business-facing labels) */
export const STAFF_ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Administrator', description: 'Full system access' },
  { value: 'manager', label: 'Manager', description: 'Operations and team oversight' },
  { value: 'sales', label: 'Sales', description: 'Orders and customer-facing work' },
  { value: 'designer', label: 'Designer', description: 'Designs and specifications' },
  { value: 'sewer', label: 'Sewer / tailor', description: 'Sewing and garment construction' },
  { value: 'store_keeper', label: 'Store keeper', description: 'Stock and warehouse' },
  { value: 'material_controller', label: 'Material controller', description: 'Fabrics and supplies' },
  { value: 'staff', label: 'Staff', description: 'General staff access' },
];

export function roleLabel(role: UserRole): string {
  return STAFF_ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

export const ALL_ROLE_VALUES = STAFF_ROLE_OPTIONS.map((r) => r.value);
