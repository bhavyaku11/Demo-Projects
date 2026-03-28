import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/layouts/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { ResultsDashboardPage } from "@/pages/ResultsDashboardPage";
import { SimulationArenaPage } from "@/pages/SimulationArenaPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: "simulation-arena",
        element: <SimulationArenaPage />
      },
      {
        path: "results-dashboard",
        element: <ResultsDashboardPage />
      }
    ]
  }
]);
