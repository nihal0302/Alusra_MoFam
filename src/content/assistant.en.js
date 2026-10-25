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
  welcome: { title: 'How can I help you today?', subtitle: 'Choose a task, or just tell me in your own words.' },
  today: 'Today',
  footer: 'Mira gives general guidance about MoFam services.',
  input: { answer: 'Type or speak your answer…', welcome: 'Or tell me in your own words…', conversation: 'Type your message…' },
  listening: 'Listening…',
  listeningHint: 'Speak naturally, then press stop',
  attach: {
    label: 'Attach a file',
    remove: 'Remove file',
    accept: 'application/pdf,image/jpeg,image/png',
    types: ['application/pdf', 'image/jpeg', 'image/png'],
    maxMb: 10,
    placeholder: 'Add a message (optional)…',
    errors: { type: 'Please attach a PDF, JPG or PNG file.', size: 'That file is larger than 10 MB. Please choose a smaller one.' },
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
  { id: 'apply', label: 'Start POD application', icon: 'fileAdd', message: 'Start POD application' },
  { id: 'ask', label: 'Ask a question', icon: 'messageQuestion', message: 'Ask a question' },
  { id: 'status', label: 'Check application status', icon: 'fileSearch', message: 'Check application status' },
];

// Voice is simulated: the mic shows a listening state, then "hears" this utterance.
export const voice = {
  transcript: 'My son needs a POD card, where do I start?',
  listeningMs: 2400,
};

const REQUIRED_DOCS = [
  'Medical report (for physical and sensory disabilities) or psychological report (for intellectual, psychological, ADHD, autism and learning difficulties), from an accredited official authority confirming the presence of the disability',
  'Passport-size photo with a white background',
];

const eligibilityCard = {
  type: 'eligibility',
  title: 'Check if you’re eligible',
  description: 'A few quick questions · I’ll tell you exactly what to prepare',
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
        lead: 'Marriage grant information.',
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
    tool: { working: 'Checking your applications…', done: 'Applications · sample data' },
    text: [
      {
        lead: 'Application status.',
        primary: 'Here’s where your application stands.',
        secondary: 'This is sample data for the prototype. Signing in with UAE PASS will show your real applications.',
      },
    ],
    cards: [
      {
        type: 'status',
        title: 'Case reference POD-0004',
        summary: '2 of 5 steps complete',
        steps: [
          { label: 'Eligibility check', state: 'done' },
          { label: 'Submitted', state: 'done' },
          { label: 'Document processing', state: 'pending' },
          { label: 'Authorized Reviewer', state: 'pending' },
          { label: 'Decision', state: 'pending' },
        ],
      },
    ],
  },
  {
    id: 'counselling',
    match: ['counsel', 'therapy', 'family support'],
    tool: { working: 'Finding counselling services…', done: 'Service pages · Family counselling' },
    text: [
      {
        lead: 'Support is available.',
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
        lead: 'I can help you find the right service.',
        primary: 'The Ministry’s services are listed on its website, each with who it’s for and what you’ll need.',
        secondary: 'I can walk you through the People of Determination card here. For anything else I’ll point you to the right page.',
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
    // Guardian path is entry-only for now: it routes to the same eligibility start (gap flagged in the brief).
    id: 'guardian',
    match: ['my son', 'my daughter', 'my child', 'my kid', 'under 18', 'guardian', 'dependent'],
    tool: { working: 'Reading the POD card service card…', done: 'Service card · POD' },
    text: [
      {
        lead: 'Applying for a child.',
        primary: 'If your child is under 18, you’ll apply for them as their guardian.',
        secondary: 'I’ll ask a few things first so you know what to prepare. Nothing is submitted until you say so.',
      },
    ],
    cards: [{ ...eligibilityCard, title: 'Check if they’re eligible' }],
  },
  {
    id: 'documents',
    match: ['document', 'what do i need', 'prepare', 'bring'],
    tool: { working: 'Reading the service card…', done: 'Service card · Required documents' },
    text: [{ lead: 'Required documents.', primary: 'Here’s what you’ll need for the People of Determination card.' }],
    cards: [
      { type: 'list', title: 'Required documents', items: REQUIRED_DOCS },
      { type: 'link', title: 'People of Determination Card', description: 'See the full service card, including who may apply.', links: [{ label: 'View service', href: SERVICE_BASE + 'determination-card/' }] },
    ],
  },
  {
    id: 'who',
    match: ['who can apply', 'who is eligible', 'who qualifies', 'requirement', 'terms and conditions', 'criteria'],
    tool: { working: 'Reading the terms and conditions…', done: 'Website terms & conditions' },
    text: [{ lead: 'Eligibility requirements.', primary: 'To get the card, the person must meet these terms and conditions.' }],
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
        lead: 'Let’s begin the eligibility check.',
        primary: 'I’ll ask a few quick questions first, so you know you’re eligible before anything else.',
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
        lead: 'You can ask me about the POD card.',
        primary: 'You can type or speak in your own words, or try one of these.',
      },
    ],
    cards: [
      {
        type: 'suggestions',
        title: 'Things people often ask',
        items: ['Who can apply?', 'What documents will I need?', 'Can I apply for my child?'],
      },
    ],
  },
  {
    id: 'pod',
    match: ['pod', 'people of determination', 'determination', 'disability', 'card'],
    tool: { working: 'Reading the POD card service card…', done: 'Service card · POD' },
    text: [
      {
        lead: 'About the People of Determination card.',
        primary: 'The People of Determination card gives access to services, discounts and priority support across the UAE.',
        // VERIFY: "It's free" is copied from Figma; confirm against the service card.
        secondary: 'It’s free, and you can apply for yourself or someone you care for.',
      },
    ],
    cards: [eligibilityCard],
  },
];

// Off-topic or unrecognised: redirect gracefully and offer a person.
// Reply when someone sends a file in the main chat. The file stays on the device; nothing reads it yet.
export const attachmentReply = {
  id: 'attachment',
  tool: null,
  text: [
    {
      lead: 'File received.',
      primary: 'I cannot read or review documents in this chat yet. The file stays on your device and has not been submitted.',
      secondary: 'You can still ask your question in words, and I will answer from the service information.',
    },
  ],
  cards: [],
};

export const fallback = {
  id: 'fallback',
  tool: null,
  text: [
    {
      lead: 'That is outside what I can help with.',
      primary: 'I can help with the People of Determination card, and point you to other Ministry services. I can’t answer that one yet.',
      secondary: 'A person can help with anything else.',
    },
  ],
  cards: [
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
    text: [{ lead: 'Understood.', primary: 'Your answers weren’t saved and nothing was submitted. I’m here whenever you want to continue.' }],
    cards: [eligibilityCard],
  },
  apply: {
    id: 'check:apply',
    tool: null,
    text: [
      {
        lead: 'To continue, please sign in.',
        primary: 'To fill in your details for you, I’ll ask you to sign in with UAE PASS.',
        secondary: 'Your name, Emirates ID, contact details, nationality and date of birth are filled in for you.',
      },
    ],
    cards: [
      {
        type: 'uaepass',
        title: 'Sign in with UAE PASS',
        description: 'UAE PASS shares your name, Emirates ID, contact details, nationality and date of birth. You’ll review everything before anything is submitted.',
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
      lead: 'Sign-in is not available yet.',
      primary: 'UAE PASS sign-in is the next part of this prototype, so it isn’t available yet.',
      secondary: 'Nothing has been submitted.',
    },
  ],
  cards: [],
};
