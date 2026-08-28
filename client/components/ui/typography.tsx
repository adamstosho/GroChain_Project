import * as React from "react"
import { cn } from "@/lib/utils"
import { textStyles, layout } from "@/lib/design-system"

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

const displayVariants = {
  hero: textStyles.displayHero,
  page: textStyles.displayPage,
  section: textStyles.headingSection,
  sectionLg: textStyles.headingSectionLg,
  card: textStyles.headingCard,
  sub: textStyles.headingSub,
  bar: textStyles.headingBar,
} as const

export interface DisplayProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel
  variant?: keyof typeof displayVariants
}

export function Display({
  as: Tag = "h1",
  variant = "page",
  className,
  ...props
}: DisplayProps) {
  return <Tag className={cn(displayVariants[variant], className)} {...props} />
}

const textVariants = {
  lead: textStyles.lead,
  body: textStyles.body,
  sm: textStyles.bodySm,
  caption: textStyles.caption,
  overline: textStyles.overline,
  stat: textStyles.stat,
  price: textStyles.price,
} as const

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: "p" | "span" | "div"
  variant?: keyof typeof textVariants
}

export function Text({
  as: Tag = "p",
  variant = "body",
  className,
  ...props
}: TextProps) {
  return <Tag className={cn(textVariants[variant], className)} {...props} />
}

export interface SectionHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  badge?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  align?: "center" | "left"
  titleVariant?: keyof typeof displayVariants
}

export function SectionHeader({
  badge,
  title,
  description,
  align = "center",
  titleVariant = "section",
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        layout.sectionIntro,
        align === "left" && "text-left",
        className
      )}
      {...props}
    >
      {badge}
      <Display as="h2" variant={titleVariant}>
        {title}
      </Display>
      {description ? (
        typeof description === "string" ? (
          <Text variant="lead">{description}</Text>
        ) : (
          description
        )
      ) : null}
    </div>
  )
}
