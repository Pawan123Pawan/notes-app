import type { Metadata } from 'next'
import Image from 'next/image'
import { getPayload } from 'payload'
import {
  ButtonLink,
  PlainButtonLink,
  SoftButtonLink,
} from '@/components/website/elements/button'
import { ChevronIcon } from '@/components/website/icons/chevron-icon'
import { Main } from '@/components/website/elements/main'
import { CallToActionSimpleCentered } from '@/components/website/sections/call-to-action-simple-centered'
import {
  Faq,
  FAQsAccordion,
} from '@/components/website/sections/faqs-accordion'
import { PlanComparisonTable } from '@/components/website/sections/plan-comparison-table'
import {
  Plan,
  PricingMultiTier,
} from '@/components/website/sections/pricing-multi-tier'
import { TestimonialTwoColumnWithLargePhoto } from '@/components/website/sections/testimonial-two-column-with-large-photo'
import config from '@payload-config'

type PricingData = {
  metadataTitle: string
  metadataDescription: string
  heroHeadline: string
  heroSubheadline: string
  plans: Array<{
    name: string
    badge?: string
    monthlyPrice: string
    yearlyPrice: string
    periodLabel: string
    subheadline: string
    features: Array<{ text: string }>
    ctaLabel: string
    ctaHref: string
    ctaVariant: 'primary' | 'soft'
  }>
  comparisonSections: Array<{
    title: string
    features: Array<{
      name: string
      starterIncluded: boolean
      starterValue?: string
      growthIncluded: boolean
      growthValue?: string
      proIncluded: boolean
      proValue?: string
    }>
  }>
  testimonialQuote: string
  testimonialName: string
  testimonialByline: string
  testimonialImageUrl: string
  testimonialImageAlt: string
  faqs: Array<{ question: string; answer: string }>
  ctaHeadline: string
  ctaSubheadline: string
  ctaPrimaryLabel: string
  ctaPrimaryHref: string
  ctaSecondaryLabel: string
  ctaSecondaryHref: string
}

function toCellValue(included: boolean, value?: string) {
  if (value && value.trim().length > 0) return value
  return included
}

async function getPricingContent() {
  const payload = await getPayload({ config })
  const pricing = await payload.findGlobal({
    slug: 'pricing',
  })

  return pricing as PricingData
}

export async function generateMetadata(): Promise<Metadata> {
  const pricing = await getPricingContent()

  return {
    title: pricing.metadataTitle,
    description: pricing.metadataDescription,
  }
}

export default async function PricingPage() {
  const pricing = await getPricingContent()

  return (
    <Main>
      <PricingMultiTier
        id="pricing"
        eyebrow="Pricing"
        headline={pricing.heroHeadline}
        subheadline={<p>{pricing.heroSubheadline}</p>}
        plans={
          <>
            {pricing.plans.map((plan) => (
              <Plan
                key={plan.name}
                name={plan.name}
                price={plan.monthlyPrice}
                period={plan.periodLabel}
                subheadline={<p>{plan.subheadline}</p>}
                badge={plan.badge}
                features={plan.features.map((feature) => feature.text)}
                cta={
                  plan.ctaVariant === 'primary' ? (
                    <ButtonLink href={plan.ctaHref} size="lg">
                      {plan.ctaLabel}
                    </ButtonLink>
                  ) : (
                    <SoftButtonLink href={plan.ctaHref} size="lg">
                      {plan.ctaLabel}
                    </SoftButtonLink>
                  )
                }
              />
            ))}
          </>
        }
      />

      <PlanComparisonTable
        id="comparison"
        plans={pricing.plans.map((plan) => plan.name)}
        features={pricing.comparisonSections.map((section) => ({
          title: section.title,
          features: section.features.map((feature) => ({
            name: feature.name,
            value: {
              [pricing.plans[0]?.name || 'Starter']: toCellValue(
                feature.starterIncluded,
                feature.starterValue,
              ),
              [pricing.plans[1]?.name || 'Growth']: toCellValue(
                feature.growthIncluded,
                feature.growthValue,
              ),
              [pricing.plans[2]?.name || 'Scale']: toCellValue(
                feature.proIncluded,
                feature.proValue,
              ),
            },
          })),
        }))}
      />

      <TestimonialTwoColumnWithLargePhoto
        id="testimonial"
        quote={<p>{pricing.testimonialQuote}</p>}
        img={
          <Image
            src={pricing.testimonialImageUrl}
            alt={pricing.testimonialImageAlt}
            className="not-dark:bg-white/75 dark:bg-black/75"
            width={1400}
            height={1000}
          />
        }
        name={pricing.testimonialName}
        byline={pricing.testimonialByline}
      />

      <FAQsAccordion id="faqs" headline="Questions and answers">
        {pricing.faqs.map((faq, index) => (
          <Faq
            key={faq.question}
            id={`faq-${index + 1}`}
            question={faq.question}
            answer={faq.answer}
          />
        ))}
      </FAQsAccordion>

      <CallToActionSimpleCentered
        id="call-to-action"
        headline={pricing.ctaHeadline}
        subheadline={<p>{pricing.ctaSubheadline}</p>}
        cta={
          <div className="flex items-center gap-4">
            <ButtonLink href={pricing.ctaPrimaryHref} size="lg">
              {pricing.ctaPrimaryLabel}
            </ButtonLink>

            <PlainButtonLink href={pricing.ctaSecondaryHref} size="lg">
              {pricing.ctaSecondaryLabel} <ChevronIcon />
            </PlainButtonLink>
          </div>
        }
      />
    </Main>
  )
}
