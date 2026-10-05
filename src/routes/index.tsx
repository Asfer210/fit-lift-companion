import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Lift & Fit Gym Management" },
      { name: "description", content: "Lift & Fit staff portal." },
      { property: "og:title", content: "Lift & Fit Gym Management" },
      { property: "og:description", content: "Lift & Fit staff portal." },
    ],
  }),
});
