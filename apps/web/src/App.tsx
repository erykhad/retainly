import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Route, Routes } from "react-router";

import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { ensureSeeded } from "@/lib/stores";
import { AddTranslationPage } from "@/pages/AddTranslationPage";
import { CreatePage } from "@/pages/CreatePage";
import { HomePage } from "@/pages/HomePage";
import { ListPage } from "@/pages/ListPage";
import { PickListPage } from "@/pages/PickListPage";
import { PracticePage } from "@/pages/PracticePage";
import { WordPage } from "@/pages/WordPage";

ensureSeeded();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="lists/:listSlug" element={<ListPage />} />
            <Route
              path="lists/:listSlug/:wordSlug"
              element={<WordPage />}
            />
            <Route
              path="lists/:listSlug/:wordSlug/translation"
              element={<AddTranslationPage />}
            />
            <Route path="new" element={<CreatePage />} />
            <Route path="new/pick-list" element={<PickListPage />} />
            <Route path="practice/:listSlug" element={<PracticePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-center" />
      {import.meta.env.DEV ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
