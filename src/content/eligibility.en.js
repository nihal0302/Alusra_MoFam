// Eligibility check copy. Source: the POD card website terms and conditions
//   1. Must be an Emirati citizen or a legal resident in the UAE.
//   2. Must have medical or psychological reports confirming the disability from an accredited
//      official authority, such as a government hospital.
// plus the journey map rule "Under 18 → apply through a guardian".
// Layout follows the Figma eligibility dialog (header stepper, question bubble, option cards,
// Back / Continue footer) and its success screen.
// Tokens in {braces} are filled for the person the card is for (see src/lib/eligibility.js).
// The number of questions is adaptive: "who" and "status" always, then "report", then "accredited".

const SERVICE_PAGE = 'https://www.alusra.gov.ae/en/services/determination-card/';

export const eligibility = {
  hint: 'Choose one, or type or speak in your own words.',
  change: { lead: 'Certainly. Let’s update that.' },
  steps: ['Eligibility', 'Documents', 'Application'],
  stepsLabel: 'Application steps',
  question: 'Question {step} of {total}',
  say: {
    placeholder: 'Type or speak your answer…',
    send: 'Send answer',
    mic: 'Answer by voice',
    stop: 'Stop listening',
    listening: 'Listening…',
    miss: 'I didn’t quite catch that. Please choose one of the options, or try again.',
  },
  // Variation 2: the questions are asked together, numbered, and answered in one message (typed or spoken).
  batch: {
    lead: 'Thank you. Let’s begin.',
    primary: 'Please answer the questions below in one message. You can type your answers, or tap the microphone and simply say them.',
    title: 'Please tell me',
    numbers: { who: 1, status: 2, report: 3, accredited: 4 },
    items: {
      who: 'Who is the card for: yourself, or your child (under 18)?',
      status: 'Is the applicant an Emirati citizen or a legal UAE resident?',
      report: 'Is there a medical or psychological report confirming the disability?',
      accredited: 'If so, was it issued by an accredited official authority, such as a government hospital?',
    },
    // Pieces of one sentence, joined to show how a reply could read (only for the questions being asked).
    examples: { who: 'it is for myself', status: 'I am an Emirati citizen', report: 'I have a medical report', accredited: 'it is from a government hospital' },
    exampleLabel: 'For example:',
    voice: 'Answer by voice',
    moreLead: 'Thank you.',
    more: 'I still need {what} to finish the check. Please answer in one message, or tap the microphone.',
    placeholder: 'Type your answers, or tap the microphone and say them…',
    voiceSample: 'It’s for myself, I’m an Emirati citizen, I have a medical report and it’s from a government hospital.',
    nudgeLead: 'I didn’t catch that.',
    nudge: 'Please answer the questions above in order.',
    resume: 'Shall we carry on with the check? I’m still waiting for your answers above.',
  },
  nav: { back: 'Back', continue: 'Continue', close: 'Close eligibility check', expand: 'Expand chat', collapse: 'Return to compact chat' },

  questions: {
    who: {
      label: 'Applying for',
      lead: 'Thank you. Let’s begin.',
      text: 'Who is the card for?',
      voiceSample: 'It’s for my son',
      options: [
        { value: 'self', icon: 'phUser', label: 'Myself', hint: 'I’m the applicant', answer: 'Myself', match: ['myself', 'for me', 'my own', 'me'] },
        { value: 'child', icon: 'phUsers', label: 'My child', hint: 'Under 18, I’m their guardian', answer: 'My child (under 18)', match: ['child', 'son', 'daughter', 'kid', 'under 18', 'boy', 'girl'] },
      ],
    },
    status: {
      label: 'Citizen or resident',
      lead: 'Thank you.',
      text: '{Are} an Emirati citizen or a legal resident of the UAE?',
      voiceSample: 'We’re Emirati citizens',
      options: [
        { value: 'citizen', icon: 'flag', label: 'Emirati citizen', hint: 'UAE national', answer: 'Emirati citizen', match: ['emirati', 'citizen', 'national'] },
        { value: 'resident', icon: 'homeDoor', label: 'Legal UAE resident', hint: 'Valid residency', answer: 'Legal UAE resident', match: ['resident', 'residence', 'visa', 'expat'] },
        { value: 'neither', icon: 'xCircle', label: 'Neither', hint: 'Not a citizen or resident', answer: 'Neither', match: ['neither', 'none', 'visitor', 'tourist', 'no'] },
        { value: 'unsure', icon: 'question', label: 'I’m not sure', hint: 'Help me find out', answer: 'Not sure', match: ['not sure', 'don\'t know', 'dont know', 'do not know', 'unsure', 'no idea', 'not certain'] },
      ],
    },
    report: {
      label: 'Medical or psychological report',
      lead: 'Thank you.',
      text: '{Do} have a medical or psychological report confirming the disability?',
      voiceSample: 'Yes, we have a report',
      options: [
        { value: 'yes', icon: 'checkCircle', label: 'Yes', hint: 'A report confirms the disability', answer: 'Yes', match: ['yes', 'yeah', 'yep', 'we do', 'i do', 'have one', 'have a report'] },
        { value: 'no', icon: 'xCircle', label: 'No', hint: 'No report yet', answer: 'No', match: ['no', 'nope', 'not yet', 'don\'t have', 'do not have', 'haven\'t', 'have not'] },
        { value: 'unsure', icon: 'question', label: 'I’m not sure', hint: 'Help me find out', answer: 'Not sure', match: ['not sure', 'don\'t know', 'dont know', 'do not know', 'unsure', 'no idea', 'not certain'] },
      ],
    },
    accredited: {
      label: 'Report from an accredited authority',
      lead: 'Almost done. One last question.',
      text: 'Is the report from an accredited official authority, such as a government hospital?',
      voiceSample: 'Yes, from a government hospital',
      options: [
        { value: 'yes', icon: 'hospital', label: 'Yes', hint: 'For example, a government hospital', answer: 'Yes', match: ['yes', 'yeah', 'yep', 'government', 'hospital', 'accredited'] },
        { value: 'no', icon: 'xCircle', label: 'No', hint: 'From another source', answer: 'No', match: ['no', 'nope', 'private clinic', 'not accredited', 'not from'] },
        { value: 'unsure', icon: 'question', label: 'I’m not sure', hint: 'Help me find out', answer: 'Not sure', match: ['not sure', 'don\'t know', 'dont know', 'do not know', 'unsure', 'no idea', 'not certain'] },
      ],
    },
  },

  review: {
    lead: 'Thank you. That completes the check.',
    title: 'Check your answers',
    text: 'Please review your answers before I give you the result.',
    changeLabel: 'Change',
    confirm: 'Confirm and continue',
    note: 'Nothing is submitted',
  },

  results: {
    intro: 'Here’s what I found.',
    metaLabel: 'Which report do I need?',
    listLabel: { eligible: 'Your preparation checklist', notEligible: 'What you can do', unsure: 'What to confirm' },
    eligible: {
      title: 'You can start preparing your card application',
      subtitle: '{Your} answers meet the requirements. Review the checklist before starting.',
      items: [
        { icon: 'camera', title: 'Personal photograph', text: 'Passport-size photo with a white background' },
        {
          icon: 'file',
          title: 'Medical or psychological report',
          text: 'From an accredited official authority, confirming the presence of the disability',
          meta: 'Medical report for physical and sensory disabilities. Psychological report for intellectual, psychological, ADHD, autism and learning difficulties.',
        },
      ],
      childItem: { icon: 'users', title: 'Guardian application', text: 'You’ll apply on your child’s behalf, as they’re under 18' },
      actions: { review: 'Review answers', later: 'I’ll apply later', apply: 'Yes, I want to apply' },
    },
    notEligible: {
      title: 'Not eligible yet',
      lead: 'Thank you for checking before applying.',
      reasons: {
        status: 'The card is for Emirati citizens and legal UAE residents, so {you} can’t apply right now.',
        report: 'A medical or psychological report confirming the disability is needed to apply.',
        accredited: 'The report has to come from an accredited official authority, such as a government hospital.',
      },
      steps: {
        status: [
          { icon: 'search', title: 'Check the full terms', text: 'Read who can apply on the service page' },
          { icon: 'chat', title: 'Talk to the Ministry', text: 'If you think this is a mistake, call 800 114' },
        ],
        report: [
          { icon: 'file', title: 'Get a medical or psychological report', text: 'Ask your doctor or a government hospital' },
          { icon: 'refresh', title: 'Come back and check again', text: 'I’ll re-check as soon as you have it' },
        ],
        accredited: [
          { icon: 'building', title: 'Ask an accredited authority', text: 'For example, a government hospital' },
          { icon: 'refresh', title: 'Come back and check again', text: 'I’ll re-check as soon as you have it' },
        ],
      },
    },
    unsure: {
      title: 'A few things to confirm',
      subtitle: 'I couldn’t confirm everything from your answers, and that’s okay.',
      confirm: {
        status: { icon: 'flag', title: 'Confirm citizenship or residency', text: 'You must be an Emirati citizen or a legal UAE resident' },
        report: { icon: 'file', title: 'Find out if there is a report', text: 'A medical or psychological report confirming the disability' },
        accredited: { icon: 'building', title: 'Check who issued the report', text: 'It must come from an accredited official authority, such as a government hospital' },
      },
    },
    links: [{ label: 'View service page', href: SERVICE_PAGE }, { label: 'Call 800 114', href: 'tel:800114' }],
    otherActions: { review: 'Review answers', again: 'Check again', chat: 'Back to chat' },
  },
};
