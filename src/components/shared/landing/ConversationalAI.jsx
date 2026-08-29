import { Send, User, Bot } from 'lucide-react';
import SectionHeading from '@/components/shared/SectionHeading';
import { Card } from '@/components/ui/card';

export default function ConversationalAI({ questions, answer }) {
  const featuredQuestion = questions[questions.length - 1];

  return (
    <section className="mx-auto max-w-content px-8 py-20">
      <SectionHeading eyebrow="Conversational AI" title="Ask Your Business Data." description="Type a question in plain language — the assistant answers using your actual operational data." />

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <ul className="space-y-3">
          {questions.map((question) => (
            <li key={question} className="rounded-md border border-border bg-secondary/20 px-4 py-3 font-body text-sm text-foreground/80">
              &ldquo;{question}&rdquo;
            </li>
          ))}
        </ul>

        <Card className="flex flex-col p-5">
          <div className="flex-1 space-y-4">
            <div className="flex justify-end gap-2">
              <div className="max-w-xs rounded-lg rounded-tr-sm bg-primary px-4 py-2.5 font-body text-sm text-primary-foreground">{featuredQuestion}</div>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                <User size={14} strokeWidth={2} />
              </span>
            </div>

            <div className="flex gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-primary-foreground">
                <Bot size={14} strokeWidth={2} />
              </span>
              <div className="max-w-sm rounded-lg rounded-tl-sm bg-secondary/40 px-4 py-2.5 font-body text-sm leading-relaxed text-foreground">{answer}</div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-md border border-border px-3 py-2">
            <input type="text" placeholder="Ask about your business…" disabled className="flex-1 bg-transparent font-body text-sm text-foreground placeholder:text-foreground/40 focus:outline-none" />
            <Send size={16} strokeWidth={2} className="text-foreground/40" />
          </div>
        </Card>
      </div>
    </section>
  );
}
