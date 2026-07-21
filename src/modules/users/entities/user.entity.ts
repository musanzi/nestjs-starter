import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { AbstractEntity } from '@/shared/abstracts';

@Entity()
export class User extends AbstractEntity {
  @Column({ type: 'varchar', length: 320, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string;

  @ManyToMany(() => Role)
  @JoinTable({ name: 'user_roles' })
  roles: Role[];
}
