import { TestBed } from '@angular/core/testing';
import { MenuStateService } from './menu-state.service';

describe('MenuStateService', () => {
  let service: MenuStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuStateService);
  });

  it('should toggle menu visibility', () => {
    expect(service.isOpen()).toBeFalse();
    service.toggleMenu();
    expect(service.isOpen()).toBeTrue();
    service.toggleMenu();
    expect(service.isOpen()).toBeFalse();
  });

  it('should open and close explicitly', () => {
    service.openMenu();
    expect(service.isOpen()).toBeTrue();
    service.closeMenu();
    expect(service.isOpen()).toBeFalse();
  });

  it('should set and clear errors', () => {
    service.setError('Algo salió mal');
    expect(service.errorMessage()).toBe('Algo salió mal');
    service.clearError();
    expect(service.errorMessage()).toBeNull();
  });
});

