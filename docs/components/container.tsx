import { ReactNode } from "react";
import { Sidebar } from "components/navigation";
import dynamic from "next/dynamic";

// Dynamically import the provider with no SSR
const PreferencesProviderClient = dynamic(() =>
  import("./preferences").then((mod) => {
    const { PreferencesProvider } = mod;
    return { default: PreferencesProvider };
  })
);

interface ContainerProps {
  children: ReactNode;
}

export default function Container({ children }: ContainerProps) {
  return (
    // Wrap with the client-side provider
    <PreferencesProviderClient>
      <div className="flex flex-1 w-full mx-auto px-4 sm:px-6 py-8 gap-8">
        <Sidebar />
        <main className="flex-1 min-w-0" data-pagefind-body>
          {children}
        </main>
      </div>
    </PreferencesProviderClient>
  );
}
