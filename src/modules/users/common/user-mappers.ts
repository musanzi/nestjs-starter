import { Role } from '../../roles/entities/role.entity';
import { User } from '../entities/user.entity';

export function mapRoleIds(roleIds?: string[] | null): Pick<Role, 'id'>[] | undefined {
  if (!roleIds) return undefined;
  return roleIds.map((id) => ({ id }));
}

export function mapUserRoles(user: User): User {
  if (!user?.roles) return user;
  const roles = user.roles.map((role) => role.name);
  return { ...user, roles } as unknown as User;
}

export function mapUsersRoles(users: User[]): User[] {
  return users.map(mapUserRoles);
}
