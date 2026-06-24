import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const faqsSeed = [
  {
    question: 'What is included in this microSaaS starter?',
    answer:
      'You get a production-ready foundation with auth, typed APIs, database setup, workspace patterns, theming, and reusable marketing/app UI sections.',
  },
  {
    question: 'Can I replace the landing page content from a CMS later?',
    answer:
      'Yes. Sections are already structured around arrays and reusable components, so swapping hardcoded data for CMS-driven content is straightforward.',
  },
  {
    question: 'Is this starter suitable for multi-tenant products?',
    answer:
      'Yes. The project is organized for workspace-oriented product development and can be extended with role and organization features as your app grows.',
  },
  {
    question: 'How quickly can I launch with this template?',
    answer:
      'Most teams can start building product features on day one because core infrastructure and UI foundations are already integrated.',
  },
]

async function seedHomepageFaqs() {
  const payload = await getPayload({ config })

  const existingFaqs = await payload.find({
    collection: 'faqs',
    limit: 100,
  })

  await Promise.all(
    existingFaqs.docs.map((doc) =>
      payload.delete({
        collection: 'faqs',
        id: doc.id,
      }),
    ),
  )

  await Promise.all(
    faqsSeed.map((faq, index) =>
      payload.create({
        collection: 'faqs',
        data: {
          ...faq,
          order: index + 1,
        },
      }),
    ),
  )

  payload.logger.info('Homepage FAQs seed completed.')
}

seedHomepageFaqs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
