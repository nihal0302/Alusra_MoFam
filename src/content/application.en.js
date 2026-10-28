// POD application, applying for yourself, entirely inside the conversation.
// Source: Figma "Applying for Myself" flow (applicant details → contact → documents → review & submit)
// and the journey map (Identity & access → Assemble → Approve & consent → Submit → application number).
// SAMPLE DATA: there is no UAE PASS or Ministry integration yet; the person below is made up.

import { conv } from './application.conv.en.js';

export const application = {
  signIn: {
    // Simulated wait while the person approves in the UAE PASS app (the real hand-off is not built).
    wait: {
      ms: 8000,
      lead: 'Opening UAE PASS now.',
      primary: 'Please approve the sign-in in your UAE PASS app. This can take a little while, so please keep this window open.',
      title: 'Signing in with UAE PASS',
      steps: [
        'Opening UAE PASS',
        'Waiting for your approval in the app',
        'Confirming your identity',
        'Getting your details ready',
      ],
      done: 'Signed in',
      note: 'Nothing is shared until you approve.',
    },
    working: 'Opening UAE PASS…',
    done: 'Signed in with UAE PASS',
    lead: 'Welcome, {first}.',
    primary: 'Retrieving your details from UAE PASS, so you do not need to enter them manually.',
    // Sample data standing in for what UAE PASS shares (full name, Emirates ID, mobile and email,
    // nationality, date of birth). Gender is shown in the Figma form and is assumed to come with it.
    profile: {
      first: 'Hamdan',
      rows: [
        { id: 'name', label: 'Full name', value: 'Hamdan Al Ketbi' },
        { id: 'gender', label: 'Gender', value: 'Male' },
        { id: 'dob', label: 'Date of birth', value: '15 May 1998' },
        { id: 'nationality', label: 'Nationality', value: 'Emirati' },
        { id: 'eid', label: 'Emirates ID', value: '784-1998-1234567-1' },
        { id: 'mobile', label: 'Mobile', value: '+971 50 123 4567' },
        { id: 'email', label: 'Email', value: 'hamdan@example.com' },
      ],
    },
    card: { title: 'From UAE PASS', note: 'Used only for this application. You’ll review everything before it’s submitted.' },
  },

  // Variation 1: the application one question at a time, in the order of the Ministry's form (see lib/stepwise.js for the order
  // and which steps are optional). A question with a short list of answers shows them as buttons (the lists are in
  // application.conv.en.js, `options`); anything else is spoken or typed (the microphone is always named first). Optional questions have a Skip button.
  // The tone is formal: no contractions, no "like" or "say", "for example" instead of "e.g.".
  // {your}, {Your}, {they}, {Is}, {cardholder} become "their" wording when the card is for someone else; {mobile} is the UAE PASS number.
  // Variation 1: the application one question at a time, in the order of the Ministry's form (see lib/stepwise.js for the order
  // and which steps are optional). Each step is the question (`text`), then on its own line how to answer it (`how`), then any
  // extra note (`note`). A question with a short list of answers shows them as buttons (the lists are in application.conv.en.js,
  // `options`; the line above them is `chipPrompts`); anything else is spoken or typed (the microphone is always named first).
  // Optional questions have a Skip button. The tone is formal: no contractions, no "like" or "say", "for example" instead of "e.g.".
  // {your}, {Your}, {they}, {Is}, {cardholder} become "their" wording when the card is for someone else; {mobile} is the UAE PASS number.
  steps: {
    cardholderEid: {
      kind: 'text',
      label: 'Their Emirates ID',
      text: 'As the card is for someone else, I require their 15-digit Emirates ID number.',
      how: 'Please provide it‹mic› using the microphone or by typing‹/mic›.',
      placeholder: 'Their Emirates ID, for example 784-1985-1234567-1',
      voiceSample: '784-1985-1234567-1',
      error: 'I was unable to read a 15-digit Emirates ID number, for example 784-1985-1234567-1. Please provide it again‹mic› using the microphone or by typing‹/mic›.',
    },
    cardholderDob: {
      kind: 'text',
      label: 'Their date of birth',
      text: 'What is their date of birth?',
      how: 'Please provide it‹mic› using the microphone or by typing‹/mic›, or select Skip if it is not available.',
      placeholder: 'Their date of birth, for example 15 May 1985',
      voiceSample: '15 May 1985',
      error: 'I was unable to read a date, for example 15 May 1985. Please provide it again‹mic› using the microphone or by typing‹/mic›, or select Skip.',
    },
    emirate: {
      kind: 'choice',
      optionsFrom: 'emirates',
      label: 'Emirate',
      text: 'Which emirate should the card be delivered to?',
      how: '‹mic›Alternatively, answer using the microphone or by typing.‹/mic›',
      placeholder: 'Enter or select the emirate…',
      voiceSample: 'Dubai',
      error: 'I was unable to identify the emirate. Please select one of the options below, or provide it‹mic› using the microphone or by typing‹/mic›.',
    },
    address: {
      kind: 'text',
      label: 'Delivery address and location',
      text: 'What is the delivery address and location for the card?',
      how: 'Please provide it‹mic› using the microphone or by typing‹/mic›.',
      note: 'The number {mobile} will be used as the delivery contact number.',
      placeholder: 'Delivery address, for example Villa 12, Street 5, Al Barsha 1',
      voiceSample: 'Villa 12, Street 5, Al Barsha 1',
      error: 'I require the delivery address and location, including the villa or building, street and area. Please provide it again‹mic› using the microphone or by typing‹/mic›.',
    },
    deliveryMobile: {
      kind: 'text',
      label: 'Delivery mobile number',
      text: 'Which mobile number should be used for the delivery?',
      how: 'Please provide it‹mic› using the microphone or by typing‹/mic›, including the country code if it is not a UAE number.',
      placeholder: 'Mobile number, for example 050 123 4567',
      voiceSample: '050 123 4567',
      error: 'I was unable to read a mobile number, for example 050 123 4567 or +971 50 123 4567. Please provide it again‹mic› using the microphone or by typing‹/mic›.',
    },
    disability: {
      kind: 'choice',
      optionsFrom: 'disability',
      label: 'Disability type',
      text: 'What is {your} disability type?',
      how: '‹mic›Alternatively, answer using the microphone or by typing.‹/mic›',
      placeholder: 'Enter or select the disability type…',
      voiceSample: 'Autism',
      error: 'I was unable to identify the disability type. Please select one of the options below, or provide it‹mic› using the microphone or by typing‹/mic›.',
    },
    photo: {
      kind: 'file',
      field: 'photo',
      label: 'Personal photograph',
      lead: 'Two documents are needed to complete your application.',
      leadOne: 'One more document is needed to complete your application.', // when the report is already in
      text: 'Please upload {your} personal photograph.',
      how: 'It should be a recent passport-size photograph with a white background, 2 × 6 cm.',
      placeholder: 'Upload the photograph above, or attach it here…',
      voiceSample: 'How do I upload it?',
      upload: { icon: 'camera', dropTitle: 'Drag and drop the photograph here', title: 'Personal photograph', hint: 'Recent passport-size photograph, white background, 2 × 6 cm · JPG or PNG · up to 10 MB', accept: 'image/jpeg,image/png', types: ['image/jpeg', 'image/png'], typeNames: 'a JPG or PNG', button: 'Choose photo' },
    },
    report: {
      kind: 'file',
      field: 'report',
      label: 'Medical or psychological report',
      lead: 'The photograph has been received.',
      text: 'Please upload {your} medical or psychological report.',
      how: 'It must be issued by an accredited official authority.',
      placeholder: 'Upload the report above, or attach it here…',
      voiceSample: 'How do I upload it?',
      upload: { icon: 'file', dropTitle: 'Drag and drop the report here', title: 'Medical or psychological report', hint: 'From an accredited authority · PDF or JPG · up to 10 MB', accept: 'application/pdf,image/jpeg', types: ['application/pdf', 'image/jpeg'], typeNames: 'a PDF or JPG', button: 'Choose report' },
    },
    additional: {
      kind: 'file',
      field: 'additional',
      label: 'Additional report',
      lead: 'Both documents have been received.',
      leadAgain: 'I have added {name}.',
      text: 'Would you like to upload an additional report?',
      how: 'Upload it below, or select Skip.',
      textAgain: 'Would you like to add another report?',
      placeholder: 'Upload an additional report above, or skip…',
      voiceSample: 'Skip',
      upload: { icon: 'file', dropTitle: 'Drag and drop an additional report here', title: 'Additional report', hint: 'PDF, JPG or PNG · up to 10 MB', accept: 'application/pdf,image/jpeg,image/png', types: ['application/pdf', 'image/jpeg', 'image/png'], typeNames: 'a PDF, JPG or PNG', button: 'Choose report' },
    },
    altMobile: {
      kind: 'text',
      label: 'Alternative mobile number',
      text: 'Is there an alternative mobile number that may be used?',
      how: 'Please provide it‹mic› using the microphone or by typing‹/mic›, including the country code if it is not a UAE number, or select Skip.',
      placeholder: 'Alternative number, for example 050 111 2222, or skip',
      voiceSample: '050 111 2222',
      error: 'I was unable to read a mobile number, for example 050 111 2222 or +971 50 111 2222. Please provide it again‹mic› using the microphone or by typing‹/mic›, or select Skip.',
    },
    eidExpiry: {
      kind: 'text',
      label: 'Emirates ID expiry date',
      text: 'What is the expiry date of your Emirates ID?',
      how: 'Please provide it‹mic› using the microphone or by typing‹/mic›, or select Skip.',
      placeholder: 'Expiry date, for example 20 March 2030, or skip',
      voiceSample: '20 March 2030',
      error: 'I was unable to read a date, for example 20 March 2030. Please provide it again‹mic› using the microphone or by typing‹/mic›, or select Skip.',
    },
    employmentStatus: {
      kind: 'choice',
      optionsFrom: 'employmentStatus',
      label: 'Employment status',
      text: 'What is {your} employment status?',
      how: '‹mic›Alternatively, answer using the microphone or by typing.‹/mic›',
      note: 'Select Skip to leave out employment and education.',
      placeholder: 'Employment status, or skip…',
      voiceSample: 'Student',
      error: 'I was unable to identify the employment status. Please select one of the options below, provide it‹mic› using the microphone or by typing‹/mic›, or select Skip.',
    },
    workSector: {
      kind: 'choice',
      optionsFrom: 'workSector',
      label: 'Work sector',
      text: 'Which sector {do} {they} work in?',
      how: '‹mic›Alternatively, answer using the microphone or by typing.‹/mic›',
      placeholder: 'Work sector, or skip…',
      voiceSample: 'Private',
      error: 'I was unable to identify the sector. Please select one of the options below, provide it‹mic› using the microphone or by typing‹/mic›, or select Skip.',
    },
    employer: {
      kind: 'text',
      label: 'Employer',
      text: 'Who is {your} employer?',
      how: 'Please provide it‹mic› using the microphone or by typing‹/mic›, or select Skip.',
      placeholder: 'Employer, or skip…',
      voiceSample: 'Al Noor Trading',
      error: 'I was unable to identify the employer. Please provide the name again‹mic› using the microphone or by typing‹/mic›, or select Skip.',
    },
    jobTitle: {
      kind: 'text',
      label: 'Job title',
      text: 'What is {your} job title?',
      how: 'Please provide it‹mic› using the microphone or by typing‹/mic›, or select Skip.',
      placeholder: 'Job title, or skip…',
      voiceSample: 'Accountant',
      error: 'I was unable to identify the job title. Please provide it again‹mic› using the microphone or by typing‹/mic›, or select Skip.',
    },
    educationLevel: {
      kind: 'choice',
      optionsFrom: 'educationLevel',
      label: 'Education level',
      text: 'What is {your} education level?',
      how: '‹mic›Alternatively, answer using the microphone or by typing.‹/mic›',
      placeholder: 'Education level, or skip…',
      voiceSample: 'Secondary',
      error: 'I was unable to identify the education level. Please select one of the options below, provide it‹mic› using the microphone or by typing‹/mic›, or select Skip.',
    },
    academicDegree: {
      kind: 'choice',
      optionsFrom: 'academicDegree',
      label: 'Academic degree',
      text: 'What is {your} highest academic degree?',
      how: '‹mic›Alternatively, answer using the microphone or by typing.‹/mic›',
      placeholder: 'Academic degree, or skip…',
      voiceSample: 'Bachelor’s degree',
      error: 'I was unable to identify the degree. Please select one of the options below, provide it‹mic› using the microphone or by typing‹/mic›, or select Skip.',
    },
    institutionLocation: {
      kind: 'choice',
      optionsFrom: 'institutionLocation',
      label: 'Institution location',
      text: 'Where is the educational institution: in an emirate, or outside the UAE?',
      how: '‹mic›Alternatively, answer using the microphone or by typing.‹/mic›',
      placeholder: 'Institution location, or skip…',
      voiceSample: 'Sharjah',
      error: 'I was unable to identify the location. Please select an emirate or “Outside the UAE”, provide it‹mic› using the microphone or by typing‹/mic›, or select Skip.',
    },
    // Both support questions in one card (the questions are in application.conv.en.js, groups.support.sections).
    support: {
      kind: 'choiceSet',
      label: 'Special education support and shadow teacher',
      text: 'Please answer the following.',
      placeholder: 'e.g. support yes, shadow teacher no, or skip…',
      voiceSample: 'Support yes, shadow teacher no',
    },
    specialSupport: {
      kind: 'choice',
      options: ['Yes', 'No'],
      label: 'Special education support',
      text: '{Is} {cardholder} receiving special education support?',
      how: '‹mic›Alternatively, answer using the microphone or by typing.‹/mic›',
      placeholder: 'Yes or no, or skip…',
      voiceSample: 'Yes',
      error: 'Please answer Yes or No‹mic› using the microphone or by typing‹/mic›, or select Skip.',
    },
    shadowTeacher: {
      kind: 'choice',
      options: ['Yes', 'No'],
      label: 'Shadow teacher',
      text: 'Is there a shadow teacher?',
      how: '‹mic›Alternatively, answer using the microphone or by typing.‹/mic›',
      placeholder: 'Yes or no, or skip…',
      voiceSample: 'No',
      error: 'Please answer Yes or No‹mic› using the microphone or by typing‹/mic›, or select Skip.',
    },
  },
  upload: {
    maxMb: 10,
    drop: 'or choose a file from your device',
    dropActive: 'Release to upload',
    errors: { type: 'That file type is not accepted. Please choose {types}.', size: 'That file is larger than 10 MB. Please choose a smaller one.' },
    nudge: 'Please use the button above to choose your file.',
  },

  review: {
    text: 'Please check them before you submit your application.',
    title: 'Review your application',
    fromUaePass: 'From UAE PASS',
    change: 'Change',
    consent: 'I confirm the information and documents provided are accurate to the best of my knowledge.',
    submit: 'Confirm and submit',
  },

  submit: {
    working: 'Sending your application to the Ministry…',
    done: 'Received by the Ministry’s platform',
    lead: 'Application submitted.',
    primary: 'You can ask me for its status at any time.',
    card: {
      title: 'Application submitted',
      numberLabel: 'Application number', // shown above the number (nothing under it)
      emailNote: 'You will also receive this application number by email.', // the last line of the card (no address, no icon)
      copy: 'Copy number',
      copied: 'Copied',
      trackerTitle: 'What happens next',
      steps: [
        { label: 'Eligibility check', state: 'done' },
        { label: 'Submitted', state: 'done' },
        { label: 'Review in progress', state: 'pending' },
        { label: 'Decision', state: 'pending' },
      ],
    },
    suggestion: 'Check application status',
    // As the team's Mira POD Assistant prototype shows it (Variation 2).
    mira: {
      subtitle: 'Thank you, {first}. We received it on {date}.',
      confirm: 'A confirmation has been sent to {email} and by SMS to {mobile}.',
      next: 'What happens next',
      copy: 'Copy',
      copied: 'Copied',
      timeline: [
        ['Submitted', 'Application received'],
        ['Review in progress', 'Application under review'],
        ['Decision', 'You’ll be notified by email and SMS'],
        ['Card issued', 'Delivered to your residential address'],
      ],
      actions: { status: 'Check status', apps: 'View all applications' },
    },
  },

  // The one question asked after UAE PASS: who the card is for. For someone else the Emirates ID and date of birth are asked next
  // (UAE PASS gives only the applicant's own details); for the person themselves nothing more is asked.
  who: {
    lead: 'I just need to confirm one thing.',
    question: 'Is this application for yourself or for someone else?',
    how: 'I will use your UAE PASS details. If it is for someone else, I will ask for a few more.',
    signedIn: 'Thank you. I have your details from UAE PASS.',
    myself: 'Myself',
    other: 'Someone else',
    placeholder: 'Reply “myself” or “someone else”…',
    voiceSample: 'It is for myself',
    nudge: 'Please say whether this application is for yourself or for someone else.',
    // APPROX: everyday words for each answer (matched at the start of a word).
    match: {
      self: ['myself', 'for me', 'my own', 'me'],
      other: ['someone else', 'somebody else', 'another person', 'on behalf', 'behalf', 'child', 'son', 'daughter', 'kid', 'under 18', 'boy', 'girl', 'mother', 'father', 'parent', 'brother', 'sister', 'wife', 'husband', 'relative', 'friend', 'guardian'],
    },
  },

  // Someone who comes back to an application they did not finish (the "returning" testing scenario, see demo.en.js): Mira asks
  // whether to continue or start again; on "continue" she shows what was entered earlier, then asks the next question.
  resume: {
    question: 'You started an application earlier. Would you like to continue it, or discard it and start again?',
    how: 'You stopped at the {stage} step. Your earlier answers have been kept.',
    continue: 'Continue my application',
    again: 'Discard & start again',
    placeholder: 'Reply “continue” or “discard”…',
    voiceSample: 'Continue my application',
    summary: 'Welcome back. Here are the details you entered earlier.',
    groups: { uaepass: 'From UAE PASS', who: 'Application' },
    icons: { uaepass: 'user', who: 'check' },
    // APPROX: everyday words for each answer (matched at the start of a word).
    match: {
      again: ['discard', 'start again', 'start over', 'begin again', 'from the beginning', 'restart', 'new application', 'no'],
      continue: ['continue', 'resume', 'carry on', 'where i stopped', 'pick up', 'yes'],
    },
  },

  // When the applicant cannot go on: the card is for Emirati citizens and UAE residents with a report from an accredited authority.
  // Found out as the application goes: from "I do not have the report", or from the reading of the report (see `reading.notAccredited`).
  // Citizenship and residency are never asked (UAE PASS tells them for the person signed in).
  notEligible: {
    question: 'You are not eligible for the POD card at this stage.',
    how: 'If you think this is a mistake, our support team can help.',
    reasons: {
      noReport: 'A medical or psychological report is required to apply.', // each reason is one short line
      notAccredited: 'The report must come from an accredited authority.',
    },
  },

  // Everything given in the first message (name, Emirates ID, mobile, email, delivery address, who it is for, both documents): UAE PASS
  // still comes first, so that the details given can be checked against it; then Mira goes on to what is still missing.
  // APPROX: the details are not read from the message and compared; the sample person's are used, and they always match.
  upfront: {
    signIn: {
      lead: 'Thank you. I have read your message.',
      primary: 'Before I go on, please sign in with UAE PASS so that I can check the details you gave.',
      description: 'UAE PASS confirms your name, Emirates ID, mobile number and email, to check what you have told me. You’ll see everything before anything is submitted.',
    },
    text: 'Thank you. The details in your message match your UAE PASS details.',
    mira: { welcome: 'Thank you, {first}', signedIn: 'Your message matches your UAE PASS details.', tag: 'Checked with UAE PASS', note: 'You can change any of these before you submit.' },
    reviewTag: 'From your message',
  },

  // After the two documents are in, Mira "reads" them and says which disability type the report names; the person confirms it or
  // changes it. The reading is simulated: nothing is read from the files. APPROX: the type is taken from words in the report's file
  // name (the first that matches), otherwise it is the sample type; a real service would read the report itself.
  reading: {
    ms: 5500, // how long the reading takes: an equal share for each step and for the last line
    text: 'Thank you. I am now reading your documents. This will take a moment.',
    title: 'Reading your documents',
    steps: ['Checking your personal photograph', 'Opening your report', 'Reading the report', 'Identifying the disability type'],
    done: 'Document scan completed',
    sample: 'Physical',
    // A report whose file name says it is from a private clinic is found not to be from an accredited authority (APPROX: a real
    // service would read the report): the person is told they are not eligible.
    notAccredited: 'private|clinic|unaccredited|non.?accredited|not.?accredited',
    detect: [
      ['autis', 'Autism'],
      ['hearing.?visual|deaf.?blind', 'Hearing-Visual'],
      ['hear|deaf', 'Hearing'],
      ['visual|vision|blind|eye', 'Visual'],
      ['intellect|down', 'Intellectual'],
      ['adhd|attention', 'ADHD'],
      ['psychi|mental', 'Psychiatric'],
      ['learning|dyslex', 'Specific learning disorder'],
      ['speech|communic|language', 'Communication Disorder'],
      ['physical|mobility|motor|wheel', 'Physical'],
    ],
    // three lines, as body copy, the type in bold, and the question as body copy again
    intro: 'Disability type',
    question: 'Do you confirm this, or would you like to change it?',
    confirm: 'Confirm',
    change: 'Change it',
    placeholder: 'Reply “yes”, or say the correct type…',
    voiceSample: 'Yes, that is correct',
    nudge: 'Please confirm the disability type, or say the correct type.',
  },

  nudges: {
    choice: 'I was unable to identify that. Please select one of the options, or provide it‹mic› using the microphone or by typing‹/mic›.',
  },

  // Variation 2: the application as a conversation (see application.conv.en.js).
  conv,
};
