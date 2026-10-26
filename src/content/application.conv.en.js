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
      self: 'I’ve filled in your details from UAE PASS (name, Emirates ID, nationality, mobile and email), so you do not need to enter them again.',
      other: 'I’ve filled in your details as the applicant from UAE PASS (name, mobile and email), so you do not need to enter them again.',
    },
  },

  // Just before the UAE PASS button: what is shared depends on who the card is for.
  apply: {
    self: {
      lead: 'Thank you. To continue, please sign in.',
      primary: 'To fill in your details for you, I’ll ask you to sign in with UAE PASS.',
      secondary: 'Your name, Emirates ID, nationality, mobile and email are filled in for you.',
      description: 'UAE PASS shares your name, Emirates ID, nationality, mobile and email. You’ll review everything before anything is submitted.',
    },
    other: {
      lead: 'Thank you. To continue, please sign in.',
      primary: 'You’ll sign in as the applicant, so I’ll use UAE PASS for your own details.',
      secondary: 'Your name, mobile and email are filled in for you. Their Emirates ID and date of birth are not part of your UAE PASS, so I’ll ask you for those next.',
      description: 'UAE PASS shares your name, mobile and email. Their details are not shared, so you’ll enter them yourself. You’ll review everything before anything is submitted.',
    },
  },

  ackLead: 'Thank you. I’ve noted {list}.',
  plainLead: 'Thank you.',
  more: 'I still need {list}.',
  exampleLabel: 'For example:',
  nudgeLead: 'I didn’t catch that.',
  nudge: 'Please tell me {list}.',
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
  groups: {
    cardholder: {
      ask: 'Because the card is for someone else, I need their Emirates ID number (15 digits). Their date of birth helps too, if you have it.',
      example: '784-1985-1234567-1, born 15 May 1985',
      placeholder: 'e.g. 784-1985-1234567-1, born 15 May 1985',
      voiceSample: 'Their Emirates ID is 784-1985-1234567-1 and they were born on 15 May 1985',
      need: { cardholderEid: 'their 15-digit Emirates ID number' },
    },
    delivery: {
      ask: 'Next, the delivery. Please tell me the emirate and the delivery address and location for the card. I’ll use {mobile} as the delivery contact number.',
      example: 'Dubai, Villa 12, Street 5, Al Barsha 1',
      placeholder: 'e.g. Dubai, Villa 12, Street 5, Al Barsha 1',
      voiceSample: 'Dubai, Villa 12, Street 5, Al Barsha 1',
      need: { emirate: 'the emirate', address: 'the delivery address and location' },
    },
    disability: {
      ask: 'What is {your} disability type? You can choose one below, or type it.',
      placeholder: 'Type the disability type…',
      voiceSample: 'Autism',
      need: { disability: 'the disability type' },
    },
    extras: {
      optional: true,
      ask: 'A few optional details. You can add an alternative mobile number, {your} Emirates ID expiry date, and any additional reports (attach them with the paperclip). Reply “skip” to leave them out.',
      askOther: 'A few optional details. You can add an alternative mobile number and any additional reports (attach them with the paperclip). Reply “skip” to leave them out.',
      example: '050 111 2222, expires 20 March 2030',
      exampleOther: '050 111 2222',
      placeholder: 'Add details, attach reports, or reply “skip”…',
      voiceSample: 'My alternative number is 050 111 2222 and my Emirates ID expires on 20 March 2030',
    },
    employment: {
      optional: true,
      ask: 'Optional: what is {your} employment status? For example employed, self-employed, student or not employed. Reply “skip” to leave out employment and education.',
      placeholder: 'Employment status, or reply “skip”…',
      voiceSample: 'Student',
    },
    workplace: {
      optional: true,
      ask: 'Which sector {do} {they} work in (government, semi-government, private or non-profit), who is the employer, and what is the job title? Reply “skip” to leave this out.',
      example: 'Private sector, Al Noor Trading, accountant',
      placeholder: 'Sector, employer and job title, or reply “skip”…',
      voiceSample: 'Private sector, Al Noor Trading, accountant',
    },
    education: {
      optional: true,
      ask: 'And {your} education: the education level (for example primary, secondary or higher education) and where the institution is, in an emirate or outside the UAE. Reply “skip” to leave this out.',
      askEmployed: 'And {your} education: the education level, the highest academic degree, and where the institution is, in an emirate or outside the UAE. Reply “skip” to leave this out.',
      example: 'Secondary, in Sharjah',
      exampleEmployed: 'Higher education, bachelor’s degree, in Dubai',
      placeholder: 'Education details, or reply “skip”…',
      voiceSample: 'Secondary, in Sharjah',
    },
    support: {
      optional: true,
      ask: 'Last one. {Is} {cardholder} receiving special education support, and is there a shadow teacher? You can answer yes or no to each. Reply “skip” to leave this out.',
      example: 'Support yes, shadow teacher no',
      placeholder: 'e.g. support yes, shadow teacher no, or “skip”…',
      voiceSample: 'Support yes, shadow teacher no',
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
  editPlaceholder: 'Type the new value…',
  editVoiceSample: 'Sharjah',

  docs: {
    lead: 'Good progress.',
    text: 'Please attach {your} personal photograph (a recent passport-size photograph with a white background, 2 × 6 cm) and the medical or psychological report. You can send both together with the paperclip.',
    one: 'I still need {your} {missing}. You can attach it with the paperclip.',
    names: { photo: 'photograph', report: 'report' },
    yourNames: { photo: 'the photograph', report: 'the report' },
    card: {
      title: 'Documents',
      button: 'Attach files',
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
    additionalNoted: 'I’ve added {name} as an additional report.',
    editPrompt: {
      photo: 'Please upload the new personal photograph: a recent passport-size photograph with a white background, 2 × 6 cm.',
      report: 'Please upload the new medical or psychological report.',
    },
  },

  review: {
    lead: 'Thank you, that is everything I need.',
    summarySelf: 'Here is your application. You are applying for yourself, as {name}. The card will be delivered to {where}, and I’ll use {phone} as the delivery contact. Your disability type is {disability}, and your photograph and report are attached.',
    summaryOther: 'Here is your application. You are applying on behalf of someone else (Emirates ID {eid}), and you are the applicant, {name}. The card will be delivered to {where}, and I’ll use {phone} as the delivery contact. Their disability type is {disability}, and the photograph and report are attached.',
    extras: 'I’ve also added {list}.',
    ask: 'Shall I submit it? Reply “yes”, or tell me what to change.',
    askAgain: 'Shall I submit it now? Reply “yes”, or tell me what else to change.',
    example: '“change the delivery address to Villa 5, Al Nahda, Sharjah”',
    updated: 'Done. I’ve updated {list}.',
    placeholder: 'Reply “yes” to submit, or tell me what to change…',
    voiceSample: 'Yes, submit it',
    nudgeLead: 'I didn’t catch which detail to change.',
    nudge: 'You can tell me what to change.',
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
    multi: 'Shall we carry on with your application? I’m still waiting for your answer above.',
    docs: 'Shall we carry on with your application? I still need your {list}.',
    confirm: 'Shall we carry on with your application? Reply “yes” to submit, or tell me what to change.',
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
    institutionLocation: [
      ...emirates.map((v) => ({ value: v, aliases: v === 'Ras Al Khaimah' ? ['rak'] : v === 'Umm Al Quwain' ? ['uaq'] : [] })),
      { value: 'Outside the UAE', aliases: ['outside the uae', 'abroad', 'overseas', 'outside uae'] },
    ],
  },
};
