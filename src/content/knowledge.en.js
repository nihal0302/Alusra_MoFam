// Mira's knowledge base. Everything here comes from the Ministry's public site (alusra.gov.ae/en), read into
// knowledge/site.json by `npm run knowledge`. Service facts (fees, times, terms, documents, apply links) are used as
// published; the wording below only frames them. Matching lives in src/lib/knowledge.js.
//
// Not included on purpose: placeholder content on the site (hotline "800-XXX", "Torem ipsum" text, "#" links,
// the media newsroom) and email addresses that look mistyped (".gov.as"). Mira says so and points to 800 114 instead.
import site from './knowledge/site.json' with { type: 'json' };

const ORIGIN = site.origin;
const REGISTER_URL = 'https://portal-eservices.alusra.gov.ae/s/64f519d6-838f-419b-aa76-17880b6e0c3d';

export const knowledgeSource = { origin: ORIGIN, scrapedAt: site.scrapedAt };

export const knowledgeCopy = {
  tool: { working: 'Searching Ministry information…', done: 'Source · alusra.gov.ae' },
  // A short, positive opener on every reply; picked by the question so the same question always gets the same one.
  leads: ['Happy to help with that.', 'Thank you for your question.', 'Good question.', 'Glad you asked.'],
  viewService: 'View service page',
  applyOnline: 'Apply online',
  readMore: 'Read more',
  suggestionsTitle: 'You might also ask',
  // Asked for fees, documents and so on without saying which service.
  applyInChat: {
    primary: 'You can apply right here in the chat, and I will guide you step by step.',
    secondary: 'I will first ask a few quick questions to check that you are eligible. You can review everything before it is submitted.',
  },
  clarify: {
    primary: 'Which service do you mean? Tell me, and I will share its fees, documents, conditions and timing.',
    title: 'Popular services',
    items: ['Tell me about the People of Determination card', 'Tell me about the marriage grant', 'Replace a lost or damaged POD card', 'Tell me about the mass wedding', 'What services do you offer?'],
  },
  none: {
    lead: 'Thank you for asking.',
    primary: 'I could not find that in the Ministry’s published information, so I would rather not guess.',
    secondary: 'You can rephrase the question, or reach the team directly.',
  },
  // Replies to greetings and thanks, so everyday phrases are not treated as unanswered questions.
  smalltalk: [
    { id: 'greeting', test: /^(hi|hello|hey|good (morning|afternoon|evening)|salam|assalam[a-z ]*|marhaba)\b[\s!.,]*$/i, lead: 'Hello, and welcome.', primary: 'I’m Mira, the Ministry of Family’s virtual assistant. You can ask me about the Ministry’s services, what to prepare, fees, or how to apply.' },
    { id: 'thanks', test: /^(thanks|thank you|thank u|thx|shukran|much appreciated)\b[\s!.,a-z]*$/i, lead: 'You’re most welcome.', primary: 'If there is anything else about the Ministry’s services, I’m glad to help.' },
    { id: 'bye', test: /^(bye|goodbye|good bye|see you|that'?s all|no thanks|nothing else)\b[\s!.,a-z]*$/i, lead: 'Thank you for visiting.', primary: 'I’m here whenever you have another question.' },
    { id: 'who', test: /\b(who are you|what are you|are you (a )?(bot|robot|human|real|ai)|your name)\b/i, lead: 'Thank you for asking.', primary: 'I’m Mira, the Ministry of Family’s virtual assistant. I give general guidance from the Ministry’s published information. A person can help with anything I can’t answer.' },
  ],
};

// How each service is recognised in a question. A signal is a group of words that must all appear (any ending, e.g.
// "renewing" matches "renew"); `w` says how specific it is. The best-scoring service wins.
export const serviceMeta = {
  'determination-card': {
    name: 'People of Determination card',
    short: 'the People of Determination card',
    card: true, // can also offer the guided eligibility check
    followUps: true, // POD card questions end with tappable follow-up questions
    inChat: true, // applying happens in this chat (eligibility check, then the application), so no external apply link
    signals: [
      { w: 4, all: ['pod', 'card'] }, { w: 4, all: ['determination', 'card'] }, { w: 4, all: ['disability', 'card'] },
      { w: 3, all: ['new', 'card'] }, { w: 3, all: ['issue', 'card'] }, { w: 3, all: ['get', 'card'] }, { w: 3, all: ['apply', 'card'] },
      { w: 3, all: ['card', 'issuance'] }, { w: 1, all: ['card'] }, { w: 1, all: ['disability'] },
    ],
  },
  'pod-card-replacement': {
    name: 'POD card replacement',
    short: 'a replacement People of Determination card',
    followUps: true,
    signals: [
      { w: 6, all: ['replace'] }, { w: 6, all: ['replacement'] }, { w: 5, all: ['lost'] }, { w: 5, all: ['damaged'] },
      { w: 5, all: ['duplicate'] }, { w: 5, all: ['broken'] }, { w: 5, all: ['stolen'] }, { w: 5, all: ['reissue'] },
    ],
  },
  'disability-type-change': {
    name: 'disability type change',
    short: 'changing the registered disability type',
    signals: [
      { w: 7, all: ['disability', 'type'] }, { w: 6, all: ['change', 'disability'] }, { w: 6, all: ['update', 'disability'] },
      { w: 5, all: ['type', 'change'] }, { w: 5, all: ['change', 'type'] }, { w: 4, all: ['type', 'disability', 'change'] },
    ],
  },
  'pod-care-rehab-centers-registration': {
    name: 'registration in care and rehabilitation centers',
    short: 'registering in a People of Determination care and rehabilitation center',
    signals: [
      { w: 6, all: ['care', 'rehabilitation'] }, { w: 5, all: ['rehabilitation', 'center'] }, { w: 5, all: ['rehabilitation', 'centre'] },
      { w: 5, all: ['register', 'rehabilitation'] }, { w: 3, all: ['rehabilitation'] }, { w: 3, all: ['rehab'] }, { w: 3, all: ['care', 'center'] }, { w: 3, all: ['care', 'centre'] }, { w: 2, all: ['autism'] }, { w: 2, all: ['pod', 'center'] }, { w: 2, all: ['pod', 'centre'] },
    ],
  },
  'early-intervention-centers-registration': {
    name: 'early intervention registration',
    short: 'registering a child in early intervention centers and units',
    signals: [
      { w: 7, all: ['early', 'intervention'] }, { w: 6, all: ['developmental', 'delay'] }, { w: 5, all: ['at', 'risk', 'disability'] },
      { w: 5, all: ['early', 'unit'] }, { w: 4, all: ['intervention'] }, { w: 3, all: ['register', 'child'] }, { w: 3, all: ['register', 'children'] },
    ],
  },
  'marriage-grant': {
    name: 'marriage grant',
    short: 'the marriage grant',
    signals: [
      { w: 7, all: ['marriage', 'grant'] }, { w: 6, all: ['wedding', 'grant'] }, { w: 5, all: ['grant'] }, { w: 5, all: ['70000'] },
      { w: 5, all: ['seventy', 'thousand'] }, { w: 4, all: ['edaad'] }, { w: 4, all: ['premarital'] }, { w: 3, all: ['newlywed'] }, { w: 5, all: ['groom'] }, { w: 5, all: ['bride'] }, { w: 3, all: ['marriage'] }, { w: 2, all: ['marry'] }, { w: 2, all: ['married'] },
    ],
  },
  'mass-wedding-participation': {
    name: 'mass wedding',
    short: 'taking part in the mass wedding',
    signals: [{ w: 8, all: ['mass', 'wedding'] }, { w: 6, all: ['mass', 'marriage'] }, { w: 5, all: ['group', 'wedding'] }, { w: 4, all: ['mass'] }, { w: 3, all: ['wedding'] }],
  },
  'to-whom-it-may-concern-certificate': {
    name: '"To Whom It May Concern" certificate',
    short: 'a "To Whom It May Concern" certificate',
    signals: [
      { w: 8, all: ['whom', 'concern'] }, { w: 7, all: ['to', 'whom', 'may', 'concern'] }, { w: 10, all: ['marriage', 'grant', 'certificate'] }, { w: 8, all: ['grant', 'status'] },
      { w: 6, all: ['beneficiary', 'status'] }, { w: 6, all: ['beneficiary', 'certificate'] }, { w: 5, all: ['certificate'] }, { w: 5, all: ['letter'] },
    ],
  },
  'family-counseling-centers-licensing': {
    name: 'family counseling center license',
    short: 'a license for a family counseling center',
    signals: [
      { w: 7, all: ['counseling', 'licens'] }, { w: 7, all: ['counselling', 'licens'] }, { w: 6, all: ['family', 'counseling', 'center'] }, { w: 6, all: ['family', 'counselling', 'centre'] },
      { w: 5, all: ['matchmaking'] }, { w: 5, all: ['marriage', 'bureau'] }, { w: 4, all: ['counseling', 'center'] }, { w: 4, all: ['counselling', 'centre'] }, { w: 4, all: ['counseling', 'centre'] }, { w: 4, all: ['counselling', 'center'] },
    ],
  },
  'family-counseling-centers-license-renewal': {
    name: 'family counseling center license renewal',
    short: 'renewing a family counseling center license',
    signals: [
      { w: 10, all: ['counseling', 'renew'] }, { w: 10, all: ['counselling', 'renew'] }, { w: 10, all: ['family', 'center', 'renew'] },
    ],
  },
  'family-counseling-centers-ad-publication': {
    name: 'family counseling center advertisement',
    short: 'publishing an advertisement for a family counseling center',
    signals: [
      { w: 8, all: ['advertisement'] }, { w: 8, all: ['advert'] }, { w: 8, all: ['advertising'] }, { w: 7, all: ['promotional'] }, { w: 6, all: ['publish', 'ad'] },
    ],
  },
  'non-government-pod-institutions-licensing': {
    name: 'POD institution license',
    short: 'a license for a non-governmental People of Determination institution',
    signals: [
      { w: 7, all: ['institution', 'licens'] }, { w: 7, all: ['pod', 'institution'] }, { w: 6, all: ['non', 'governmental', 'institution'] },
      { w: 6, all: ['open', 'rehabilitation', 'center', 'licens'] }, { w: 5, all: ['institution'] }, { w: 5, all: ['private', 'rehabilitation'] }, { w: 6, all: ['private', 'center'] }, { w: 6, all: ['open', 'center'] }, { w: 6, all: ['own', 'center'] }, { w: 4, all: ['vocational'] },
    ],
  },
  'non-government-pod-institutions-license-renewal': {
    name: 'POD institution license renewal',
    short: 'renewing a People of Determination institution license',
    signals: [{ w: 10, all: ['institution', 'renew'] }, { w: 10, all: ['rehabilitation', 'institution', 'renew'] }, { w: 10, all: ['pod', 'institution', 'renew'] }],
  },
};

const link = (label, href) => ({ label, href });
const page = (path) => `${ORIGIN}/en/${path}`;
const CONTACT = page('contact-us/');
const ABOUT = page('about-us/');
const BENEFICIARIES = page('beneficiaries/');
const HOME_NEWS = `${ORIGIN}/en/#news`;
const CALL = link('Call 800 114', 'tel:800114');

// General information. `questions` are example phrasings (used for matching); `keywords` add single words;
// `items` makes a checklist card under the answer.
export const topics = [
  {
    id: 'about',
    title: 'About the Ministry of Family',
    questions: ['what is the ministry of family', 'who is the ministry of family', 'what does the ministry do', 'about the ministry', 'what is al usra', 'tell me about alusra', 'what is mofam', 'what is the ministry responsible for'],
    keywords: ['ministry', 'family', 'alusra', 'usra', 'mandate', 'about', 'mofam'],
    primary: 'The Ministry of Family (Al Usra) works to build stable and cohesive families in the UAE.',
    secondary: 'Its mandate is to propose, develop and implement policies, strategies and legislation on family life, and to strengthen the family’s role in raising children, national identity and positive values.',
    links: [link('About the Ministry', ABOUT)],
  },
  {
    id: 'established',
    title: 'When the Ministry was established',
    questions: ['when was the ministry established', 'when was the ministry of family created', 'who established the ministry', 'when did the ministry start', 'how old is the ministry', 'history of the ministry'],
    keywords: ['established', 'founded', 'created', 'history', 'announced', 'began'],
    primary: 'The Ministry of Family was established in December 2024. It was announced on 8 December 2024 by His Highness Sheikh Mohammed bin Rashid Al Maktoum, Vice President, Prime Minister of the UAE and Ruler of Dubai, under the directives of UAE President His Highness Sheikh Mohamed bin Zayed Al Nahyan.',
    links: [link('About the Ministry', ABOUT)],
  },
  {
    id: 'vision',
    title: 'Vision of the Ministry',
    questions: ['what is the ministry vision', 'what is your vision', 'ministry vision statement'],
    keywords: ['vision'],
    primary: 'The Ministry’s vision is “Flourishing families rooted in enduring values”: a future where every family in the UAE thrives, grounded in the national identity and fortified by principles that stand the test of time.',
    links: [link('About the Ministry', ABOUT)],
  },
  {
    id: 'mission',
    title: 'Mission of the Ministry',
    questions: ['what is the ministry mission', 'what is your mission', 'ministry mission statement', 'what is the ministry goal', 'what are the ministry objectives'],
    keywords: ['mission', 'goal', 'goals', 'objective', 'objectives', 'purpose'],
    primary: 'The Ministry’s mission is to promote the growth and wellbeing of the family as the foundation of society, protecting vulnerable groups through shared responsibility and fostering a spirit of care and support within the community.',
    links: [link('About the Ministry', ABOUT)],
  },
  {
    id: 'values',
    title: 'Values of the Ministry',
    questions: ['what are the ministry values', 'what are your values', 'core values'],
    keywords: ['values', 'principles'],
    primary: 'The Ministry’s five values are:',
    items: { title: 'Our values', list: ['Human-Centric: families are at the core of everything we do', 'Inclusive: we stand with every family, in all its forms and circumstances', 'Integrated: a holistic approach to wellbeing', 'Shared Responsibility: family growth is a shared national responsibility', 'Sustainable Impact: lasting, positive change for generations'] },
    links: [link('About the Ministry', ABOUT)],
  },
  {
    id: 'pillars',
    title: 'Strategic pillars',
    questions: ['what are the strategic pillars', 'what is the ministry strategy', 'ministry strategy pillars', 'what are your priorities'],
    keywords: ['strategy', 'strategic', 'pillars', 'priorities'],
    primary: 'The Ministry’s strategy is built on three pillars:',
    items: { title: 'Strategic pillars', list: ['Strong families, strong nation', 'Everyone included, everyone flourishes', 'Sustainable support system'] },
    links: [link('About the Ministry', ABOUT)],
  },
  {
    id: 'minister',
    title: 'The Minister of Family',
    questions: ['who is the minister of family', 'who is the minister', 'who leads the ministry', 'who is the head of the ministry', 'minister name'],
    keywords: ['minister', 'head', 'leader', 'sana', 'suhail', 'excellency'],
    primary: 'The Minister of Family is Her Excellency Sana bint Mohammed Suhail.',
    secondary: 'She holds two Master’s degrees, in Child Rights and in International Relations and Diplomacy, and is an alumna of the Mohammed bin Rashid Leadership Program.',
    links: [link('Leadership team', page('about-us/leadership-team/'))],
  },
  {
    id: 'leadership',
    title: 'Leadership team',
    questions: ['who is on the leadership team', 'ministry leadership', 'who are the ministry leaders', 'undersecretary', 'assistant undersecretary', 'organisational structure'],
    keywords: ['leadership', 'leaders', 'undersecretary', 'structure', 'team', 'hessa', 'tahlak'],
    primary: 'The leadership team includes Her Excellency Sana bint Mohammed Suhail, Minister of Family, and Her Excellency Hessa Tahlak, Assistant Undersecretary for Development Sector, who helped launch the National Policy for Empowering People of Determination.',
    links: [link('Leadership team', page('about-us/leadership-team/'))],
  },
  {
    id: 'hours',
    title: 'Office working hours',
    questions: ['what are your working hours', 'what are the office hours', 'when are you open', 'when is the ministry open', 'are you open on friday', 'are you open on saturday', 'are you open on weekends', 'opening hours', 'office timings'],
    keywords: ['hours', 'open', 'opening', 'closed', 'timing', 'timings', 'weekend', 'holiday', 'friday', 'saturday', 'sunday', 'monday'],
    primary: 'Office working hours are Monday to Thursday, 7:30 AM to 3:30 PM, and Friday, 7:30 AM to 12:00 PM. Offices are closed on Saturday and Sunday.',
    links: [link('Contact us', CONTACT)],
  },
  {
    id: 'contact',
    title: 'Contact the Ministry',
    questions: ['how can i contact the ministry', 'how do i contact you', 'what is your phone number', 'what is the contact number', 'what is your email', 'what is your address', 'where are you located', 'where is the ministry', 'customer service number', 'call center', 'hotline', 'help line'],
    keywords: ['contact', 'phone', 'call', 'number', 'email', 'address', 'location', 'located', 'reach', 'hotline', 'helpline', 'enquiry', 'inquiry'],
    primary: 'You can reach the Ministry on 800 114, or at info@alusra.gov.ae for general inquiries. The Ministry is based in Dubai, United Arab Emirates.',
    secondary: 'Office hours are Monday to Thursday, 7:30 AM to 3:30 PM, and Friday, 7:30 AM to 12:00 PM. You can also send an inquiry through the form on the contact page.',
    links: [CALL, link('Contact page', CONTACT)],
  },
  {
    id: 'careers',
    title: 'Careers at the Ministry',
    questions: ['how do i apply for a job', 'are there any vacancies', 'careers at the ministry', 'how can i work at the ministry', 'job opportunities', 'how do i join the ministry', 'job vacancies', 'work with you'],
    keywords: ['career', 'careers', 'job', 'jobs', 'vacancy', 'vacancies', 'hiring', 'recruitment', 'employment', 'bayanati', 'cv', 'resume', 'work'],
    primary: 'All job applications are submitted through the official Bayanati platform. Please make sure your profile is complete and your CV is up to date.',
    secondary: 'For specific questions about careers, you can email talent@alusra.gov.ae.',
    links: [link('Careers page', page('careers/'))],
  },
  {
    id: 'feedback',
    title: 'Feedback and complaints',
    questions: ['i want to complain', 'how do i make a complaint', 'i have a complaint', 'how can i give feedback', 'send feedback', 'suggestions for the ministry', 'i am not happy with the service', 'raise an issue'],
    keywords: ['complaint', 'complain', 'feedback', 'suggestion', 'suggest', 'unhappy', 'dissatisfied', 'issue', 'problem'],
    primary: 'Thank you for telling us. You can send feedback, a complaint or a service request through the form on the Ministry’s contact page, choosing the topic that fits. You can also email info@alusra.gov.ae or call 800 114.',
    links: [CALL, link('Contact page', CONTACT)],
  },
  {
    id: 'licenses',
    title: 'Licenses for centers and institutions',
    questions: ['how do i get a license', 'what licenses does the ministry issue', 'i want to open a center', 'license for my center', 'licensing services'],
    keywords: ['license', 'licence', 'licensing', 'licenses'],
    primary: 'The Ministry licenses two kinds of non-governmental centers, and handles their renewals and advertising approvals:',
    items: {
      title: 'Licensing services',
      list: ['Licensing a family counseling center, including matchmaking services', 'Renewing a family counseling center license', 'Approval to publish an advertisement for a family counseling center', 'Licensing a non-governmental People of Determination institution', 'Renewing a non-governmental People of Determination institution license'],
    },
    secondary: 'Tell me which one you need and I will share its terms, documents and fees.',
    links: [link('Browse all services', page('services/'))],
  },
  {
    id: 'media',
    title: 'Media and press inquiries',
    questions: ['how do i contact the media team', 'press inquiries', 'media contact', 'media kit', 'how can journalists contact you', 'press office', 'can i use your photos'],
    keywords: ['media', 'press', 'journalist', 'journalists', 'photos', 'newsroom', 'boilerplate'],
    primary: 'Media and press inquiries go to media@alusra.gov.ae. Images may be used for editorial purposes when referring to the Ministry of Family, with the credit “Ministry of Family – UAE”.',
    links: [link('Media center', page('media/'))],
  },
  {
    id: 'social',
    title: 'Social media accounts',
    questions: ['what are your social media accounts', 'are you on instagram', 'are you on twitter', 'do you have a facebook page', 'follow the ministry', 'linkedin page'],
    keywords: ['social', 'instagram', 'facebook', 'twitter', 'linkedin', 'follow', 'x'],
    primary: 'The Ministry of Family is on Instagram, Facebook, X and LinkedIn under the name alusrauae.',
    links: [link('Instagram', 'https://www.instagram.com/alusrauae'), link('LinkedIn', 'https://www.linkedin.com/company/alusrauae/')],
  },
  {
    id: 'partnership',
    title: 'Partnerships',
    questions: ['how does the ministry work with partners', 'partnership with the ministry', 'can we partner with the ministry', 'international cooperation', 'who does the ministry work with', 'collaboration'],
    keywords: ['partnership', 'partner', 'partners', 'collaboration', 'cooperation', 'international', 'private', 'sector', 'ngo', 'organisations', 'organizations'],
    primary: 'The Ministry believes strengthening families is a shared national responsibility. It works with government entities, the private sector, civil society and community organizations, and international organizations and experts.',
    secondary: 'It also takes part in international forums and shares the UAE’s data-driven model of family wellbeing and the inclusion of People of Determination.',
    links: [link('Our partnership', page('about-us/our-partnership/'))],
  },
  {
    id: 'beneficiaries',
    title: 'Who the Ministry supports',
    questions: ['who does the ministry support', 'who are the beneficiaries', 'who can benefit from the ministry', 'which groups do you serve', 'who are your services for'],
    keywords: ['beneficiaries', 'beneficiary', 'support', 'serve', 'groups'],
    primary: 'The Ministry supports every member of the family, with programs and services for:',
    items: { title: 'Who we support', list: ['Children', 'Families and newlyweds', 'People of Determination', 'The elderly'] },
    links: [link('Beneficiaries', BENEFICIARIES)],
  },
  {
    id: 'children',
    title: 'Support for children',
    questions: ['what does the ministry do for children', 'child services', 'services for children', 'child protection services', 'child welfare programs'],
    keywords: ['children', 'child', 'kids', 'kid', 'childhood'],
    primary: 'The Ministry safeguards children’s rights and wellbeing through prevention programs, early intervention and family support. Services include:',
    items: { title: 'Services for children', list: ['Child protection and care services', 'Parental guidance and family counseling', 'Educational and recreational programs', 'Awareness campaigns on children’s rights', 'Early intervention services for at-risk children'] },
    links: [link('Children', page('beneficiaries/children/'))],
  },
  {
    id: 'elderly',
    title: 'Support for the elderly',
    questions: ['what does the ministry do for the elderly', 'services for the elderly', 'elderly care', 'services for seniors', 'senior citizens', 'old age care'],
    keywords: ['elderly', 'senior', 'seniors', 'elder', 'elders', 'aged', 'ageing', 'aging', 'retired', 'grandparents'],
    primary: 'The Ministry helps elders live with dignity, wellbeing and connection to their communities. Services include:',
    items: { title: 'Services for the elderly', list: ['Elderly care and inclusion programs', 'Daycare and home support services', 'Health and wellness awareness initiatives', 'Senior volunteer and engagement programs'] },
    secondary: 'There is a dedicated elderly center in Ajman that citizens of all emirates can use.',
    links: [link('The elderly', page('beneficiaries/elderly/'))],
  },
  {
    id: 'families',
    title: 'Support for families and newlyweds',
    questions: ['what does the ministry do for families', 'services for newlyweds', 'family services', 'support for couples', 'marriage preparation program', 'family dispute resolution', 'premarital screening'],
    keywords: ['families', 'newlyweds', 'couples', 'couple', 'idad', 'edaad', 'mediation', 'dispute', 'premarital', 'screening'],
    primary: 'The Ministry supports individuals and couples as they begin and strengthen their family journeys. Services include:',
    items: { title: 'Services for families', list: ['Marriage preparation and counseling program (Idad)', 'Premarital screening and guidance', 'Family dispute resolution and mediation services', 'Support programs for newlyweds'] },
    links: [link('Families and newlyweds', page('beneficiaries/families/'))],
  },
  {
    id: 'pod-support',
    title: 'Support for People of Determination',
    questions: ['what does the ministry do for people of determination', 'services for people of determination', 'disability services', 'support for people with disabilities', 'services for disabled people', 'inclusion programs'],
    keywords: ['people', 'determination', 'disability', 'disabilities', 'disabled', 'inclusion', 'accessibility', 'rehabilitation', 'assistive', 'autism', 'autistic', 'blind', 'deaf', 'hearing', 'visual', 'wheelchair', 'intellectual', 'special', 'needs', 'adhd'],
    primary: 'The Ministry works so that People of Determination have full access to opportunities, services and inclusion in community life. Services include:',
    items: { title: 'Services for People of Determination', list: ['Social rehabilitation programs', 'Inclusive education and employment support', 'Assistive technology and accessibility services', 'Family counseling for caregivers', 'Awareness and community integration campaigns', 'Application for the People of Determination card'] },
    links: [link('People of Determination', page('beneficiaries/people-of-determination/'))],
  },
  {
    id: 'centers',
    title: 'Centers for People of Determination',
    questions: ['where are the centers', 'where are your centers', 'where are the pod centers', 'center locations', 'centre locations', 'which centers are there', 'nearest center', 'find a center near me', 'rehabilitation center address', 'where is the care center'],
    keywords: ['centers', 'centres', 'center', 'centre', 'locations', 'location', 'nearest', 'branch', 'branches', 'ajman', 'dibba', 'dubai', 'fujairah', 'umm', 'quwain', 'ras', 'khaimah'],
    primary: 'The Ministry has People of Determination Care and Rehabilitation Centers in Ajman, Dibba, Dubai, Fujairah, Ras Al Khaimah and Umm Al Quwain. There is also a dedicated elderly center in Ajman.',
    secondary: 'I don’t have street addresses or opening details for each center. Please call 800 114 and the team will point you to the right one.',
    links: [CALL, link('Contact page', CONTACT)],
  },
  {
    id: 'registration-period',
    title: 'Registration period for government centers',
    questions: ['when does registration open', 'when is the registration period', 'registration deadline', 'when does registration close', 'is registration open', 'last date to register', 'registration dates', 'academic year registration'],
    keywords: ['registration', 'deadline', 'dates', 'period', 'close', 'closes', 'open', 'opens', 'academic', 'year', 'enrolment', 'enrollment'],
    primary: 'Registration for government People of Determination centers and early intervention centers is open from 24 August 2026 until 14 December 2026, for the 2026–2027 academic year.',
    secondary: 'Parents submit the application and complete the required documents according to the approved procedures.',
    links: [link('Register', REGISTER_URL), link('Service page', page('services/early-intervention-centers-registration/'))],
  },
  {
    id: 'child-at-risk',
    title: 'Reporting a child or family member at risk',
    questions: ['how do i report child abuse', 'i want to report abuse', 'a child is at risk', 'domestic violence', 'report family abuse', 'child protection hotline', 'how to report a child in danger', 'who do i call if a child is in danger', 'child abuse helpline', 'family violence'],
    keywords: ['abuse', 'abused', 'violence', 'violent', 'danger', 'risk', 'unsafe', 'protection', 'harm', 'neglect', 'report', 'hotline', 'shelter', 'beaten', 'hurt'],
    lead: 'Thank you for speaking up.',
    primary: 'If you believe a child or family member may be at risk, please contact one of the official support channels. Across all emirates, you can call:',
    items: {
      title: 'Support channels across the UAE',
      list: [
        'Ministry of Interior – Child Protection Center: 116111',
        'Ministry of Family: 800 114',
        'Ministry of Education – Child Protection Unit: 80085',
        'Abu Dhabi: Family Care Authority (humanitarian care and shelter), 800 7283; Abu Dhabi Police Social Support Center, 02 657 3699',
        'Ajman: Ministry of Interior Social Support Center, 050 897 3223',
        'Dubai: Dubai Police Child and Women Protection, 04 274 4666; Al Ameen Service, 800 4888 or 04 209 7777; Dubai Foundation for Women and Children, 800 111; Community Development Authority, 800 988',
        'Fujairah: Ministry of Interior Social Support Center, 056 501 6970',
        'Ras Al Khaimah: Ministry of Interior Social Support Center, 07 205 5155',
        'Sharjah: Social Services Department, Child and Family Protection Center, 800 700',
        'Umm Al Quwain: Ministry of Interior Social Support Center, 056 996 2299',
      ],
    },
    links: [CALL, link('All channels and emails', CONTACT)],
  },
  {
    id: 'services-list',
    title: 'Ministry services',
    questions: ['what services do you offer', 'what services does the ministry provide', 'list of services', 'what can i apply for', 'what can you help me with', 'what can i ask you', 'which services are available', 'all services', 'show me the services'],
    keywords: ['services', 'service', 'offer', 'provide', 'available', 'list', 'help'],
    primary: 'The Ministry offers these services online:',
    items: { title: 'Ministry services', list: site.services.map((s) => s.title) },
    links: [link('Browse all services', page('services/'))],
  },
  {
    id: 'how-to-apply',
    title: 'How to apply for a service',
    questions: ['how do i apply for a service', 'how do i apply online', 'where do i apply', 'where can i apply', 'how to submit an application', 'what is the e-services portal', 'eservices portal', 'how do i use the portal', 'online application'],
    keywords: ['apply', 'portal', 'eservices', 'e-services', 'online', 'submit', 'application'],
    primary: 'Each service has its own page on the Ministry website with the terms, documents, fees and an “Apply for service” button that opens the Ministry’s e-services portal.',
    secondary: 'Tell me which service you need and I will share its page and the required documents.',
    links: [link('Browse all services', page('services/'))],
  },
  {
    id: 'languages',
    title: 'Arabic version of the website',
    questions: ['is the website available in arabic', 'arabic version', 'can i read this in arabic', 'language options'],
    keywords: ['arabic', 'language', 'languages', 'english'],
    primary: 'The Ministry’s website is available in English and Arabic. Use the language switch at the top of any page.',
    links: [link('Arabic site', `${ORIGIN}/ar/`)],
  },
  {
    id: 'news-latest',
    title: 'Latest news',
    questions: ['what is the latest news', 'any news from the ministry', 'recent announcements', 'latest updates', 'what is new'],
    keywords: ['news', 'latest', 'recent', 'announcement', 'announcements', 'updates', 'new', 'press'],
    primary: 'Recent news from the Ministry includes:',
    items: {
      title: 'Latest news',
      list: [
        '19 June 2026: Cabinet Resolution regulating children’s access to social media platforms',
        '1 July 2025: UAE and Hungary strengthen their partnership to support families and drive social innovation',
        '20 June 2025: Minister Sana Suhail honored 50 graduates from rehabilitation centers for People of Determination across the UAE',
      ],
    },
    links: [link('News on the website', HOME_NEWS)],
  },
  {
    id: 'news-graduation',
    title: 'Graduation of 50 students from rehabilitation centers',
    questions: ['graduation of students from rehabilitation centers', 'minister honoured graduates', 'people of determination graduation'],
    keywords: ['graduation', 'graduates', 'honoured', 'honored', 'students'],
    primary: 'On 20 June 2025, Her Excellency Sana Suhail, Minister of Family, honored 50 graduates from disability care and rehabilitation centers for People of Determination across the UAE.',
    links: [link('News on the website', HOME_NEWS)],
  },
  {
    id: 'news-hungary',
    title: 'UAE and Hungary partnership',
    questions: ['uae and hungary agreement', 'hungary cooperation agreement', 'hungary partnership'],
    keywords: ['hungary', 'hungarian', 'agreement'],
    primary: 'On 1 July 2025, the UAE and the Republic of Hungary strengthened their bilateral relationship with a cooperation agreement to support families and drive social innovation.',
    links: [link('News on the website', HOME_NEWS)],
  },
];

// The social media resolution: one overview plus the 25 questions the Ministry answers on its news page.
const resolution = site.news.find((n) => n.slug === 'cabinet-children-social-media-access');
const RESOLUTION_WORDS = ['social', 'media', 'children', 'child', 'platform', 'platforms', 'age', 'verification', 'cabinet', 'resolution', 'digital', 'safety', 'tiktok', 'instagram', 'snapchat', 'facebook', 'account', 'accounts', 'minimum', 'ban', 'banned', 'block', 'blocked', 'restrict', 'restricted', 'kids', 'teen', 'teenagers'];

// Other ways people ask the same thing as some of the 25 published questions.
const FAQ_ALSO = {
  9: ['which platforms does the social media law cover', 'which social media apps are covered', 'does the law apply to tiktok', 'is whatsapp included'],
  11: ['will platforms be fined', 'what penalties do platforms face', 'what happens to platforms that break the rules'],
  14: ['how will age verification work', 'how do platforms check a child’s age'],
  15: ['what happens to existing accounts of children', 'will my child lose their account'],
  17: ['when does the social media resolution start', 'when does the law come into force', 'when will the social media rules apply'],
  18: ['why is the age limit 15', 'why was the age set at 15'],
  24: ['what if parents do not comply', 'will parents be punished'],
};

export const resolutionEntries = resolution
  ? [
      {
        id: 'social-media-resolution',
        title: resolution.title,
        questions: ['what is the cabinet resolution on social media', 'children social media law', 'social media age limit in the uae', 'minimum age for social media', 'what is the child digital safety council', 'social media ban for children', 'at what age can my child use social media'],
        keywords: RESOLUTION_WORDS,
        primary: 'The Cabinet Resolution (19 June 2026) sets 15 years as the minimum age for personal social media accounts. Platforms must prevent children under 15 from creating or using accounts, and apply enhanced protections for ages 15 to under 16.',
        secondary: 'Platforms must use reliable age verification, and have a 12-month transition period to align. In this phase it covers X, Facebook, Instagram, Snapchat and TikTok.',
        links: [link('Read the full resolution', resolution.url)],
      },
      ...resolution.faq.map((f) => ({
        id: `social-media-faq-${f.n}`,
        title: f.question,
        questions: [f.question, ...(FAQ_ALSO[f.n] ?? [])],
        keywords: RESOLUTION_WORDS,
        primary: f.answer[0],
        secondary: f.answer.slice(1).join(' ') || undefined,
        links: [link('Read the full resolution', resolution.url)],
      })),
    ]
  : [];
