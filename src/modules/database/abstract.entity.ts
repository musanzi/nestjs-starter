import { CreateDateColumn, UpdateDateColumn, DeleteDateColumn, PrimaryColumn } from 'typeorm';

export abstract class AbstractEntity {
  @PrimaryColumn({ generated: 'uuid' })
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ default: null })
  deleted_at: Date;
}
