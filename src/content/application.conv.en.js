// Variation 2: the POD application as a conversation. The fields follow the Ministry's existing application form
// ("New POD New Card Service"): applicant details, cardholder details (on behalf only), request details, disability,
// documents, and the optional employment and education section. The questions are grouped, so the chatbot asks two or
// three things at a time instead of the whole form at once. These are asked only after the eligibility check and the
// UAE PASS sign-in.
//
// What UAE PASS shares (docs.uaepass.ae, attributes list): full name, Emirates ID number, nationality, gender, mobile and
// email. It does NOT list a date of birth or an Emirates ID expiry date, so those are asked, not shown.
//
// Sources: the disability types and their order are the Ministry's list. Every other option list below is APPROX
// (the form's dropdown values were not available) and must be replaced with the real lists before launch.

const emirates = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

export const conv = {
  skip: 'Skip',

  // The rows shown under "Your details from UAE PASS" (ids of application.signIn.profile.rows; no date of birth).
  // When someone applies on behalf of someone else they are only the applicant: the form uses just their name, mobile and email.
  // The other person's Emirates ID and date of birth are not in their UAE PASS, so they are asked for.
  profileRows: {
    self: ['name', 'eid', 'nationality', 'gender', 'mobile', 'email'],
    other: ['name', 'mobile', 'email'],
  },
  signIn: {
    title: 'Your details from UAE PASS',
    primary: {
      self: 'I have filled in your details from UAE PASS (name, Emirates ID, nationality, mobile and email), so you do not need to enter them again.',
      other: 'I have filled in your details as the applicant from UAE PASS (name, mobile and email), so you do not need to enter them again.',
    },
  },

  // Just before the UAE PASS button: what is shared depends on who the card is for.
  apply: {
    self: {
      question: 'To continue, please sign in with UAE PASS.',
      primary: 'To fill in your details for you, I will ask you to sign in with UAE PASS.',
      secondary: 'Your name, Emirates ID, nationality, mobile and email are filled in for you.',
      description: 'UAE PASS shares your name, Emirates ID, nationality, mobile and email. You will review everything before anything is submitted.',
    },
    other: {
      question: 'To continue, please sign in with UAE PASS.',
      primary: 'You will sign in as the applicant, so I will use UAE PASS for your own details.',
      secondary: 'Your name, mobile and email are filled in for you. Their Emirates ID and date of birth are not part of your UAE PASS, so I will ask you for those next.',
      description: 'UAE PASS shares your name, mobile and email. Their details are not shared, so you’ll enter them yourself. You will review everything before anything is submitted.',
    },
  },

  // Said only after a typed or spoken answer, to show what was understood; a chosen option is not repeated back.
  ackLead: 'I have noted {list}.',
  // The line above a row of chips: it names what the chips answer.
  // An answer that gets its own section under the rest of the chips, with a line of its own.
  chipExtras: { disability: { prompt: 'If there is more than one disability, select:', options: ['Multiple'] } },
  chipPrompts: {
    emirate: 'Select the emirate:',
    disability: 'Select the disability type:',
    employmentStatus: 'Select the employment status:',
    workSector: 'Select the work sector:',
    educationLevel: 'Select the education level:',
    academicDegree: 'Select the highest academic degree:',
    institutionLocation: 'Select the location of the institution:',
    specialSupport: 'Select Yes or No for special education support:',
    shadowTeacher: 'Select Yes or No for shadow teacher:',
  },
  // After part of a question was answered (what was understood is said first): the polite request for the rest.
  more: 'Could you please also provide {list}?',
  moreHow: '‹mic›You may use the microphone or type your answer.‹/mic›',
  moreHowChips: 'Please select an option below‹mic›, or use the microphone or type your answer‹/mic›.',
  exampleLabel: 'For example:',
  nudgeLead: 'I am sorry, I was unable to understand that.',
  nudge: 'Could you please provide {list}‹mic›, using the microphone or by typing‹/mic›?',
  // Said after the question when it can be left out (regular weight, in brackets).
  optionalTag: '(optional)',
  nudgeOptional: 'You can answer, or reply “skip” to leave this out.',

  // What was just taken, in a sentence. {v} is the value.
  noted: {
    cardholderEid: '{v} as their Emirates ID',
    cardholderDob: '{v} as their date of birth',
    emirate: '{v} as the delivery emirate',
    address: '“{v}” as the delivery address',
    deliveryMobile: '{v} as the delivery contact number',
    disability: '{v} as the disability type',
    altMobile: '{v} as an alternative number',
    eidExpiry: '{v} as the Emirates ID expiry date',
    employmentStatus: '{v} as the employment status',
    workSector: '{v} as the work sector',
    employer: '{v} as the employer',
    jobTitle: '{v} as the job title',
    academicDegree: '{v} as the academic degree',
    educationLevel: '{v} as the education level',
    institutionLocation: '{v} as the institution location',
    specialSupport: 'special education support: {v}',
    shadowTeacher: 'shadow teacher: {v}',
  },

  // The questions, in the order they are asked. {your}, {Your}, {you} and {they} become "their" wording when the card is for someone else.
  // Each question: `ask` (the question), `items` (what it asks for, shown as a numbered list when there are several), `how` (how to
  // answer) and `note`. `itemsOther` / `itemsEmployed` are the lists for someone else / someone who works.
  groups: {
    cardholder: {
      ask: 'Because the card is for someone else, I require the following details.',
      items: ['Their Emirates ID number (15 digits)', 'Their date of birth (if available)'],
      how: 'Please provide them‹mic›, using the microphone or by typing‹/mic›.',
      example: '784-1985-1234567-1, born 15 May 1985',
      placeholder: 'e.g. 784-1985-1234567-1, born 15 May 1985',
      voiceSample: 'Their Emirates ID is 784-1985-1234567-1 and they were born on 15 May 1985',
      need: { cardholderEid: 'their 15-digit Emirates ID number' },
    },
    delivery: {
      ask: 'Where should the card be delivered?',
      items: ['Emirate', 'Delivery address and location'],
      how: 'Select the emirate below, or provide both in one message‹mic›, using the microphone or by typing‹/mic›.',
      note: 'The number {mobile} will be used as the delivery contact number.',
      example: 'Dubai, Villa 12, Street 5, Al Barsha 1',
      placeholder: 'e.g. Dubai, Villa 12, Street 5, Al Barsha 1',
      voiceSample: 'Dubai, Villa 12, Street 5, Al Barsha 1',
      need: { emirate: 'the emirate', address: 'the delivery address and location' },
    },
    disability: {
      ask: 'What is {your} disability type?',
      how: 'Select one of the options below, or provide it‹mic›, using the microphone or by typing‹/mic›.',
      placeholder: 'Speak or type the disability type…',
      voiceSample: 'Autism',
      need: { disability: 'the disability type' },
    },
    extras: {
      optional: true,
      ask: 'Would you like to provide any further details?',
      items: ['Alternative mobile number', '{Your} Emirates ID expiry date', 'Additional reports (attach them using the paperclip)'],
      itemsOther: ['Alternative mobile number', 'Additional reports (attach them using the paperclip)'],
      how: 'Reply “skip” to leave them out.',
      example: '050 111 2222, expires 20 March 2030',
      exampleOther: '050 111 2222',
      placeholder: 'Add details, attach reports, or reply “skip”…',
      voiceSample: 'My alternative number is 050 111 2222 and my Emirates ID expires on 20 March 2030',
    },
    employment: {
      optional: true,
      ask: 'What is {your} employment status?',
      how: 'Select one of the options below, or provide it‹mic›, using the microphone or by typing‹/mic›. Reply “skip” to leave out employment and education.',
      placeholder: 'Employment status, or reply “skip”…',
      voiceSample: 'Student',
    },
    workplace: {
      optional: true,
      ask: 'Where {do} {they} work?',
      items: ['Sector', 'Employer', 'Job title'],
      how: 'Select the sector below, or provide all three in one message‹mic›, using the microphone or by typing‹/mic›. Reply “skip” to leave this out.',
      example: 'Private sector, Al Noor Trading, accountant',
      placeholder: 'Sector, employer and job title, or reply “skip”…',
      voiceSample: 'Private sector, Al Noor Trading, accountant',
      need: { workSector: 'the work sector', employer: 'the employer', jobTitle: 'the job title' },
    },
    education: {
      optional: true,
      ask: 'What is {your} education?',
      items: ['Education level', 'Location of the institution (in an emirate, or outside the UAE)'],
      itemsEmployed: ['Education level', 'Highest academic degree', 'Location of the institution (in an emirate, or outside the UAE)'],
      how: 'Select the education level below, or provide the details in one message‹mic›, using the microphone or by typing‹/mic›. Reply “skip” to leave this out.',
      example: 'Secondary, in Sharjah',
      exampleEmployed: 'Higher education, bachelor’s degree, in Dubai',
      placeholder: 'Education details, or reply “skip”…',
      voiceSample: 'Secondary, in Sharjah',
      need: { educationLevel: 'the education level', academicDegree: 'the highest academic degree', institutionLocation: 'the location of the institution' },
    },
    support: {
      optional: true,
      ask: 'Please answer the following.',
      // Independent questions: asked together in one card, each with its own Yes / No (the question is filled for who the card is for).
      sections: [
        { field: 'specialSupport', question: '{Is} {cardholder} receiving special education support?' },
        { field: 'shadowTeacher', question: 'Is there a shadow teacher?' },
      ],
      placeholder: 'e.g. support yes, shadow teacher no, or “skip”…',
      voiceSample: 'Support yes, shadow teacher no',
      need: { specialSupport: 'whether special education support is received', shadowTeacher: 'whether there is a shadow teacher' },
    },
  },

  // Asking for one field again (from Change, or "change my …").
  edit: {
    cardholderEid: 'What is their Emirates ID number (15 digits)?',
    cardholderDob: 'What is their date of birth?',
    emirate: 'Which emirate should the card be delivered to?',
    address: 'What is the delivery address and location?',
    deliveryMobile: 'Which mobile number should be used for the delivery?',
    disability: 'What is {your} disability type?',
    altMobile: 'What is the alternative mobile number?',
    eidExpiry: 'What is the Emirates ID expiry date?',
    employmentStatus: 'What is {your} employment status?',
    workSector: 'Which work sector?',
    employer: 'Who is the employer?',
    jobTitle: 'What is the job title?',
    academicDegree: 'What is the highest academic degree?',
    educationLevel: 'What is the education level?',
    institutionLocation: 'Where is the educational institution, in which emirate or outside the UAE?',
    specialSupport: '{Is} {cardholder} receiving special education support?',
    shadowTeacher: 'Is there a shadow teacher?',
  },
  editPlaceholder: 'Speak or type the new value…',
  editVoiceSample: 'Sharjah',

  docs: {
    text: 'Please attach {your} personal photograph and the medical or psychological report.',
    how: 'Upload each document below, or send both together using the paperclip. I will continue once both are uploaded.',
    one: 'I still require {your} {missing}.',
    oneHow: 'Upload it below, or attach it using the paperclip.',
    names: { photo: 'photograph', report: 'report' },
    yourNames: { photo: 'the photograph', report: 'the report' },
    card: {
      title: 'Documents',
      uploadLabel: 'Upload', // the button on each document's row
      removeLabel: 'Remove', // the delete icon, for screen readers: "Remove Personal photograph"
      items: {
        photo: { label: 'Personal photograph', hint: 'Recent passport-size photograph, white background, 2 × 6 cm · JPG or PNG' },
        report: { label: 'Medical or psychological report', hint: 'From an accredited authority · PDF or JPG' },
      },
    },
    placeholder: 'Attach the photograph and report with the paperclip…',
    voiceSample: 'How do I attach my files?',
    nudge: 'Please attach your files with the paperclip. They stay on your device until you submit.',
    wrongType: { photo: 'The photograph needs to be a JPG or PNG.', report: 'The report needs to be a PDF or JPG.' },
    extra: 'I used the first file of each kind and set the others aside.',
    additionalNoted: 'I have added {name} as an additional report.',
    editPrompt: {
      photo: 'Please upload the new personal photograph: a recent passport-size photograph with a white background, 2 × 6 cm.',
      report: 'Please upload the new medical or psychological report.',
    },
  },

  review: {
    lead: 'That is everything I require.',
    // The line under the opener. (The confirmation in the card above the submit button is `review.consent` in application.en.js.)
    intro: 'Below are all the details I have recorded so far.',
    example: '“change the delivery address to Villa 5, Al Nahda, Sharjah”',
    updated: 'Done. I have updated {list}.',
    placeholder: 'Reply “yes” to submit, or state what to change…',
    voiceSample: 'Yes, submit it',
    nudgeLead: 'I was unable to identify which detail to change.',
    nudge: 'Please state what you would like to change‹mic›, using the microphone or by typing‹/mic›.',
    holdLead: 'No problem.',
    hold: 'What would you like to change?',
    changed: {
      cardholderEid: 'their Emirates ID to {v}',
      cardholderDob: 'their date of birth to {v}',
      emirate: 'the emirate to {v}',
      address: 'the delivery address',
      deliveryMobile: 'the delivery number to {v}',
      disability: 'the disability type to {v}',
      altMobile: 'the alternative number to {v}',
      eidExpiry: 'the Emirates ID expiry to {v}',
      employmentStatus: 'the employment status to {v}',
      workSector: 'the work sector to {v}',
      employer: 'the employer to {v}',
      jobTitle: 'the job title to {v}',
      academicDegree: 'the academic degree to {v}',
      educationLevel: 'the education level to {v}',
      institutionLocation: 'the institution location to {v}',
      specialSupport: 'special education support to {v}',
      shadowTeacher: 'the shadow teacher to {v}',
    },
    groups: { applicant: 'Applicant details', cardholder: 'Cardholder', request: 'Request details', disability: 'Disability', docs: 'Documents', optional: 'Optional details', work: 'Employment and education' },
    labels: {
      applyingFor: 'Applying for',
      name: 'Applicant full name',
      eid: 'Emirates ID',
      nationality: 'Nationality',
      gender: 'Gender',
      mobile: 'Mobile',
      email: 'Email',
      cardholderEid: 'Cardholder Emirates ID',
      cardholderDob: 'Cardholder date of birth',
      emirate: 'Emirate',
      address: 'Delivery address and location',
      deliveryMobile: 'Delivery mobile number',
      disability: 'Disability type',
      photo: 'Personal photograph',
      report: 'Medical or psychological report',
      additional: 'Additional reports',
      altMobile: 'Alternative mobile number',
      eidExpiry: 'Emirates ID expiry date',
      employmentStatus: 'Employment status',
      workSector: 'Work sector',
      employer: 'Employer',
      jobTitle: 'Job title',
      academicDegree: 'Academic degree',
      educationLevel: 'Education level',
      institutionLocation: 'Institution location',
      specialSupport: 'Special education support',
      shadowTeacher: 'Shadow teacher',
    },
    forSelf: 'Myself',
    forOther: 'Someone else',
  },

  // After an answer to a question asked mid-application, Mira brings the person back.
  resume: {
    multi: 'Shall we continue with your application? I am still awaiting your answer above.',
    docs: 'Shall we continue with your application? I still require your {list}.',
    confirm: 'Shall we continue with your application? Please reply “yes” to submit, or state what you would like to change.',
  },

  // Option lists. APPROX unless noted. `aliases` are other ways people may say the same thing.
  options: {
    emirates: emirates.map((v) => ({ value: v, aliases: v === 'Ras Al Khaimah' ? ['rak'] : v === 'Umm Al Quwain' ? ['uaq'] : [] })),
    // The Ministry's disability types, in the system's order (codes 01 to 11). Aliases are APPROX everyday words.
    disability: [
      { value: 'Intellectual', aliases: ['intellectual', 'down syndrome', 'cognitive'] },
      { value: 'Hearing', aliases: ['hearing', 'deaf', 'hard of hearing'] },
      { value: 'Visual', aliases: ['visual', 'blind', 'low vision'] },
      { value: 'Physical', aliases: ['physical', 'wheelchair', 'mobility'] },
      { value: 'Autism', aliases: ['autism', 'autistic', 'asd', 'autism spectrum'] },
      { value: 'Multiple', aliases: ['multiple', 'more than one'] },
      { value: 'Communication Disorder', aliases: ['communication', 'speech', 'language disorder'] },
      { value: 'ADHD', aliases: ['adhd', 'attention deficit', 'hyperactivity'] },
      { value: 'Hearing-Visual', aliases: ['hearing-visual', 'hearing visual', 'hearing and visual', 'deaf-blind', 'deafblind', 'deaf blind'] },
      { value: 'Psychiatric', aliases: ['psychiatric', 'mental health'] },
      { value: 'Specific learning disorder', aliases: ['specific learning', 'learning disorder', 'dyslexia', 'dyscalculia', 'dysgraphia', 'learning difficulty'] },
    ],
    // APPROX: the form's dropdown values for the optional section were not available.
    employmentStatus: [
      { value: 'Employed', aliases: ['employed', 'working', 'employee'] },
      { value: 'Self-employed', aliases: ['self-employed', 'self employed', 'own business', 'freelance'] },
      { value: 'Student', aliases: ['student', 'studying', 'in school', 'at school', 'in university'] },
      { value: 'Not employed', aliases: ['not employed', 'unemployed', 'not working', 'jobless'] },
      { value: 'Retired', aliases: ['retired'] },
    ],
    workSector: [
      { value: 'Government', aliases: ['government', 'federal', 'public sector'] },
      { value: 'Semi-government', aliases: ['semi-government', 'semi government', 'semi-governmental'] },
      { value: 'Private', aliases: ['private'] },
      { value: 'Non-profit', aliases: ['non-profit', 'nonprofit', 'non profit', 'charity'] },
    ],
    academicDegree: [
      { value: 'High school or below', aliases: ['high school', 'secondary certificate', 'below high school'] },
      { value: 'Diploma', aliases: ['diploma'] },
      { value: 'Bachelor’s degree', aliases: ['bachelor', 'bachelors', 'undergraduate'] },
      { value: 'Master’s degree', aliases: ['master', 'masters', 'postgraduate'] },
      { value: 'Doctorate', aliases: ['doctorate', 'phd', 'doctoral'] },
    ],
    educationLevel: [
      { value: 'Pre-school', aliases: ['pre-school', 'preschool', 'kindergarten', 'nursery'] },
      { value: 'Primary', aliases: ['primary', 'elementary'] },
      { value: 'Preparatory', aliases: ['preparatory', 'middle school', 'intermediate'] },
      { value: 'Secondary', aliases: ['secondary', 'high school'] },
      { value: 'Higher education', aliases: ['higher education', 'university', 'college'] },
      { value: 'Not in education', aliases: ['not in education', 'not studying', 'no education'] },
    ],
    yesNo: [
      { value: 'Yes', aliases: [] },
      { value: 'No', aliases: [] },
    ],
    institutionLocation: [
      ...emirates.map((v) => ({ value: v, aliases: v === 'Ras Al Khaimah' ? ['rak'] : v === 'Umm Al Quwain' ? ['uaq'] : [] })),
      { value: 'Outside the UAE', aliases: ['outside the uae', 'abroad', 'overseas', 'outside uae'] },
    ],
  },
};
