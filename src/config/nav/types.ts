export interface NavItem {
  title: string;
  path?: string;
  href?: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  children?: NavItem[];
  subItems?: NavItem[];
}
