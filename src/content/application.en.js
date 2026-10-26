// POD application, applying for yourself, entirely inside the conversation.
// Source: Figma "Applying for Myself" flow (applicant details → contact → documents → review & submit)
// and the journey map (Identity & access → Assemble → Approve & consent → Submit → application number).
// SAMPLE DATA: there is no UAE PASS or Ministry integration yet; the person below is made up.

export const application = {
  signIn: {
    // Simulated wait while the person approves in the UAE PASS app (the real hand-off is not built).
    wait: {
      ms: 15000,
      lead: 'Thank you. Opening UAE PASS now.',
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

  steps: {
    emirate: {
      kind: 'choice',
      label: 'Emirate',
      lead: 'Thank you, your details have been retrieved.',
      text: 'Which emirate do you live in?',
      placeholder: 'Enter or select your emirate…',
      voiceSample: 'Dubai',
      options: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'],
    },
    emergencyName: {
      kind: 'text',
      label: 'Emergency contact name',
      lead: 'Thank you, your emirate is noted.',
      text: 'Who should we contact in an emergency? Please type their full name.',
      placeholder: 'Enter the contact’s full name…',
      voiceSample: 'Fatima Al Ketbi',
      error: 'I need a name with at least two letters. Could you type it again?',
    },
    emergencyPhone: {
      kind: 'text',
      label: 'Emergency contact number',
      lead: 'Thank you, that contact is noted.',
      text: 'And their mobile number? Please include the country code.',
      placeholder: 'Mobile number, e.g. +971 50 123 4567',
      voiceSample: '+971 50 765 4321',
      error: 'I need the number with its country code, like +971 50 123 4567. Could you type it again?',
    },
    photo: {
      kind: 'file',
      field: 'photo',
      label: 'Personal photograph',
      lead: 'Good progress. Two documents are needed to complete your application.',
      leadOne: 'Good progress. One more document is needed to complete your application.', // when the report is already in
      text: 'Please upload your personal photograph: a passport-size photo with a white background.',
      placeholder: 'Upload your photograph above, or attach it here…',
      voiceSample: 'How do I upload it?',
      upload: { icon: 'camera', dropTitle: 'Drag and drop your photograph here', title: 'Personal photograph', hint: 'JPG or PNG · up to 10 MB', accept: 'image/jpeg,image/png', types: ['image/jpeg', 'image/png'], typeNames: 'a JPG or PNG', button: 'Choose photo' },
    },
    report: {
      kind: 'file',
      field: 'report',
      label: 'Medical or psychological report',
      lead: 'Thank you, your photograph has been received.',
      text: 'Now your medical or psychological report, issued by an accredited official authority.',
      placeholder: 'Upload your report above, or attach it here…',
      voiceSample: 'How do I upload it?',
      upload: { icon: 'file', dropTitle: 'Drag and drop your report here', title: 'Medical or psychological report', hint: 'PDF or JPG · up to 10 MB', accept: 'application/pdf,image/jpeg', types: ['application/pdf', 'image/jpeg'], typeNames: 'a PDF or JPG', button: 'Choose report' },
    },
  },
  upload: {
    maxMb: 10,
    drop: 'or choose a file from your device',
    dropActive: 'Release to upload',
    errors: { type: 'That file type isn’t accepted. Please choose {types}.', size: 'That file is larger than 10 MB. Please choose a smaller one.' },
    nudge: 'Please use the button above to choose your file. It stays on your device until you submit.',
  },

  review: {
    lead: 'Thank you. That is all the information I need.',
    text: 'Please check your application before you submit it.',
    title: 'Review your application',
    groups: { details: 'Applicant details', contact: 'Contact information', docs: 'Documents' },
    labels: {
      applyingFor: 'Applying for',
      name: 'Full name',
      gender: 'Gender',
      dob: 'Date of birth',
      nationality: 'Nationality',
      eid: 'Emirates ID',
      emirate: 'Emirate',
      mobile: 'Mobile',
      email: 'Email',
      emergencyName: 'Emergency contact',
      emergencyPhone: 'Emergency number',
      photo: 'Personal photograph',
      report: 'Medical or psychological report',
    },
    myself: 'Myself',
    fromUaePass: 'From UAE PASS',
    change: 'Change',
    consent: 'I confirm the information and documents provided are accurate to the best of my knowledge.',
    submit: 'Confirm and submit',
    note: 'Nothing is submitted until you confirm.',
  },

  submit: {
    working: 'Sending your application to the Ministry…',
    done: 'Received by the Ministry’s platform',
    lead: 'Thank you for applying.',
    primary: 'Your application has been submitted.',
    secondary: 'You can ask me for its status at any time.',
    card: {
      title: 'Application submitted',
      body: 'Application submitted. Keep this number to check its status.',
      copy: 'Copy number',
      copied: 'Copied',
      trackerTitle: 'What happens next',
      steps: [
        { label: 'Eligibility check', state: 'done' },
        { label: 'Submitted', state: 'done' },
        { label: 'Documents under review', state: 'pending' },
        { label: 'Decision', state: 'pending' },
      ],
    },
    suggestion: 'Check application status',
  },

  nudges: {
    choice: 'I didn’t catch the emirate. Please pick one from the list, or type its name.',
  },

  // Variation 2: the same application, as a conversation. Several answers in one message, documents attached to the
  // chat, a sentence summary, and changes by typing. The same data and the same steps as above.
  conv: {
    signIn: {
      title: 'Your details from UAE PASS',
      primary: 'I’ve filled in your details from UAE PASS, so you do not need to enter them again.',
    },
    // What each detail is called when Mira asks for it.
    ask: {
      emirate: 'the emirate you live in',
      emergencyName: 'the full name of your emergency contact',
      emergencyPhone: 'their mobile number, including the country code',
    },
    voice: 'Answer by voice',
    first: 'To continue, I need {list}. You can tell me all of it in one message.',
    exampleLabel: 'For example:',
    example: '“Dubai, Sara Al Ketbi, +971 50 765 4321”',
    nudgeEmirate: 'Please type the name of your emirate, for example Dubai.',
    editPlaceholder: 'Type your emirate…',
    more: 'I still need {list}.',
    plainLead: 'Thank you.',
    ackLead: 'Thank you. I’ve noted {list}.',
    noted: {
      emirate: '{v} as your emirate',
      emergencyName: '{v} as your emergency contact',
      emergencyPhone: '{v} as their number',
      both: '{name} ({phone}) as your emergency contact',
    },
    nudgeLead: 'I didn’t catch that.',
    nudge: 'Please tell me {list}.',
    placeholder: 'e.g. Dubai, Sara Al Ketbi, +971 50 765 4321',
    voiceSample: 'Dubai, Fatima Al Ketbi, +971 50 765 4321',
    docs: {
      lead: 'Good progress.',
      text: 'Please attach your personal photograph (a passport-size photo with a white background) and your medical or psychological report from an accredited authority. You can send both together with the paperclip.',
      one: 'I still need your {missing}. You can attach it with the paperclip.',
      names: { photo: 'photograph', report: 'report' },
      yourNames: { photo: 'your photograph', report: 'your report' },
      card: {
        title: 'Documents',
        button: 'Attach files',
        items: {
          photo: { label: 'Personal photograph', hint: 'Passport-size, white background · JPG or PNG' },
          report: { label: 'Medical or psychological report', hint: 'From an accredited authority · PDF or JPG' },
        },
      },
      placeholder: 'Attach your photograph and report with the paperclip…',
      voiceSample: 'How do I attach my files?',
      nudge: 'Please attach your files with the paperclip. They stay on your device until you submit.',
      wrongType: { photo: 'The photograph needs to be a JPG or PNG.', report: 'The report needs to be a PDF or JPG.' },
      extra: 'I used the first file of each kind and set the others aside.',
    },
    review: {
      lead: 'Thank you, that is everything I need.',
      summary: 'Here is your application. You are applying for yourself, as {name}, living in {emirate}, with {contact} ({phone}) as your emergency contact. Your photograph and report are attached.',
      ask: 'Shall I submit it? Reply “yes”, or tell me what to change.',
      example: '“change my emergency number to +971 50 111 2222”',
      updated: 'Done. I’ve updated {list}.',
      askAgain: 'Shall I submit it now? Reply “yes”, or tell me what else to change.',
      placeholder: 'Reply “yes” to submit, or tell me what to change…',
      voiceSample: 'Yes, submit it',
      nudgeLead: 'I didn’t catch which detail to change.',
      nudge: 'You can tell me what to change.',
      holdLead: 'No problem.',
      hold: 'What would you like to change?',
      changed: { emirate: 'your emirate to {v}', emergencyName: 'your emergency contact to {v}', emergencyPhone: 'their number to {v}' },
    },
    // After an answer to a question asked mid-application, Mira brings the person back.
    resume: {
      multi: 'Shall we carry on with your application? I still need {list}.',
      docs: 'Shall we carry on with your application? I still need your {list}.',
      confirm: 'Shall we carry on with your application? Reply “yes” to submit, or tell me what to change.',
    },
  },
};
