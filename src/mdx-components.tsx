import type { MDXComponents } from "mdx/types";

/** Article typography: body 17/26 at 68 characters, system font; League Gothic not used in body text. */
const components: MDXComponents = {
  h2: (p) => <h2 className="mt-8 text-[17px] leading-[22px] font-semibold" {...p} />,
  h3: (p) => <h3 className="mt-6 text-[17px] leading-[22px] font-semibold" {...p} />,
  p: (p) => <p className="mt-4 text-[17px] leading-[26px]" {...p} />,
  ul: (p) => <ul className="mt-4 list-disc space-y-2 pl-5 text-[17px] leading-[26px] marker:text-text-3" {...p} />,
  ol: (p) => <ol className="mt-4 list-decimal space-y-2 pl-5 text-[17px] leading-[26px]" {...p} />,
  li: (p) => <li className="pl-1" {...p} />,
  a: (p) => <a className="underline underline-offset-4" {...p} />,
  strong: (p) => <strong className="font-semibold" {...p} />,
  blockquote: (p) => (
    <blockquote className="mt-4 border-l-2 border-dashed border-[var(--text-2)] pl-4 text-text-2 [&_p]:mt-2 [&_p:first-child]:mt-0" {...p} />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
