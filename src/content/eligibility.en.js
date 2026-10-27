// Eligibility check copy. Source: the POD card website terms and conditions
//   1. Must be an Emirati citizen or a legal resident in the UAE.
//   2. Must have medical or psychological reports confirming the disability from an accredited
//      official authority, such as a government hospital.
// plus the journey map rule "applying for someone else → apply on their behalf".
// Layout follows the Figma eligibility dialog (header stepper, question bubble, option cards,
// Back / Continue footer) and its success screen.
// Tokens in {braces} are filled for the person the card is for (see src/lib/eligibility.js).
// The number of questions is adaptive: "who" and "status" always, then "report", then "accredited".

const SERVICE_PAGE = 'https://www.alusra.gov.ae/en/services/determination-card/';

export const eligibility = {
  hint: 'Choose one‹mic›, or use the microphone or type in your own words‹/mic›.',
  steps: ['Eligibility', 'Documents', 'Application'], // the first stage: UAE PASS, who the card is for, and the eligibility check
  stepsLabel: 'Application steps',
  question: 'Question {step} of {total}',
  say: {
    placeholder: 'Speak or type your answer…',
    send: 'Send answer',
    mic: 'Answer by voice',
    stop: 'Stop listening',
    listening: 'Listening…',
    miss: 'I was unable to identify that answer. Please choose one of the options, or try again.',
  },
  // Variation 2: the questions are asked together, numbered, and answered in one message (typed or spoken).
  batch: {
    // As in the team's Mira POD Assistant prototype: one line of what is happening, then the four questions, numbered.
    intro: 'Let’s check your eligibility first.',
    primary: 'Please answer these four questions',
    how: 'You can answer all four together in one message.',
    // The questions still to ask depend on who the card is for (UAE PASS confirms the applicant's own citizenship or residency).
    primaries: { 1: 'Please answer this question', 2: 'Please answer these two questions', 3: 'Please answer these three questions', 4: 'Please answer these four questions' },
    hows: { 1: 'Please reply in one message.', 2: 'You can answer both together in one message.', 3: 'You can answer all three together in one message.', 4: 'You can answer all four together in one message.' },
    title: 'Please provide',
    numbers: { who: 1, status: 2, report: 3, accredited: 4 },
    items: {
      who: 'Who is the card for: yourself, or someone else?',
      status: 'Is the applicant an Emirati citizen or a UAE resident?',
      report: 'Do you have a medical or psychological report confirming the disability?',
      accredited: 'Was the report issued by a government hospital or another accredited authority?',
    },
    // Pieces of one sentence, joined to show how a reply could read (only for the questions being asked).
    examples: { who: 'it is for myself', status: 'I am an Emirati citizen', report: 'I have a medical report', accredited: 'it is from a government hospital' },
    // the same, when the card is for someone else
    examplesOther: { status: 'they are an Emirati citizen', report: 'they have a medical report', accredited: 'it is from a government hospital' },
    exampleLabel: 'For example:',
    more: 'To complete the check, could you please provide {what}?',
    moreHow: 'Please respond in one message‹mic›, using the microphone or by typing‹/mic›.',
    placeholder: 'Use the microphone or type your answers…',
    voiceSample: 'It’s for myself, I’m an Emirati citizen, I have a medical report and it’s from a government hospital.',
    nudgeLead: 'I was unable to understand that.',
    nudge: 'Please answer the questions above in order.',
    resume: 'Shall we continue with the check? I am still awaiting your answers above.',
  },
  nav: { back: 'Back', continue: 'Continue', close: 'Close eligibility check', expand: 'Expand chat', collapse: 'Return to compact chat' },

  questions: {
    who: {
      label: 'Applying for',
      text: 'Who is the card for?',
      voiceSample: 'It’s for my son',
      options: [
        { value: 'self', icon: 'phUser', label: 'Myself', hint: 'I’m the applicant', answer: 'Myself', match: ['myself', 'for me', 'my own', 'me'] },
        { value: 'other', icon: 'phUserPlus', label: 'Someone else', hint: 'I’m applying on their behalf', answer: 'Someone else', match: ['someone else', 'somebody else', 'another person', 'on behalf', 'behalf', 'child', 'son', 'daughter', 'kid', 'under 18', 'boy', 'girl', 'mother', 'father', 'parent', 'brother', 'sister', 'wife', 'husband', 'relative', 'friend', 'guardian'] },
      ],
    },
    status: {
      label: 'Citizen or resident',
      text: '{Are} an Emirati citizen or a legal resident of the UAE?',
      voiceSample: 'An Emirati citizen',
      options: [
        { value: 'citizen', icon: 'flag', label: 'Emirati citizen', hint: 'UAE national', answer: 'Emirati citizen', match: ['emirati', 'citizen', 'national'] },
        { value: 'resident', icon: 'homeDoor', label: 'Legal UAE resident', hint: 'Valid residency', answer: 'Legal UAE resident', match: ['resident', 'residence', 'visa', 'expat'] },
        { value: 'neither', icon: 'xCircle', label: 'Neither', hint: 'Not a citizen or resident', answer: 'Neither', match: ['neither', 'none', 'visitor', 'tourist', 'no'] },
        { value: 'unsure', icon: 'question', label: 'I’m not sure', hint: 'Help me find out', answer: 'Not sure', match: ['not sure', 'don\'t know', 'dont know', 'do not know', 'unsure', 'no idea', 'not certain'] },
      ],
    },
    report: {
      label: 'Medical or psychological report',
      text: '{Do} have a medical or psychological report confirming the disability?',
      voiceSample: 'Yes, there is a report',
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
    lead: 'That completes the check.',
    title: 'Check your answers',
    text: 'Please review your answers before I give you the result.',
    changeLabel: 'Change',
    confirm: 'Confirm and continue',
  },

  results: {
    intro: 'Here is what I found.',
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
      otherItem: { icon: 'users', title: 'Applying on someone’s behalf', text: 'You will apply for them, and I will ask for their Emirates ID' },
      actions: { review: 'Review answers', later: 'I’ll apply later', apply: 'Yes, I want to apply' },
      // The next step, asked in its own bubble under the checklist (the buttons follow it).
      next: { question: 'Would you like to continue with your application now?', hint: 'Your UAE PASS details are already in.', hintSignIn: 'You will sign in with UAE PASS next.' },
      // Variation 2 words the result as the team's Mira POD Assistant prototype does (contractions written out).
      mira: {
        title: 'You’re eligible to apply',
        subtitle: { self: 'You can apply for a People of Determination card.', other: 'The person you’re applying for can apply for a People of Determination card.' },
        listLabel: 'To apply, you’ll upload two documents',
        // what each document line says before a file has been sent (by the icon of the checklist line)
        itemTexts: { camera: 'Recent, white background · JPG or PNG', file: 'The report you mentioned · PDF or JPG' },
        next: { question: 'Would you like to start your application now?', hint: 'I already have your details from UAE PASS, so I’ll only ask what is left.', hintSignIn: 'You’ll sign in with UAE PASS so I can fill in your personal details.' },
        actions: { later: 'I’ll apply later', apply: 'Start application' },
      },
    },
    notEligible: {
      // Variation 2 words the result as the team's Mira POD Assistant prototype does.
      mira: {
        title: 'You can’t apply yet',
        subtitle: 'Based on your answers, the application can’t go ahead right now.',
        listLabel: 'Why',
        reasons: {
          status: 'The card is for Emirati citizens and UAE residents.',
          report: 'A medical or psychological report confirming the disability is required.',
          accredited: 'The report must come from a government hospital or another accredited authority.',
        },
        actions: [
          { label: 'Ask a question', event: 'say', variant: 'outline' },
          { label: 'Change my answers', event: 'restartCheck', variant: 'primary' },
        ],
      },
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
          { icon: 'refresh', title: 'Come back and check again', text: 'I will re-check as soon as you have it' },
        ],
        accredited: [
          { icon: 'building', title: 'Ask an accredited authority', text: 'For example, a government hospital' },
          { icon: 'refresh', title: 'Come back and check again', text: 'I will re-check as soon as you have it' },
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
