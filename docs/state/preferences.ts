import { observable } from "@legendapp/state";
import { syncObservable } from "@legendapp/state/sync";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

export type Theme = "light" | "dark";
export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";
export type Registry = "npm" | "jsr";

interface PreferencesState {
  packageManager: PackageManager;
  registry: Registry;
  theme: Theme;
}

export const preferences$ = observable<PreferencesState>({
  packageManager: "npm",
  registry: "npm",
  theme: "light",
});

syncObservable(preferences$, {
  persist: {
    name: "user-preferences",
    plugin: ObservablePersistLocalStorage,
  },
});
