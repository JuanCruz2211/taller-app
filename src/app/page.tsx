import Hero from "@/features/landing/components/hero";
import Features from "@/features/landing/components/features";
import SignupForm from "@/features/landing/components/signup-form";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <SignupForm />

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <p>© {new Date().getFullYear()} Service Reports. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}
