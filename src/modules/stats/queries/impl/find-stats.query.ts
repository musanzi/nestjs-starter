import { Query } from '@nestjs/cqrs';
import { IStatItem } from '../../interfaces';

export class FindStatsQuery extends Query<IStatItem[]> {}
