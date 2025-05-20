import { ReactNode } from "react";
import { Sidebar } from "components/navigation";

interface ContainerProps {
  children: ReactNode;
}

export default function Container({ children }: ContainerProps) {
  return (
    <div className="flex flex-1 w-full mx-auto px-4 sm:px-6 py-8 gap-8">
      <Sidebar />
      <main className="flex-1 min-w-0" data-pagefind-body>
        {children}
      </main>
    </div>
  );
}
