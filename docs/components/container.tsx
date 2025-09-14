import { ReactNode } from "react";
import { Sidebar } from "components/navigation";
import { PreferencesProvider } from "components/preferences";

interface ContainerProps {
  children: ReactNode;
}

export default function Container({ children }: ContainerProps) {
  return (
    <PreferencesProvider>
      <div className="flex flex-1 w-full mx-auto max-w-7xl px-4 sm:px-8 py-8">
        <div className="flex w-full gap-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <Sidebar />
          <main className="flex-1 min-w-0 mt-10" data-pagefind-body>
            {children}
          </main>
        </div>
      </div>
    </PreferencesProvider>
  );
}
