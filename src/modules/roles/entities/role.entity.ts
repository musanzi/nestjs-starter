import { AbstractEntity } from '@/modules/database/abstract.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, ManyToMany } from 'typeorm';

@Entity()
export class Role extends AbstractEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @ManyToMany(() => User)
  users: User[];
}
