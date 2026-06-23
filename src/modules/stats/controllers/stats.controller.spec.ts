import { QueryBus } from '@nestjs/cqrs';
import { mockDependency } from '@/shared/helpers';
import { StatsController } from './stats.controller';
import { FindStatsQuery } from '../queries';

describe('StatsController', () => {
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let controller: StatsController;

  beforeEach(() => {
    queryBus = { execute: jest.fn() };
    controller = new StatsController(mockDependency<QueryBus>(queryBus));
  });

  it('returns stats from the query bus', async () => {
    const stats = [
      { label: 'Utilisateurs', total: 2 },
      { label: 'Rôles', total: 2 }
    ];
    queryBus.execute.mockResolvedValueOnce(stats);

    const result = await controller.findAll();

    expect(result).toBe(stats);
    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(FindStatsQuery));
  });
});
