export type MenuOptionKind = 'route' | 'action';

export interface MenuOption {
  id: string;
  label: string;
  description?: string;
  icon: 'map' | 'profile' | 'logout';
  kind: MenuOptionKind;
  target?: string;
  isActive?: boolean;
  ariaLabel?: string;
}

