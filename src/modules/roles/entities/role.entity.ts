import { AbstractEntity } from '@/modules/database/abstract.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, ManyToMany } from 'typeorm';

@Entity('roles')
export class Role extends AbstractEntity {
  @Column({ unique: true })
  name: string;

  @ManyToMany(() => User)
  users: User[];
}
