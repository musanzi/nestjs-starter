import { Request } from 'express';
import { mockDependency } from '@/shared/helpers';
import { SignOutCommand } from '../impl';
import { SignOutHandler } from '../handlers/sign-out.handler';

describe('SignOutHandler', () => {
  it('destroys the request session', async () => {
    const destroy = jest.fn();
    const request = mockDependency<Request>({
      session: mockDependency<Request['session']>({ destroy })
    });
    const handler = new SignOutHandler();

    await handler.execute(new SignOutCommand(request));

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(destroy).toHaveBeenCalledWith(expect.any(Function));
  });
});
