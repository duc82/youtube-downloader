import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <div className="mx-auto container">
        <Outlet />
      </div>
    </QueryClientProvider>
  );
}
