
import { LinguaCraftLogo } from '@/components/icons';

export function NavigationBar() {

  return (
    <nav className="flex items-center justify-between p-4 bg-card shadow-sm rounded-lg mb-6">
      <a className="flex items-center gap-3 cursor-pointer" href="/">
        <LinguaCraftLogo className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          LinguaCraft
        </h1>
      </a>
      
      
      <div className="flex items-center gap-3">
        {/* All authentication UI (buttons, avatar, dropdowns, notifications) has been removed */}
      </div>
    </nav>
  );
}
