// Learn articles (docs/guardrails/content-health-claims.md). Validated at import:
// a published article without a grade, a reviewer or sources throws, failing the build.
// Drafts (no reviewer) appear only in development or with NEXT_PUBLIC_LEARN_SHOW_DRAFTS=true.
import { z } from "zod";

export const GRADES = ["strong", "moderate", "mixed", "myth"] as const;
export type Grade = (typeof GRADES)[number];

const articleSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,80}$/),
  title: z.string().min(5),
  summary: z.string().min(10).max(200),
  evidence: z.enum(GRADES),
  topic: z.string().min(2),
  readMinutes: z.number().int().min(1).max(30),
  reviewedBy: z.string(),
  reviewedOn: z.string(),
  supports: z.string().min(10),
  doesNotSupport: z.string().min(10),
  sources: z.array(z.object({ title: z.string().min(3), url: z.url().startsWith("https://") })).min(1),
  /** Paragraphs; a line starting with "## " is a heading. Plain text only, no HTML. */
  body: z.array(z.string().min(1)).min(2),
});

export type Article = z.infer<typeof articleSchema> & { draft: boolean };

const RAW: z.input<typeof articleSchema>[] = [
  {
    slug: "day-7-testosterone-claim",
    title: "The day-7 testosterone claim, traced to its source",
    summary: "A 2003 study of 28 men became internet doctrine. Here's what it measured, and why it was retracted.",
    evidence: "myth",
    topic: "Hormones",
    readMinutes: 4,
    reviewedBy: "",
    reviewedOn: "",
    supports: "One small 2003 study reported a brief rise in testosterone around day 7 of abstinence, followed by a return to baseline.",
    doesNotSupport:
      "Lasting hormonal change, or any benefit, from a 30-day challenge. The paper behind the claim was later retracted for duplicating earlier work.",
    sources: [
      { title: "Jiang et al. (2003), Journal of Zhejiang University Science (retracted)", url: "https://doi.org/10.1631/jzus.2003.0236" },
      { title: "Snopes: does abstinence raise testosterone 45 percent?", url: "https://www.snopes.com/fact-check/increase-testosterone-45-percent/" },
    ],
    body: [
      "## The claim",
      "Myth being checked: \"Abstaining for seven days boosts testosterone by 45 percent.\" It shows up in forums, videos and challenge posts every November.",
      "## Where it comes from",
      "The figure traces back to one 2003 study of 28 men. Researchers measured hormone levels across days of abstinence and reported a short peak around day 7, after which levels returned to where they started.",
      "The paper was later retracted for duplicating earlier published work. A retracted paper isn't evidence for anything, and no study since has shown a lasting change.",
      "## What this means for your 30 days",
      "WillWar doesn't promise physical changes, because the research doesn't support them. People do your challenge for reasons that hold up: practising self-control, getting evenings back, sleeping at a normal hour, and keeping a promise to yourself.",
    ],
  },
  {
    slug: "ejaculation-frequency-prostate",
    title: "Ejaculation frequency and prostate health: what one big study found",
    summary: "A large cohort study linked more frequent ejaculation with lower prostate cancer risk. Here's what that does and doesn't mean.",
    evidence: "moderate",
    topic: "Health research",
    readMinutes: 5,
    reviewedBy: "",
    reviewedOn: "",
    supports:
      "In a large long-running cohort of men, those who reported more frequent ejaculation had a lower rate of prostate cancer later in life.",
    doesNotSupport:
      "Cause and effect. It's an association from self-reported data. It also doesn't show that a 30-day challenge causes harm.",
    sources: [
      { title: "Rider et al. (2016), European Urology: ejaculation frequency and prostate cancer risk", url: "https://doi.org/10.1016/j.eururo.2016.03.027" },
      { title: "Plain-language summary (Ro Health Guide)", url: "https://ro.co/health-guide/what-are-the-benefits-of-not-ejaculating-for-30-days/" },
    ],
    body: [
      "## What the study did",
      "Researchers followed tens of thousands of men for about two decades and asked them how often they ejaculated at different ages. Men who reported higher frequency had a lower rate of prostate cancer.",
      "## What it doesn't show",
      "The study found an association, not a cause. People who report different habits can differ in many other ways. It also says nothing about a single month: there's no evidence that a 30-day challenge harms you, either.",
      "## The honest takeaway",
      "Your challenge is about practising self-control, not about your prostate. If you have urinary symptoms, pain or anything that worries you, see a doctor. That's true whatever challenge you're doing.",
    ],
  },
  {
    slug: "three-minutes-puzzle-craving",
    title: "Three minutes of a puzzle versus a craving",
    summary: "Studies at Plymouth found a short visual puzzle made cravings noticeably weaker. Here's why Ride it out is built on it.",
    evidence: "moderate",
    topic: "Cravings",
    readMinutes: 5,
    reviewedBy: "",
    reviewedOn: "",
    supports:
      "In lab and real-world studies, about three minutes of a visual block puzzle reduced the strength of cravings, including for food, drink and sex, by roughly a fifth.",
    doesNotSupport:
      "That a puzzle cures a habit, or that it works the same for everyone. The studies measured craving strength in the moment, not long-term change.",
    sources: [
      { title: "Skorka-Brown et al. (2015), Addictive Behaviors", url: "https://pearl.plymouth.ac.uk/handle/10026.1/3458?show=full" },
    ],
    body: [
      "## The idea",
      "Cravings often arrive as pictures: vivid mental imagery of the thing you want. Your visual working memory can only hold so much at once. A task that needs it, like fitting shapes together, leaves less room for that imagery.",
      "## What the studies found",
      "Researchers at Plymouth asked people to rate a craving, play a block puzzle for three minutes, then rate it again. Cravings dropped noticeably compared with people who waited through a loading screen. A follow-up study in everyday life found the same pattern across food, drink and other cravings.",
      "## How Ride it out uses it",
      "Every Ride it out game is visual-spatial and lasts three minutes. You rate the urge before and after, so you can see your own pattern over time. It's a tool for the moment, not a promise about the month.",
    ],
  },
  {
    slug: "one-slip-abstinence-violation",
    title: "Why one slip turns into a week, and how to stop it",
    summary: "The abstinence violation effect explains why \"I've blown it\" thinking turns one slip into many. Reset fast, without shame.",
    evidence: "moderate",
    topic: "Relapse prevention",
    readMinutes: 6,
    reviewedBy: "",
    reviewedOn: "",
    supports:
      "Relapse-prevention research describes a common pattern: after one slip, all-or-nothing thinking and guilt make further slips more likely.",
    doesNotSupport: "That one slip undoes your progress, or that shame helps you get back on track.",
    sources: [
      {
        title: "Larimer, Palmer and Marlatt (1999), Relapse prevention: an overview of Marlatt's cognitive-behavioral model",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427/",
      },
    ],
    body: [
      "## The pattern",
      "Psychologists call it the abstinence violation effect. After breaking a rule you set, it's easy to think \"I've already ruined it\" and stop trying. One slip becomes a lost week.",
      "## Why it happens",
      "All-or-nothing goals make a single mistake feel total. Guilt and self-blame add to the stress that set off the slip in the first place.",
      "## What helps",
      "Treat a reset as information, not a verdict. Notice what was going on, pick one thing to change tonight, and start the clock again. That's why WillWar keeps your best streak on your record, never shows anyone why you reset, and why the War Chest's default rule takes a quarter, not everything.",
    ],
  },
  {
    slug: "urge-surfing",
    title: "Urges crest and fall: how urge surfing works",
    summary: "Mindfulness-based relapse prevention teaches people to notice an urge and ride it out. Here's the idea behind Ride it out.",
    evidence: "moderate",
    topic: "Cravings",
    readMinutes: 5,
    reviewedBy: "",
    reviewedOn: "",
    supports:
      "Trials of mindfulness-based relapse prevention, which includes urge surfing, found fewer relapses than usual care for some substance use problems, and a brief urge-surfing exercise helped smokers in one study.",
    doesNotSupport:
      "That urge surfing has been tested for this specific habit, or that it makes urges disappear. The studies are about substances and smoking.",
    sources: [
      { title: "Bowen et al. (2014), JAMA Psychiatry: mindfulness-based relapse prevention trial", url: "https://doi.org/10.1001/jamapsychiatry.2014.4" },
      { title: "Bowen and Marlatt (2009), Psychology of Addictive Behaviors: surfing the urge", url: "https://doi.org/10.1037/a0017127" },
    ],
    body: [
      "## The idea",
      "An urge feels like it will keep growing until you act on it. In practice, urges behave more like waves: they rise, peak and fall, usually within minutes.",
      "Urge surfing means noticing the urge without fighting it or obeying it. You name it, notice where you feel it, and wait while it crests and passes.",
      "## What the research found",
      "Mindfulness-based relapse prevention, a programme that includes urge surfing, was compared with standard relapse prevention and usual care in a randomised trial. Over the following year, people in the mindfulness group had fewer relapses on some measures. A smaller study taught smokers a brief urge-surfing exercise and found it helped some of them smoke less.",
      "## How Ride it out applies it",
      "Ride it out asks you to rate the urge, gives it three minutes of something else to do, then asks again. Most of the time the number goes down, and seeing that happen is part of the point.",
    ],
  },
  {
    slug: "if-then-plans",
    title: "If-then plans: the simplest tool with strong evidence",
    summary: "Deciding in advance what you'll do in a specific situation is one of the best-supported tools in behaviour change research.",
    evidence: "strong",
    topic: "Habits",
    readMinutes: 4,
    reviewedBy: "",
    reviewedOn: "",
    supports:
      "A large meta-analysis of implementation intentions, plans in the form 'if situation X, then I will do Y', found a medium-to-large effect on reaching goals across many kinds of behaviour.",
    doesNotSupport: "That any single plan works for everyone, or that this has been studied for this habit specifically.",
    sources: [
      {
        title: "Gollwitzer and Sheeran (2006), Advances in Experimental Social Psychology: implementation intentions meta-analysis",
        url: "https://doi.org/10.1016/S0065-2601(06)38002-1",
      },
    ],
    body: [
      "## What an if-then plan is",
      "A goal says what you want. An if-then plan says exactly what you will do when a specific moment arrives: \"If I'm still on my phone at 11pm, then I'll put it in the kitchen and start Swell.\"",
      "## Why it works",
      "When the moment comes, the decision is already made. You don't have to win an argument with yourself at your most tired. Across many studies, people who wrote plans like this reached their goals more often than people who only set the goal.",
      "## Write three tonight",
      "Pick your three riskiest moments: maybe late at night, bored on a weekend afternoon, or alone after a hard day. For each one, write \"If ___, then I will ___.\" Keep the action small and specific, like leaving the room, texting your ally or starting a game.",
    ],
  },
  {
    slug: "late-nights-and-phones",
    title: "Late nights, phones and urges",
    summary: "The research on sleep, screens and self-control is mixed. Changing your evening setup is still one of the easiest things to try.",
    evidence: "mixed",
    topic: "Sleep",
    readMinutes: 5,
    reviewedBy: "",
    reviewedOn: "",
    supports:
      "Studies link phone use in bed with later bedtimes and worse sleep, and short sleep has been linked with poorer self-control in some experiments.",
    doesNotSupport:
      "A clear cause-and-effect chain from screens to urges. Many findings are correlations, and some self-control experiments haven't replicated well.",
    sources: [
      { title: "Exelmans and Van den Bulck (2016), Social Science and Medicine: bedtime phone use and sleep", url: "https://doi.org/10.1016/j.socscimed.2015.11.037" },
      { title: "Barnes et al. (2011), Organizational Behavior and Human Decision Processes: sleep and self-control", url: "https://doi.org/10.1016/j.obhdp.2011.01.009" },
    ],
    body: [
      "## What's known",
      "People who use their phones in bed tend to go to sleep later and sleep worse. Separately, some studies found that people who slept less made more impulsive choices the next day.",
      "## What isn't",
      "Nobody has shown that screens cause urges in a straight line. Tired people may reach for their phones because they're tired, and self-control research has had trouble repeating some well-known results. So the evidence is mixed.",
      "## Why it's still worth trying",
      "Many people find their hardest moments are late at night, alone, with a phone in hand. Changing that setup costs nothing: charge the phone outside the bedroom, set a bedtime reminder, and use Night watch for a gentle check-in at 23:00.",
    ],
  },
  {
    slug: "exercise-as-an-urge-tool",
    title: "Exercise as an urge tool",
    summary: "Short bursts of exercise reduce cravings in smoking research. Here's what transfers, and what hasn't been tested.",
    evidence: "moderate",
    topic: "Cravings",
    readMinutes: 4,
    reviewedBy: "",
    reviewedOn: "",
    supports:
      "A systematic review found that short bouts of exercise, such as brisk walking, reduced cigarette cravings and withdrawal symptoms in the short term.",
    doesNotSupport: "That exercise has been tested for this habit, or that it changes anything about your body in a way that matters here.",
    sources: [
      {
        title: "Taylor, Ussher and Faulkner (2007), Addiction: acute effects of exercise on cigarette cravings, a systematic review",
        url: "https://doi.org/10.1111/j.1360-0443.2006.01739.x",
      },
    ],
    body: [
      "## The finding",
      "When smokers did a short bout of exercise, often just ten to fifteen minutes of brisk walking, their cravings dropped compared with sitting still. The effect lasted a while afterwards.",
      "## Why it might help here",
      "Moving changes your setting, uses your attention and breaks the loop of sitting with an urge. Those reasons aren't specific to smoking.",
      "## Try it",
      "When an urge starts, stand up and do twenty squats, walk around the block, or take the stairs. If the urge is still strong afterwards, start a Ride it out game.",
    ],
  },
  {
    slug: "compulsive-sexual-behaviour-help",
    title: "Compulsive sexual behaviour: when to get help",
    summary: "The WHO recognises compulsive sexual behaviour disorder. Here are the signs that it's worth talking to a professional.",
    evidence: "strong",
    topic: "Getting help",
    readMinutes: 5,
    reviewedBy: "",
    reviewedOn: "",
    supports:
      "ICD-11, the WHO's classification of diseases, includes compulsive sexual behaviour disorder (6C72): a persistent pattern of failing to control intense, repetitive sexual urges, causing marked distress or problems in life.",
    doesNotSupport: "Diagnosing yourself from an app or an article. Only a qualified professional can assess this.",
    sources: [
      { title: "Kraus et al. (2018), World Psychiatry: compulsive sexual behaviour disorder in the ICD-11", url: "https://doi.org/10.1002/wps.20499" },
      { title: "Tele-MANAS, India's free mental health helpline", url: "https://ehrc.iiitb.ac.in/project/tele-manas" },
    ],
    body: [
      "## What the diagnosis means",
      "Compulsive sexual behaviour disorder is about a pattern, not a single habit. It describes repeated sexual behaviour that someone can't control despite trying, that takes over other parts of life, and that continues despite harm or little satisfaction, over months.",
      "Feeling conflicted about a habit because of your values is different, and is not by itself a diagnosis.",
      "## Signs it's worth talking to someone",
      "Consider getting help if you've tried many times to change and can't, if it's affecting your work, relationships or money, if you feel distressed most days, or if you're using it to cope with things that feel unbearable.",
      "## Who to talk to",
      "A doctor, a counsellor, a psychologist or a sex therapist can help. In India, Tele-MANAS is free and open 24/7 at 14416. Elsewhere, the support page lists services by country. If you're ever in danger, call your local emergency number.",
    ],
  },
  {
    slug: "is-porn-addiction-real",
    title: "Is \"porn addiction\" real? What clinicians actually say",
    summary: "Researchers disagree about the addiction label. What they agree on is that distress and loss of control are what matter.",
    evidence: "mixed",
    topic: "Getting help",
    readMinutes: 6,
    reviewedBy: "",
    reviewedOn: "",
    supports:
      "Clinicians are divided between an addiction model and a compulsivity model. Research on moral incongruence suggests that some distress comes from a clash between behaviour and personal values.",
    doesNotSupport: "A settled diagnosis that applies to everyone who watches porn, or the idea that the label decides whether you deserve help.",
    sources: [
      { title: "Grubbs et al. (2019), Archives of Sexual Behavior: moral incongruence and pornography use", url: "https://doi.org/10.1007/s10508-018-1248-x" },
      { title: "Kraus et al. (2018), World Psychiatry: compulsive sexual behaviour disorder in the ICD-11", url: "https://doi.org/10.1002/wps.20499" },
    ],
    body: [
      "## The debate",
      "Some researchers see problematic porn use as a behavioural addiction, like gambling. Others see it as a compulsivity or impulse-control problem. The WHO chose a middle path, compulsive sexual behaviour disorder, rather than an addiction label.",
      "## Values matter too",
      "Studies on moral incongruence found that people whose use clashes with their values often feel more distressed and more \"addicted\", even at similar levels of use. That doesn't make the distress less real; it suggests what might help.",
      "## Why the label matters less than you'd think",
      "Whatever the name, the useful questions are the same: is it causing you distress, can you control it when you try, and is it getting in the way of your life? If the answers worry you, talking to a professional is a reasonable next step.",
    ],
  },
  {
    slug: "superpowers-aura-attraction",
    title: "Superpowers, aura and attraction: the claims checked",
    summary: "Online challenge culture promises dramatic changes. None of them is supported by research. Here's where they come from.",
    evidence: "myth",
    topic: "Myths",
    readMinutes: 4,
    reviewedBy: "",
    reviewedOn: "",
    supports:
      "Nothing. The claims trace back to forum posts, personal stories and one retracted 2003 hormone study, not to research on abstinence and attraction.",
    doesNotSupport: "Any claim that abstinence gives \"superpowers\", an \"aura\", \"magnetism\" or makes anyone \"more attractive\".",
    sources: [
      { title: "Jiang et al. (2003), Journal of Zhejiang University Science (retracted)", url: "https://doi.org/10.1631/jzus.2003.0236" },
      { title: "Snopes: does abstinence raise testosterone 45 percent?", url: "https://www.snopes.com/fact-check/increase-testosterone-45-percent/" },
    ],
    body: [
      "## The claims",
      "Myths being checked: \"After a few weeks you get superpowers.\" \"People can sense your aura.\" \"Abstaining gives you magnetism and makes you more attractive.\"",
      "## Where they come from",
      "These ideas spread through forums and videos, usually as personal stories. When they cite anything, it's often the retracted 2003 study about a short hormone change on day 7, which said nothing about attraction.",
      "## What people may actually notice",
      "Some people say they have more time, more focus or better evenings during a challenge. Those are personal experiences, and they usually have ordinary explanations: fewer late nights, less scrolling, and the satisfaction of keeping a promise to yourself. That's a good enough reason on its own.",
    ],
  },
  {
    slug: "accountability-with-friends",
    title: "Doing a challenge with friends: does accountability help?",
    summary: "Commitment devices and social support help some people. Public pressure can backfire into shame. Here's how pacts are built.",
    evidence: "mixed",
    topic: "Accountability",
    readMinutes: 5,
    reviewedBy: "",
    reviewedOn: "",
    supports:
      "Commitment devices helped a minority of people in field trials, and small first commitments can make larger ones more likely. Support from people you trust is widely used in behaviour change.",
    doesNotSupport: "That public pressure or shame helps. Pressure can push people to hide resets or give up after one.",
    sources: [
      { title: "Giné, Karlan and Zinman (2010): commitment contracts for smoking cessation (J-PAL summary)", url: "https://www.povertyactionlab.org/print/pdf/node/1468" },
      { title: "CARES trial registry entry", url: "https://www.socialscienceregistry.org/trials/1129" },
      {
        title: "Freedman and Fraser (1966): compliance without pressure, the foot-in-the-door technique",
        url: "https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Influence_Compliance/Freedman_Fraser_Foot-in-the-door.pdf",
      },
    ],
    body: [
      "## What helps",
      "Making a commitment, especially a small one you actually act on, makes follow-through more likely for some people. In a field trial, smokers who could put their own money behind quitting were more likely to pass a test months later, though most still found it hard.",
      "## What backfires",
      "Shame and public pressure don't have the same support. When a slip feels public and humiliating, people hide it or quit altogether. That's the opposite of what helps.",
      "## How pacts are designed",
      "Pacts show handles and numbers, never the reason or time of a reset. Nudges are five kind messages, nothing else. There's no money between friends, ever. If a pact stops feeling supportive, you can mute someone or leave without anyone being told why.",
    ],
  },
];

function showDrafts(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_LEARN_SHOW_DRAFTS === "true";
}

export const ALL_ARTICLES: Article[] = RAW.map((raw) => {
  const a = articleSchema.parse(raw);
  const draft = !a.reviewedBy.trim();
  if (!draft && !/^\d{4}-\d{2}-\d{2}$/.test(a.reviewedOn)) throw new Error(`learn:${a.slug}: reviewed_on must be a date`);
  return { ...a, draft };
});

export function publishedArticles(): Article[] {
  const drafts = showDrafts();
  return ALL_ARTICLES.filter((a) => drafts || !a.draft);
}

export function getArticle(slug: string): Article | null {
  return publishedArticles().find((a) => a.slug === slug) ?? null;
}

export const GRADE_LABEL: Record<Grade, string> = { strong: "Strong", moderate: "Moderate", mixed: "Mixed", myth: "Myth" };
