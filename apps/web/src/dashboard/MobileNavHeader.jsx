"use client";

import { Icon } from "@saintrocky/icons";
import { BrandWordmarkLogo, Button } from "@saintrocky/ui";

export function MobileNavHeader({ isMenuOpen = false, onMenuToggle }) {
  return (
    <header className="sr-MobileNavHeader">
      <Button
        type="button"
        variant="ghost"
        className="sr-MobileNavHeader__menuButton"
        aria-expanded={isMenuOpen}
        aria-controls="sr-mobile-dashboard-drawer"
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        leadingIcon={<Icon name={isMenuOpen ? "close" : "menu"} size={20} />}
        onClick={onMenuToggle}
      />
      <div className="sr-MobileNavHeader__brand">
        <BrandWordmarkLogo className="sr-MobileNavHeader__brandLogo" variant="inline" width="100%" />
      </div>
    </header>
  );
}
