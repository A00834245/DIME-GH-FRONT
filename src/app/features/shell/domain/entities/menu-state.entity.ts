export class MenuState {
  private constructor(
    public readonly isOpen: boolean,
    public readonly errorMessage: string | null
  ) {}

  static create(): MenuState {
    return new MenuState(false, null);
  }

  open(): MenuState {
    if (this.isOpen) {
      return this;
    }
    return new MenuState(true, null);
  }

  close(): MenuState {
    if (!this.isOpen && !this.errorMessage) {
      return this;
    }
    return new MenuState(false, this.errorMessage);
  }

  toggle(): MenuState {
    return this.isOpen ? this.close() : this.open();
  }

  withError(message: string): MenuState {
    return new MenuState(this.isOpen, message);
  }

  clearError(): MenuState {
    if (!this.errorMessage) {
      return this;
    }
    return new MenuState(this.isOpen, null);
  }
}

