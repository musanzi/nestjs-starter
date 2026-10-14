import { AbstractEntity } from '@/shared/abstracts';
import { Check, Column, Entity, Index } from 'typeorm';
import { CompanySource } from '../enums';

@Entity('companies')
@Index('UQ_companies_external_identity', ['odooInstanceId', 'odooModel', 'odooRecordId'], { unique: true })
@Check('CHK_companies_name', `char_length(btrim("name")) > 0 AND "name" = btrim("name")`)
@Check('CHK_companies_version', '"version" >= 1')
@Check(
  'CHK_companies_source_identity',
  `
  ("source" = 'MANUAL' AND "odooInstanceId" IS NULL AND "odooModel" IS NULL AND "odooRecordId" IS NULL)
  OR ("source" = 'ODOO' AND "odooInstanceId" IS NOT NULL AND "odooModel" IS NOT NULL AND "odooRecordId" IS NOT NULL
    AND char_length(btrim("odooInstanceId")) > 0 AND char_length(btrim("odooModel")) > 0
    AND char_length(btrim("odooRecordId")) > 0)
`
)
export class Company extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: CompanySource, enumName: 'company_source' })
  source: CompanySource;

  @Column({ type: 'varchar', length: 128, nullable: true })
  odooInstanceId: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  odooModel: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  odooRecordId: string | null;

  @Column({ type: 'integer', default: 1 })
  version: number;
}
