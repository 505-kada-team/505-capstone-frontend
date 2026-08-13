import { useState } from 'react';
import { Boxes, ChartNoAxesCombined, Sparkles } from 'lucide-react';

import LoginForm from '@/components/shared/LoginForm';
import RegisterForm from '@/components/shared/RegisterForm';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

const FORM_MODE = {
  LOGIN: 'login',
  REGISTER: 'register',
};

const FEATURES = [
  {
    icon: Boxes,
    title: 'Connected Operations',
    description: 'Inventory, production planning, and POS in one workflow.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Data-Driven Decisions',
    description: 'Turn stock and sales activity into clearer operational insights.',
  },
];

export default function LoginPage() {
  const { isAuthLoading } = useAuthRedirect();
  const [formMode, setFormMode] = useState(FORM_MODE.LOGIN);

  if (isAuthLoading) {
    return (
      <main className="flex h-dvh items-center justify-center overflow-hidden bg-background px-4">
        <p className="text-sm text-muted-foreground">
          Checking your session...
        </p>
      </main>
    );
  }

  const isLoginMode = formMode === FORM_MODE.LOGIN;

  return (
    <main className="h-dvh overflow-hidden bg-background text-foreground">
      <div className="grid h-full lg:grid-cols-2">
        {/* LEFT — PRODUCT INTRODUCTION */}
        <section className="hidden h-full border-r border-primary-foreground/10 bg-primary text-primary-foreground lg:flex">
          <div className="flex h-full w-full flex-col justify-between px-10 py-8 xl:px-14 xl:py-10">
            <div>
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
                  AI
                </div>

                <div>
                  <p className="text-sm font-semibold leading-none">
                    Artisan Inventory
                  </p>

                  <p className="mt-1 text-xs text-primary-foreground/55">
                    Intelligent F&amp;B Operations
                  </p>
                </div>
              </div>

              {/* Main message */}
              <div className="mt-14 max-w-xl xl:mt-16">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  <Sparkles size={15} strokeWidth={2} />
                  Smarter F&amp;B Operations
                </div>

                <h1 className="mt-5 max-w-lg text-4xl font-semibold leading-[1.12] tracking-tight xl:text-[44px]">
                  Manage inventory.
                  <br />
                  Plan production.
                  <br />
                  Sell with confidence.
                </h1>

                <p className="mt-5 max-w-md text-sm leading-6 text-primary-foreground/65">
                  A connected operational system that helps F&amp;B businesses
                  manage stock, production planning, and sales from one place.
                </p>

                <div className="mt-8 grid max-w-lg gap-3">
                  {FEATURES.map((feature) => {
                    const Icon = feature.icon;

                    return (
                      <div
                        key={feature.title}
                        className="flex items-center gap-3 rounded-lg border border-primary-foreground/10 bg-primary-foreground/[0.035] px-4 py-3"
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                          <Icon size={16} strokeWidth={2} />
                        </div>

                        <div>
                          <p className="text-sm font-medium">
                            {feature.title}
                          </p>

                          <p className="mt-0.5 text-xs leading-5 text-primary-foreground/55">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-primary-foreground/10 pt-4 text-[11px] text-primary-foreground/40">
              <span>Inventory • Planning • POS</span>
              <span>F&amp;B Operations Platform</span>
            </div>
          </div>
        </section>

        {/* RIGHT — AUTH */}
        <section className="flex h-full items-center justify-center px-6 py-6 lg:px-10">
          <div className="w-full max-w-sm">
            {/* Mobile brand */}
            <div className="mb-6 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  AI
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Artisan Inventory
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Intelligent F&amp;B Operations
                  </p>
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {isLoginMode ? 'Welcome Back' : 'Create Account'}
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {isLoginMode
                  ? 'Sign in to Artisan Inventory'
                  : 'Create your Artisan Inventory account'}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {isLoginMode
                  ? 'Enter your account details to continue.'
                  : 'Fill in your details to create a new account.'}
              </p>
            </div>

            {/* Form container */}
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              {/* Mode switch */}
              <div className="mb-5 grid grid-cols-2 rounded-lg bg-muted/50 p-1">
                <button
                  type="button"
                  onClick={() => setFormMode(FORM_MODE.LOGIN)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    isLoginMode
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => setFormMode(FORM_MODE.REGISTER)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    !isLoginMode
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Register
                </button>
              </div>

              {isLoginMode ? (
                <LoginForm
                  onSwitchToRegister={() =>
                    setFormMode(FORM_MODE.REGISTER)
                  }
                />
              ) : (
                <RegisterForm
                  onSwitchToLogin={() =>
                    setFormMode(FORM_MODE.LOGIN)
                  }
                />
              )}
            </div>

            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Secure access for Admin and Cashier accounts.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}