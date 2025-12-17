import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HamburgerMenuComponent } from './hamburger-menu.component';
import { MenuNavigationService } from '@features/shell/core/services/menu-navigation.service';
import { MenuStateService } from '@features/shell/core/services/menu-state.service';

class MenuNavigationServiceStub {
  options = signal([
    {
      id: 'map',
      label: 'Mapa',
      description: 'Explora el mapa',
      icon: 'map',
      kind: 'route',
      target: '/map',
      isActive: true
    }
  ]);

  selectOption = jasmine.createSpy('selectOption').and.returnValue(Promise.resolve());
}

describe('HamburgerMenuComponent', () => {
  let component: HamburgerMenuComponent;
  let fixture: ComponentFixture<HamburgerMenuComponent>;
  let menuState: MenuStateService;
  let navStub: MenuNavigationServiceStub;

  beforeEach(async () => {
    navStub = new MenuNavigationServiceStub();

    await TestBed.configureTestingModule({
      imports: [HamburgerMenuComponent],
      providers: [
        MenuStateService,
        { provide: MenuNavigationService, useValue: navStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HamburgerMenuComponent);
    component = fixture.componentInstance;
    menuState = TestBed.inject(MenuStateService);
    fixture.detectChanges();
  });

  it('should render trigger button', () => {
    const button = fixture.nativeElement.querySelector('.menu-trigger');
    expect(button).toBeTruthy();
  });

  it('should show overlay when menu opens', () => {
    menuState.openMenu();
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.menu-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should delegate option selection to navigation service', async () => {
    menuState.openMenu();
    fixture.detectChanges();
    const optionButton = fixture.nativeElement.querySelector('.menu-option');
    optionButton.click();
    await fixture.whenStable();
    expect(navStub.selectOption).toHaveBeenCalledWith('map');
  });
});

