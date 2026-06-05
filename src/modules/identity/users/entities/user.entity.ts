import { Column, Entity, ManyToMany } from 'typeorm';
import { Role } from '../../../identity/roles/entities/role.entity';
import { AbstractEntity } from '@/modules/database/abstract.entity';

@Entity()
export class User extends AbstractEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @ManyToMany(() => Role)
  roles: Role[];
}
