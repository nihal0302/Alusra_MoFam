// All homepage copy, verbatim from the saved alusra.gov.ae/en/ page (23 Oct 2026).
// Views read from here only, so copy can change without touching components.
// `image` values are slot labels until the original assets are supplied
// (see docs/STATUS.md); swap them for imports from src/assets/ when they land.

const SERVICE_BASE = 'https://www.alusra.gov.ae/en/services/';
const REGISTER_URL =
  'https://portal-eservices.alusra.gov.ae/s/64f519d6-838f-419b-aa76-17880b6e0c3d';

export const home = {
  meta: { title: 'Alusra - Ministry of Family' },

  nav: {
    logo: { label: 'Alusra logo', file: 'alusra.png' },
    uaeLogo: { label: 'UAE logo', file: 'uae-alusra.png' },
    language: { full: 'عربي', short: 'ع', href: 'https://www.alusra.gov.ae/ar/' },
  },

  banner: {
    label: 'Registration announcement',
    text: 'We invite parents wishing to register their children to submit registration applications during the specified period and complete the necessary requirements according to the approved procedures.',
    cta: { label: 'Register', href: REGISTER_URL, external: true },
  },

  hero: {
    label: 'Homepage carousel',
    autoplay: false, // the prototype keeps the hero still; set true to rotate every slideDurationMs
    slideDurationMs: 6000,
    slides: [
      {
        id: 'pod-registration',
        accent: 'Registration Now Open',
        title: ' for Government People of Determination Centers',
        description:
          'We invite parents wishing to register their children in government early intervention centers to submit registration applications during the specified period and complete the required requirements according to the approved procedures.',
        dates: 'For the 2027-2026 academic year, starting from 24 August 2026 until 14 December 2026',
        cta: { label: 'Register', href: REGISTER_URL, external: true },
        image: { file: 'Our Partnership hero-02.webp', alt: 'Registration in Government People of Determination Centers', fit: 'cover' },
      },
      {
        id: 'empowerment',
        title: 'Empowering Every Emirati Family',
        description:
          'At the Ministry of Family, we work to strengthen, support, and sustain family life across the UAE.',
        mission: {
          title: 'Our mission',
          text: ' is to empower individuals, nurture families, and build a society where every home thrives with stability, compassion, and opportunity.',
        },
        image: { file: 'Our Partnership hero-01.png', alt: 'Family photo', fit: 'contain' },
      },
      {
        id: 'cdsc',
        title: 'Child Digital Safety Council',
        label: 'Cabinet Resolution Regarding',
        description: "Regulating Children's Access to Social Media Platforms",
        cta: { label: 'Learn more', href: 'https://www.alusra.gov.ae/en/news/cabinet-children-social-media-access/' },
        image: { file: '1.png', alt: 'Child Digital Safety Council', fit: 'contain' },
        mascot: { file: 'cat.svg' },
      },
    ],
  },

  about: {
    title: 'About the Ministry',
    paragraphs: [
      'The Ministry of Family delivers a wide range of services designed to strengthen family bonds, safeguard wellbeing, and empower every individual to thrive.',
      'Each service reflects our mission to build a cohesive, compassionate, and resilient society rooted in Emirati values.',
    ],
    image: { file: 'about.png', alt: 'Family' },
    decoration: { file: 'about-background.svg' },
  },

  services: {
    title: 'What we do',
    description:
      'We’re dedicated to building strong families and inclusive communities through meaningful programs and services.',
    cta: 'Start service →',
    items: [
      {
        slug: 'marriage-grant',
        title: 'Marriage Grant Application',
        description:
          'A package of social services aimed at building stable and cohesive families equipped with the knowledge and skills needed to establish positive and sustainable marital relationships. In addition, couples receive a financial grant of seventy thousand dirhams to support them in starting a happy and stable life.',
      },
      {
        slug: 'to-whom-it-may-concern-certificate',
        title: 'Issuance of a To Whom It May Concern Certificate',
        description:
          'A service that enables individuals to request a "To Whom It May Concern" certificate from the Ministry, indicating the status of their Marriage Grant application or their beneficiary status, based on the records available with the Ministry.',
      },
      {
        slug: 'determination-card',
        title: 'Issuance of the People of Determination Card',
        description:
          'The People of Determination Card is an identity card issued by the Ministry of Family to persons with disabilities. It serves as an official document confirming that the holder is a person with a disability, ensuring the rights granted under Federal Law No. (29) of 2006 on Persons with Disabilities, as well as the regulations and decisions issued in its implementation.',
      },
      {
        slug: 'family-counseling-centers-licensing',
        title: 'Application for a license for non-governmental family counseling centers',
        description:
          'A service that individuals and companies apply for to obtain a license to conduct family counseling activities aimed at improving the quality of family life and ensuring its stability, including family and social counseling, educational counseling, workshops, therapeutic and training plans, and matchmaking services.',
      },
      {
        slug: 'family-counseling-centers-ad-publication',
        title: 'Request to publish an advertisement for non-governmental family counseling centers',
        description:
          'Granting approval to publish promotional advertisements for the services and programs offered by non-governmental Family Counseling Centers, ensuring alignment with their objectives, services, and programs.',
      },
      {
        slug: 'pod-card-replacement',
        title: 'Request for Issuance of a Replacement for a Lost or Damaged People of Determination Card',
        description:
          'Issuance of a replacement for a lost or damaged People of Determination Card to ensure continued access to services and facilities across various entities and sectors in the UAE.',
      },
      {
        slug: 'disability-type-change',
        title: 'Disability Type Change',
        description:
          "A service that enables People of Determination to request a change to the type of disability registered in their records with the Ministry, based on approved medical documents and reports reflecting the applicant's current condition.",
      },
      {
        slug: 'non-government-pod-institutions-licensing',
        title: 'Application for Licensing Non-Governmental People of Determination Institutions',
        description:
          'Licensing of Non-Governmental Institutions to Conduct Activities and Provide Services for People of Determination, including early intervention, integrated service, vocational rehabilitation, life skills, individual therapeutic rehabilitation sessions, and educational and psychological assessment...',
      },
      {
        slug: 'non-government-pod-institutions-license-renewal',
        title: 'Application for Renewal of Non-Governmental People of Determination Rehabilitation Institution License',
        description:
          'Updating and renewing the application to legally and regularly continue the activities and services of People of Determination Care and Rehabilitation Centers.',
      },
      {
        slug: 'mass-wedding-participation',
        title: 'Application to Participate in the Mass Wedding',
        description:
          'A social model derived from Emirati heritage in organizing mass wedding ceremonies, aligned with the authentic values and principles of society that reflect solidarity and social cohesion, enabling couples to begin a stable married life and build cohesive and sustainable families.',
      },
      {
        slug: 'family-counseling-centers-license-renewal',
        title: 'Application for renewal of license for non-governmental family counseling centers',
        description:
          'Updating and renewing the application to legally and regularly continue the activities and services of the Private Family Counseling Center.',
      },
      {
        slug: 'pod-care-rehab-centers-registration',
        title: 'Registration in People of Determination Care and Rehabilitation Centers',
        description:
          "A service that enables People of Determination to register at the Ministry's Centers for the Care and Rehabilitation of People of Determination upon reaching the age of five, with the aim of accessing specialized care and rehabilitation services tailored to their individual needs and type of disability, subject to an assessment of their condition and fulfillment of the approved admission requirements and criteria.",
      },
      {
        slug: 'early-intervention-centers-registration',
        title: 'Registration in People of Determination Care and Rehabilitation Centers and Early Intervention Units Centers',
        description:
          'This service allows the registration of children with developmental delays and those at risk of disability (People of Determination) to enroll in Early Intervention Centers and Units during early childhood. It also enables the registration of People of Determination in rehabilitation centers upon reaching the age of 4 to receive a range of rehabilitation and educational services, in addition to support and guidance programs provided by a specialized team to empower them and their families, enhance their skills, integrate them into society, and improve their quality of life',
      },
    ].map((s) => ({ ...s, href: SERVICE_BASE + s.slug + '/' })),
  },

  news: {
    title: ['Latest News &', 'Updates'],
    items: [
      {
        date: '19 June 2026',
        title: "Cabinet Resolution Regarding Regulating Children's Access to Social Media Platform",
        description:
          "This resolution establishes a regulatory framework for children's access to social media platforms in the UAE. It defines which platforms fall within scope, sets the minimum age for personal accounts, introduces age-verification requirements, and outlines the responsibilities of platforms, caregivers, and relevant authorities.",
        href: 'https://www.alusra.gov.ae/en/news/cabinet-children-social-media-access/',
        image: { file: 'img.png', alt: 'News' },
      },
      {
        date: '20 June 2025',
        title: 'Ministry of Family Celebrates Graduation of 50 Students from Rehabilitation Centers for People of Determination Across the UAE',
        description:
          'Her Excellency Sana Suhail, Minister of Family, honoured 50 graduates from disability care and rehabilitation centres for people of determination...',
        image: { file: 'news1.jpeg', alt: 'News' },
      },
      {
        date: '1 July 2025',
        title: 'UAE and Hungary strengthen partnership to support families and drive social innovation',
        description:
          'The United Arab Emirates and the Republic of Hungary have strengthened their bilateral relationship with a cooperation agreement signed by the UAE...',
        image: { file: 'news2.jpeg', alt: 'News' },
      },
    ],
  },

  careers: {
    title: 'Shape Your Future with the Ministry of Family',
    paragraphs: [
      'At the Ministry of Family, our people are the heart of our success. We believe in nurturing talent, empowering growth, and creating meaningful work that transforms lives',
      'Join us to build a career that contributes to a greater purpose, strengthening the foundation of family life across the UAE',
    ],
    image: { file: 'family-shape.png', alt: 'Ministry of Family' },
    birds: { file: 'bird.svg' },
  },

  contact: {
    hours: {
      title: 'Office Working Hours',
      rows: [
        { label: 'Monday to Thursday:', value: '7:30 AM - 3:30 PM' },
        { label: 'Friday:', value: '7:30 AM - 12:00 PM' },
      ],
      note: 'Our offices are closed on Saturday and Sunday',
    },
    reach: {
      title: 'How to Reach Us',
      intro: 'Please use the following contact points for general communication:',
      links: [
        { label: 'General inquiries', email: 'info@alusra.gov.ae' },
        { label: 'Media and press inquiries', email: 'media@alusra.gov.ae' },
      ],
    },
  },

  footer: {
    logos: [
      { label: 'Alusra logo', file: 'alusra-white.png' },
      { label: 'UAE logo', file: 'uae-alusra-white.png' },
    ],
    social: [
      { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/alusrauae?igsh=ZWhqdG1yaWc1N3hi' },
      { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61577832665205' },
      { id: 'x', label: 'X', href: 'https://x.com/alusrauae' },
      { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/alusrauae/' },
    ],
    contactTitle: 'Contact Us',
    contact: [
      { icon: 'pin', text: 'Dubai, United Arab Emirates' },
      { icon: 'mail', text: 'info@alusra.gov.ae', href: 'mailto:info@alusra.gov.ae' },
      { icon: 'briefcase', text: 'careers@alusra.gov.ae', href: 'mailto:careers@alusra.gov.ae' },
      { icon: 'phone', text: '800 114', href: 'tel:800114', ltr: true },
      {
        icon: 'clock',
        lines: [
          'Working hours',
          'Monday to Thursday: 7:30 AM – 3:30 PM',
          'Friday: 7:30 AM – 12:00 PM',
          'Saturday and Sunday: Official holiday',
        ],
      },
    ],
  },
};
