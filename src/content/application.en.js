// POD application, applying for yourself, entirely inside the conversation.
// Source: Figma "Applying for Myself" flow (applicant details → contact → documents → review & submit)
// and the journey map (Identity & access → Assemble → Approve & consent → Submit → application number).
// SAMPLE DATA: there is no UAE PASS or Ministry integration yet; the person below is made up.

export const application = {
  signIn: {
    working: 'Opening UAE PASS…',
    done: 'Signed in with UAE PASS',
    lead: 'Welcome, {first}.',
    primary: 'I’m fetching your details from UAE PASS, so you don’t have to type them.',
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
      lead: 'Thanks, that’s saved you a lot of typing.',
      text: 'Which emirate do you live in?',
      placeholder: 'Type or pick your emirate',
      voiceSample: 'Dubai',
      options: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'],
    },
    emergencyName: {
      kind: 'text',
      label: 'Emergency contact name',
      lead: 'Great, thank you.',
      text: 'Who should we contact in an emergency? Please type their full name.',
      placeholder: 'Their full name',
      voiceSample: 'Fatima Al Ketbi',
      error: 'I need a name with at least two letters. Could you type it again?',
    },
    emergencyPhone: {
      kind: 'text',
      label: 'Emergency contact number',
      lead: 'Thanks, that’s helpful.',
      text: 'And their mobile number?',
      placeholder: 'For example 050 123 4567',
      voiceSample: '050 765 4321',
      error: 'That doesn’t look like a UAE mobile number. Try something like 050 123 4567.',
    },
    photo: {
      kind: 'file',
      field: 'photo',
      label: 'Personal photograph',
      lead: 'Almost there, just two documents left.',
      text: 'Please upload your personal photograph: a passport-size photo with a white background.',
      placeholder: 'Choose your photo above',
      voiceSample: 'How do I upload it?',
      upload: { title: 'Personal photograph', hint: 'JPG or PNG · up to 10 MB', accept: 'image/jpeg,image/png', types: ['image/jpeg', 'image/png'], typeNames: 'a JPG or PNG', button: 'Choose photo' },
    },
    report: {
      kind: 'file',
      field: 'report',
      label: 'Medical or psychological report',
      lead: 'Lovely, that photo is perfect.',
      text: 'Now your medical or psychological report, issued by an accredited official authority.',
      placeholder: 'Choose your report above',
      voiceSample: 'How do I upload it?',
      upload: { title: 'Medical or psychological report', hint: 'PDF or JPG · up to 10 MB', accept: 'application/pdf,image/jpeg', types: ['application/pdf', 'image/jpeg'], typeNames: 'a PDF or JPG', button: 'Choose report' },
    },
  },
  upload: {
    maxMb: 10,
    drop: 'or drop it here',
    errors: { type: 'That file type isn’t accepted. Please choose {types}.', size: 'That file is larger than 10 MB. Please choose a smaller one.' },
    nudge: 'Please use the button above to choose your file. It stays on your device until you submit.',
  },

  review: {
    lead: 'Thank you, I have everything I need.',
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
    lead: 'Well done, {first}.',
    primary: 'Your application has been submitted.',
    secondary: 'I’ll keep an eye on it. You can ask me for its status at any time.',
    card: {
      title: 'Application submitted',
      refLabel: 'Your application number',
      copy: 'Copy number',
      copied: 'Copied',
      trackerTitle: 'What happens next',
      steps: [
        { label: 'Eligibility check', state: 'done' },
        { label: 'Submitted', state: 'done' },
        { label: 'Document processing', state: 'pending' },
        { label: 'Authorized Reviewer', state: 'pending' },
        { label: 'Decision', state: 'pending' },
      ],
      notify: 'We’ll notify you by SMS and email as your application moves forward.',
    },
    suggestion: 'Check application status',
  },

  nudges: {
    choice: 'I didn’t catch the emirate. Please pick one from the list, or type its name.',
  },
};
