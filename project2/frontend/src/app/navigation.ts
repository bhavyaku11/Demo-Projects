export interface NavigationItem {
  description: string;
  href: string;
  label: string;
}

export const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Home",
    description: "Overview and system summary"
  },
  {
    href: "/simulation-arena",
    label: "Simulation Arena",
    description: "Run and monitor live simulations"
  },
  {
    href: "/results-dashboard",
    label: "Results Dashboard",
    description: "Track outcomes and performance"
  }
];

