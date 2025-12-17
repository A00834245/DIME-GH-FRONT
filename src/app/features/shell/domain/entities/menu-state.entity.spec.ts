import { MenuState } from './menu-state.entity';

describe('MenuState', () => {
  it('should start closed without errors', () => {
    const state = MenuState.create();
    expect(state.isOpen).toBeFalse();
    expect(state.errorMessage).toBeNull();
  });

  it('should open and clear previous errors', () => {
    const state = MenuState.create().withError('failure');
    const opened = state.open();
    expect(opened.isOpen).toBeTrue();
    expect(opened.errorMessage).toBeNull();
  });

  it('should close without altering existing error', () => {
    const state = MenuState.create().withError('failure');
    const closed = state.close();
    expect(closed.isOpen).toBeFalse();
    expect(closed.errorMessage).toBe('failure');
  });

  it('should toggle correctly', () => {
    let state = MenuState.create();
    state = state.toggle();
    expect(state.isOpen).toBeTrue();
    state = state.toggle();
    expect(state.isOpen).toBeFalse();
  });

  it('should clear errors explicitly', () => {
    const state = MenuState.create().withError('failure').clearError();
    expect(state.errorMessage).toBeNull();
  });
});

