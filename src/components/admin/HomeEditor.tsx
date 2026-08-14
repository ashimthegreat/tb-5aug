"use client";

import { useEffect, useState } from "react";
import type { HomeContent } from "@/lib/data";
import { apiGet, apiPut } from "@/lib/adminApi";
import ListEditor, { type FieldDef } from "./ListEditor";
import { Input, PrimaryButton, Textarea } from "./ui";

const stepFields: FieldDef[] = [
  { key: "icon", label: "Icon", type: "icon" },
  { key: "title", label: "Title", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
];

const testimonialFields: FieldDef[] = [
  { key: "quote", label: "Quote", type: "textarea" },
  { key: "name", label: "Name", type: "text" },
  { key: "org", label: "Organisation", type: "text" },
];

const faqFields: FieldDef[] = [
  { key: "question", label: "Question", type: "text" },
  { key: "answer", label: "Answer", type: "textarea" },
];

const insightFields: FieldDef[] = [
  { key: "eyebrow", label: "Eyebrow", type: "text" },
  { key: "title", label: "Title", type: "text" },
  { key: "excerpt", label: "Excerpt", type: "textarea" },
  { key: "href", label: "Link", type: "text" },
];

const caseFields: FieldDef[] = [
  { key: "icon", label: "Icon", type: "icon" },
  { key: "title", label: "Title", type: "text" },
  { key: "summary", label: "Summary", type: "textarea" },
  { key: "href", label: "Link", type: "text" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <legend className="px-2 text-sm font-semibold text-slate-900">{title}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

export default function HomeEditor() {
  const [home, setHome] = useState<HomeContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiGet<HomeContent>("home")
      .then(setHome)
      .catch((e) => setStatus(`Error: ${e.message}`));
  }, []);

  if (!home) {
    return <p className="text-sm text-slate-500">{status || "Loading…"}</p>;
  }

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      await apiPut("home", home);
      setStatus("Saved");
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <Section title="Stats">
        <Textarea
          label="Stats subline"
          value={home.statsSubline}
          onChange={(e) => setHome({ ...home, statsSubline: e.target.value })}
        />
      </Section>

      <Section title="Process (How We Work)">
        <Input
          label="Eyebrow"
          value={home.process.eyebrow}
          onChange={(e) =>
            setHome({ ...home, process: { ...home.process, eyebrow: e.target.value } })
          }
        />
        <Input
          label="Title"
          value={home.process.title}
          onChange={(e) =>
            setHome({ ...home, process: { ...home.process, title: e.target.value } })
          }
        />
        <Textarea
          label="Description"
          value={home.process.description}
          onChange={(e) =>
            setHome({ ...home, process: { ...home.process, description: e.target.value } })
          }
        />
        <ListEditor
          title="Steps"
          fields={stepFields}
          items={home.process.steps as unknown as Record<string, unknown>[]}
          onChange={(items) =>
            setHome({
              ...home,
              process: { ...home.process, steps: items as unknown as typeof home.process.steps },
            })
          }
          makeDefaults={() => ({ icon: "users", title: "", description: "" })}
        />
      </Section>

      <Section title="Testimonials">
        <Input
          label="Eyebrow"
          value={home.testimonials.eyebrow}
          onChange={(e) =>
            setHome({ ...home, testimonials: { ...home.testimonials, eyebrow: e.target.value } })
          }
        />
        <Input
          label="Title"
          value={home.testimonials.title}
          onChange={(e) =>
            setHome({ ...home, testimonials: { ...home.testimonials, title: e.target.value } })
          }
        />
        <Textarea
          label="Description"
          value={home.testimonials.description}
          onChange={(e) =>
            setHome({ ...home, testimonials: { ...home.testimonials, description: e.target.value } })
          }
        />
        <ListEditor
          title="Testimonials"
          fields={testimonialFields}
          items={home.testimonials.items as unknown as Record<string, unknown>[]}
          onChange={(items) =>
            setHome({
              ...home,
              testimonials: { ...home.testimonials, items: items as unknown as typeof home.testimonials.items },
            })
          }
          makeDefaults={() => ({ quote: "", name: "", org: "" })}
          labelKey="name"
        />
      </Section>

      <Section title="FAQ">
        <Input
          label="Eyebrow"
          value={home.faq.eyebrow}
          onChange={(e) => setHome({ ...home, faq: { ...home.faq, eyebrow: e.target.value } })}
        />
        <Input
          label="Title"
          value={home.faq.title}
          onChange={(e) => setHome({ ...home, faq: { ...home.faq, title: e.target.value } })}
        />
        <Textarea
          label="Description"
          value={home.faq.description}
          onChange={(e) =>
            setHome({ ...home, faq: { ...home.faq, description: e.target.value } })
          }
        />
        <ListEditor
          title="Questions"
          fields={faqFields}
          items={home.faq.items as unknown as Record<string, unknown>[]}
          onChange={(items) =>
            setHome({
              ...home,
              faq: { ...home.faq, items: items as unknown as typeof home.faq.items },
            })
          }
          makeDefaults={() => ({ question: "", answer: "" })}
          labelKey="question"
        />
      </Section>

      <Section title="Insights / Blog highlights">
        <Input
          label="Eyebrow"
          value={home.insights.eyebrow}
          onChange={(e) =>
            setHome({ ...home, insights: { ...home.insights, eyebrow: e.target.value } })
          }
        />
        <Input
          label="Title"
          value={home.insights.title}
          onChange={(e) =>
            setHome({ ...home, insights: { ...home.insights, title: e.target.value } })
          }
        />
        <Textarea
          label="Description"
          value={home.insights.description}
          onChange={(e) =>
            setHome({ ...home, insights: { ...home.insights, description: e.target.value } })
          }
        />
        <ListEditor
          title="Insights"
          fields={insightFields}
          items={home.insights.items as unknown as Record<string, unknown>[]}
          onChange={(items) =>
            setHome({
              ...home,
              insights: { ...home.insights, items: items as unknown as typeof home.insights.items },
            })
          }
          makeDefaults={() => ({ eyebrow: "", title: "", excerpt: "", href: "" })}
          labelKey="title"
        />
      </Section>

      <Section title="Featured Work / Case highlights">
        <Input
          label="Eyebrow"
          value={home.cases.eyebrow}
          onChange={(e) => setHome({ ...home, cases: { ...home.cases, eyebrow: e.target.value } })}
        />
        <Input
          label="Title"
          value={home.cases.title}
          onChange={(e) => setHome({ ...home, cases: { ...home.cases, title: e.target.value } })}
        />
        <Textarea
          label="Description"
          value={home.cases.description}
          onChange={(e) =>
            setHome({ ...home, cases: { ...home.cases, description: e.target.value } })
          }
        />
        <ListEditor
          title="Cases"
          fields={caseFields}
          items={home.cases.items as unknown as Record<string, unknown>[]}
          onChange={(items) =>
            setHome({
              ...home,
              cases: { ...home.cases, items: items as unknown as typeof home.cases.items },
            })
          }
          makeDefaults={() => ({ icon: "spark", title: "", summary: "", href: "" })}
          labelKey="title"
        />
      </Section>

      <div className="flex items-center gap-3">
        <PrimaryButton type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save home content"}
        </PrimaryButton>
        {status && <span className="text-sm text-slate-500">{status}</span>}
      </div>
    </div>
  );
}
