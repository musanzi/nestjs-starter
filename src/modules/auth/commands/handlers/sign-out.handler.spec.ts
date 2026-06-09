import { Request } from 'express';
import { mockDependency } from '../../../../../test/mock-dependency';
import { SignOutCommand } from '../impl/sign-out.command';
import { SignOutHandler } from './sign-out.handler';

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
