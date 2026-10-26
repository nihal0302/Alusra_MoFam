// Mira assistant: persona, copy and scripted scenarios — everything the widget says lives here,
// so a real backend (or another persona) can replace it without touching view code.
// Source: Figma assistant component set 2789:27388, corrected per the journey brief:
//   - no "Apply service" for non-POD services → guidance + link out
//   - "a few quick questions" instead of a fixed count (the check is adaptive)
//   - three tasks are the entry points: Start POD application · Ask a question · Check application status
//     (anything else is reached by typing or speaking, and answered with guidance + a link)

const SERVICE_BASE = 'https://www.alusra.gov.ae/en/services/';

// Persona is config, not code: Suhail (male) and Mira (female) may follow.
export const persona = {
  name: 'Mira',
  subtitle: 'MoFam virtual assistant',
  avatar: 'noor-avatar.png',
  poses: { greeting: 'noor-greeting.png', selection: 'noor-selection.png' },
};

export const ui = {
  launcher: { title: 'Ask Mira', subtitle: 'Virtual assistant', label: 'Ask Mira, virtual assistant. Opens chat.' },
  panelLabel: 'Chat with Mira, the MoFam virtual assistant',
  welcome: { title: 'How can I help you today?', subtitle: 'Choose a task, or describe your request in your own words.' },
  // Variation 2: a plainer starting screen that points to the microphone.
  welcomeV2: { title: 'How can I help you?', titleAccent: 'help you?', subtitle: 'Tap the microphone to speak, or type your question.', quickLabel: 'Quick start' },
  today: 'Today',
  footer: 'Mira gives general guidance about MoFam services.',
  input: { answer: 'Speak or type your answer…', welcome: 'Describe how I can help you…', welcomeV2: 'Tap the microphone to speak, or type…', conversation: 'Speak or type your message to Mira…' },
  tray: { label: 'Choose a reply' },
  listening: 'Listening…',
  listeningHint: 'Speak naturally, then press stop',
  attach: {
    label: 'Attach a file',
    remove: 'Remove file',
    accept: 'application/pdf,image/jpeg,image/png',
    types: ['application/pdf', 'image/jpeg', 'image/png'],
    maxMb: 10,
    maxFiles: 2,
    placeholder: 'Tell me about your situation (optional)…',
    errors: {
      type: 'Please attach a PDF, JPG or PNG file.',
      size: 'That file is larger than 10 MB. Please choose a smaller one.',
      count: 'You can attach up to two files at a time.',
    },
  },
  announce: { thinking: 'Mira is typing', expanded: 'Chat expanded', collapsed: 'Chat returned to compact size', youSaid: 'You said: ', noorSaid: 'Mira said: ' },
  actions: {
    minimize: 'Minimise chat',
    close: 'Close chat',
    restart: 'Start a new conversation',
    send: 'Send message',
    mic: 'Speak your message',
    stop: 'Stop listening',
    expand: 'Expand chat',
    collapse: 'Return to compact chat',
  },
};

export const topics = [
  { id: 'apply', label: 'Start POD application', description: 'Check eligibility, then apply for the card.', icon: 'fileAdd', message: 'Start POD application' },
  { id: 'ask', label: 'Ask a question', description: 'Answers on services, fees and documents.', icon: 'messageQuestion', message: 'Ask a question' },
  { id: 'status', label: 'Check application status', description: 'See where your application stands.', icon: 'search', message: 'Check application status' },
];

// Voice is simulated: the mic shows a listening state, then "hears" this utterance.
export const voice = {
  // The starting screen "hears" one complete sentence, so a single message carries the whole check end to end.
  transcript: 'I am an Emirati citizen and I want to apply for the People of Determination card for myself. I have a medical report from a government hospital.',
  listeningMs: 2400,
};

const REQUIRED_DOCS = [
  'Medical report (for physical and sensory disabilities) or psychological report (for intellectual, psychological, ADHD, autism and learning difficulties), from an accredited official authority confirming the presence of the disability',
  'Passport-size photo with a white background',
];

export const eligibilityCard = {
  type: 'eligibility',
  title: 'Check if you’re eligible',
  description: 'A few quick questions · I will tell you exactly what to prepare',
  note: 'Nothing is submitted',
  action: { label: 'Start check', event: 'startCheck' }, // starts the in-chat eligibility flow
};

// Matched in order; first hit wins. Keep specific intents above general ones.
export const scenarios = [
  {
    id: 'replacement',
    match: ['damaged', 'lost', 'replace', 'broken'],
    tool: { working: 'Looking up the replacement service…', done: 'Service card · POD replacement' },
    text: [{ lead: 'Thank you for letting us know.', primary: 'You can request a replacement online so he keeps access to services across the UAE.' }],
    cards: [
      {
        type: 'link',
        title: 'Replacement for a Lost or Damaged People of Determination Card',
        description:
          'Issuance of a replacement for a lost or damaged People of Determination Card to ensure continued access to services and facilities across various entities and sectors in the UAE.',
        links: [{ label: 'View service', href: SERVICE_BASE + 'pod-card-replacement/' }],
      },
    ],
  },
  {
    id: 'marriage',
    match: ['marriage', 'married', 'wedding', 'grant'],
    tool: { working: 'Reading the marriage grant service card…', done: 'Service card · Marriage grant' },
    text: [
      {
        lead: 'Thank you for asking about the marriage grant.',
        primary: 'Couples receive a financial grant of AED 70,000, together with a package of social services that prepares you for married life.',
        secondary: 'Marriage grant applications are made on the Ministry website. I can point you to the right page.',
      },
    ],
    cards: [
      {
        type: 'link',
        title: 'Marriage Grant Application',
        description: 'A package of social services for stable, cohesive families, plus a financial grant of seventy thousand dirhams.',
        links: [{ label: 'View service', href: SERVICE_BASE + 'marriage-grant/' }],
      },
    ],
  },
  {
    id: 'track',
    match: ['track', 'status', 'applied', 'my application'],
    tool: null,
    text: [
      {
        lead: 'Happy to help you check your application.',
        primary: 'The application ID starts with POD- and is in the confirmation you received after submitting, for example POD-1042.',
        question: 'Please share your application ID‹mic›, using the microphone or by typing‹/mic›.',
      },
    ],
    cards: [],
  },
  {
    id: 'counselling',
    match: ['counsel', 'therapy', 'family support'],
    tool: { working: 'Finding counselling services…', done: 'Service pages · Family counselling' },
    text: [
      {
        lead: 'Thank you for reaching out. Support is available.',
        primary: 'Family counselling is confidential support for families going through change.',
        secondary: 'Counselling services are listed on the Ministry website, where you can find the right one.',
      },
    ],
    cards: [
      {
        type: 'link',
        title: 'Family counselling services',
        description: 'Browse the Ministry’s family counselling services and see what each one involves.',
        links: [{ label: 'Browse services', href: SERVICE_BASE }],
      },
    ],
  },
  {
    id: 'services',
    match: ['all services', 'services', 'parking', 'local card', 'another service'],
    tool: { working: 'Looking through the service list…', done: 'Service pages · All services' },
    text: [
      {
        lead: 'Happy to help you find the right service.',
        primary: 'The Ministry’s services are listed on its website, each with who it’s for and what you’ll need.',
        secondary: 'I can walk you through the People of Determination card here. For anything else I will point you to the right page.',
      },
    ],
    cards: [
      {
        type: 'link',
        title: 'All Ministry services',
        description: 'See every service the Ministry of Family offers online.',
        links: [{ label: 'Browse services', href: SERVICE_BASE }],
      },
    ],
  },
  {
    // Applying for someone else is entry-only for now: it routes to the same eligibility start (gap flagged in the brief).
    id: 'guardian',
    match: ['my son', 'my daughter', 'my child', 'my kid', 'under 18', 'guardian', 'dependent', 'on behalf', 'someone else', 'somebody else'],
    tool: { working: 'Reading the POD card service card…', done: 'Service card · POD' },
    text: [
      {
        lead: 'Thank you for applying on someone’s behalf.',
        primary: 'You will apply for them, and I will ask for their details after you sign in.',
        secondary: 'I will ask a few things first so you know what to prepare. Nothing is submitted until you say so.',
      },
    ],
    cards: [{ ...eligibilityCard, title: 'Check if they’re eligible' }],
  },
  {
    id: 'documents',
    match: ['document', 'what do i need', 'prepare', 'bring'],
    tool: { working: 'Reading the service card…', done: 'Service card · Required documents' },
    text: [{ lead: 'Good idea to prepare ahead.', primary: 'Here’s what you’ll need for the People of Determination card.' }],
    cards: [
      { type: 'list', title: 'Required documents', items: REQUIRED_DOCS },
      { type: 'link', title: 'People of Determination Card', description: 'See the full service card, including who may apply.', links: [{ label: 'View service', href: SERVICE_BASE + 'determination-card/' }] },
    ],
  },
  {
    id: 'who',
    match: ['who can apply', 'who is eligible', 'who qualifies', 'requirement', 'terms and conditions', 'criteria'],
    tool: { working: 'Reading the terms and conditions…', done: 'Website terms & conditions' },
    text: [{ lead: 'Thank you for your question.', primary: 'To get the card, the person must meet these terms and conditions.' }],
    cards: [
      {
        type: 'list',
        ordered: true,
        title: 'Terms and conditions',
        // Source reads "a legally resident in the UAE"; tidied to "a legal resident".
        items: [
          'Must be an Emirati citizen or a legal resident in the UAE.',
          'Must have medical or psychological reports confirming the disability from an accredited official authority, such as a government hospital.',
        ],
      },
      eligibilityCard,
    ],
  },
  {
    id: 'apply',
    match: ['start pod application', 'start an application', 'start application', 'apply', 'am i eligible', 'is he eligible', 'is she eligible', 'eligib', 'start check'],
    tool: null,
    then: 'startEligibility',
    text: [
      {
        lead: 'Certainly, let us begin the eligibility check.',
        primary: 'I will ask a few quick questions first, so you know whether you are eligible before anything else.',
        secondary: 'Nothing is submitted, and you can change any answer.',
      },
    ],
    cards: [],
  },
  {
    id: 'ask',
    match: ['ask a question', 'i have a question', 'question'],
    tool: null,
    text: [
      {
        lead: 'Of course. I am glad to help.',
        primary: 'You can ask me about the Ministry’s services, fees, documents and how to apply. Use the microphone or type in your own words, or select one of these.',
      },
    ],
    cards: [
      {
        type: 'suggestions',
        title: 'Things people often ask',
        items: ['What services do you offer?', 'What documents are needed for the POD card?', 'How much is the marriage grant?', 'What are your working hours?'],
      },
    ],
  },
  {
    id: 'pod',
    match: ['pod', 'people of determination', 'determination', 'disability', 'card'],
    tool: { working: 'Reading the POD card service card…', done: 'Service card · POD' },
    text: [
      {
        lead: 'Happy to explain the People of Determination card.',
        primary: 'The People of Determination card gives access to services, discounts and priority support across the UAE.',
        // VERIFY: "It's free" is copied from Figma; confirm against the service card.
        secondary: 'It’s free, and you can apply for yourself or someone you care for.',
      },
    ],
    cards: [eligibilityCard],
  },
];

// Checking an application's status: Mira asks for the application ID, then reports where it stands (sample data).
export const statusCheck = {
  placeholder: 'Enter your application ID, e.g. POD-1042',
  voiceSample: 'POD 1042',
  invalid: 'I could not find an application ID in that. It looks like POD-1042: the letters POD, then four digits. Could you check it and send it again?',
  tool: { working: 'Looking up your application…', done: 'Application status · sample data' },
  reply: {
    lead: 'Thank you, I have found your application.',
    primary: 'Application {id} is currently at the “{stage}” step.',
    sample: 'This is sample data for the prototype.',
  },
  card: { title: 'Application {id}', summary: '{done} of {total} steps complete' },
  steps: ['Eligibility check', 'Submitted', 'Documents under review', 'Decision'],
  states: { done: 'Done', current: 'In progress', pending: 'Pending' },
  // One line per sample stage, in the order the steps are reached.
  stages: ['Your documents are being reviewed.', 'Your application is awaiting its final decision.'],
};

// Off-topic or unrecognised: redirect gracefully and offer a person.
export const fallback = {
  id: 'fallback',
  tool: null,
  text: [
    {
      lead: 'Thank you for asking.',
      primary: 'I could not find that in the Ministry’s published information, so I would rather not guess.',
      secondary: 'You can rephrase your question, try one of these, or reach the team directly.',
    },
  ],
  cards: [
    { type: 'suggestions', title: 'You could try', items: ['What services do you offer?', 'What documents are needed for the POD card?', 'How can I contact the Ministry?'] },
    {
      type: 'link',
      title: 'Talk to the Ministry',
      description: 'Our team can help with questions I can’t answer.',
      links: [
        { label: 'Call 800 114', href: 'tel:800114' },
        { label: 'Email us', href: 'mailto:info@alusra.gov.ae' },
      ],
    },
  ],
};

// Chat replies when the eligibility dialog hands back to the conversation.
export const afterCheck = {
  later: {
    id: 'check:later',
    tool: null,
    text: [{ lead: 'Understood.', primary: 'Nothing has been submitted. Whenever you’re ready, I can run the check again.' }],
    cards: [eligibilityCard],
  },
  close: {
    id: 'check:close',
    tool: null,
    text: [{ lead: 'Understood.', primary: 'Your answers were not saved and nothing was submitted. I’m here whenever you want to continue.' }],
    cards: [eligibilityCard],
  },
  apply: {
    id: 'check:apply',
    tool: null,
    text: [
      {
        lead: 'Thank you. To continue, please sign in.',
        primary: 'To fill in your details for you, I will ask you to sign in with UAE PASS.',
        secondary: 'Your name, Emirates ID, contact details, nationality and date of birth are filled in for you.',
      },
    ],
    cards: [
      {
        type: 'uaepass',
        title: 'Sign in with UAE PASS',
        description: 'UAE PASS shares your name, Emirates ID, contact details, nationality and date of birth. You will review everything before anything is submitted.',
        action: { label: 'Sign in with UAE PASS', event: 'uaepass' },
      },
    ],
  },
};

// UAE PASS sign-in is the next step of the prototype and is not built yet; say so honestly.
export const uaePassStub = {
  id: 'uaePassStub',
  tool: null,
  text: [
    {
      lead: 'Thank you for your patience.',
      primary: 'UAE PASS sign-in is the next part of this prototype, so it isn’t available yet.',
      secondary: 'Nothing has been submitted.',
    },
  ],
  cards: [],
};
