/**
 * GroChain design system — single source of truth for typography, spacing,
 * layout, and responsive rhythm. Aligned with brand guidelines:
 * - DM Sans: body, UI, H3+
 * - Fraunces: H1/H2 display headings only
 * - Major-third scale with mobile-first breakpoints
 */

/** Typography class strings — compose with cn() */
export const textStyles = {
  /** Hero / landing H1 */
  displayHero:
    "font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.08]",
  /** Dashboard page H1, auth titles */
  displayPage:
    "font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl",
  /** Marketing section H2 */
  headingSection:
    "font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl",
  /** CTA / emphasis H2 on colored backgrounds */
  headingSectionLg:
    "font-serif text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl",
  /** Card titles, step titles, H3 */
  headingCard: "font-serif text-xl font-semibold tracking-tight text-foreground",
  /** Subsection H4, sidebar groups */
  headingSub: "text-lg font-semibold tracking-tight text-foreground",
  /** Dashboard top bar title */
  headingBar: "text-sm font-semibold tracking-tight sm:text-base lg:text-lg",
  /** Lead / intro paragraphs */
  lead: "text-lg leading-relaxed text-muted-foreground sm:text-xl",
  /** Default body */
  body: "text-base leading-relaxed text-foreground",
  /** Secondary body */
  bodySm: "text-sm leading-relaxed text-muted-foreground",
  /** Muted helper text */
  caption: "text-xs leading-normal text-muted-foreground",
  /** Badge / overline labels */
  overline: "text-[0.6875rem] font-semibold uppercase tracking-widest",
  /** Stat numbers */
  stat: "font-serif text-2xl font-bold tracking-tight text-primary sm:text-3xl",
  /** Product price emphasis */
  price: "text-xl font-bold text-success sm:text-2xl",
  /** Dashboard card section title */
  cardTitle: "text-base font-semibold tracking-tight sm:text-lg",
  /** Smaller dashboard card title */
  cardTitleSm: "text-sm font-semibold tracking-tight sm:text-base",
} as const

/** Dashboard layout patterns */
export const dashboard = {
  pageStack: "space-y-6 sm:space-y-8",
  statsGrid:
    "grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  statsGrid4: "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4",
  contentGrid: "grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3",
  contentMain: "space-y-4 sm:space-y-6 lg:col-span-2",
  contentSide: "space-y-4 sm:space-y-6",
  metricValue: "font-serif text-2xl font-bold tracking-tight sm:text-3xl",
  metricLabel: "text-xs text-muted-foreground sm:text-sm",
} as const

/** Layout & spacing — compose with cn() */
export const layout = {
  /** Standard horizontal page padding */
  containerX: "px-4 sm:px-6 lg:px-8",
  /** Marketing / public pages */
  container: "container mx-auto px-4 sm:px-6 lg:px-8",
  /** Dashboard main content area */
  containerDashboard: "container mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8",
  /** Narrow forms (auth, settings) */
  containerNarrow: "mx-auto w-full max-w-md",
  /** Standard section vertical rhythm */
  sectionY: "py-16 sm:py-20 lg:py-24",
  /** Hero section — taller vertical rhythm */
  sectionHeroY: "py-20 sm:py-28 lg:py-36",
  /** Compact strip (stats bar) */
  sectionCompactY: "py-10 sm:py-12",
  /** Centered section intro block */
  sectionIntro: "mx-auto mb-14 max-w-3xl space-y-4 text-center sm:mb-16",
  /** Two-column marketing grid */
  gridSplit: "grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20",
  /** Standard card/feature grid */
  gridCards: "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8",
  /** Three-column steps */
  gridSteps: "grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8",
  /** Stats strip */
  gridStats: "grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8",
  /** Vertical stack spacing */
  stackSm: "space-y-4",
  stackMd: "space-y-6",
  stackLg: "space-y-8",
  /** Horizontal button groups */
  actionsRow: "flex flex-col flex-wrap gap-3 sm:flex-row sm:gap-4",
  /** App header height */
  headerHeight: "h-14 sm:h-16",
  /** Marketing CTA button sizing */
  btnMarketing: "h-11 px-6 text-base sm:h-12",
} as const

/** Aspect ratios for media blocks */
export const ratio = {
  hero: "aspect-[4/3]",
  card: "aspect-video",
  square: "aspect-square",
} as const

/** Z-index scale */
export const zIndex = {
  base: "z-0",
  sticky: "z-10",
  header: "z-50",
  skipLink: "z-[100]",
} as const

export type TypographyToken = keyof typeof textStyles
export type LayoutToken = keyof typeof layout
