// "Everything in one message": a person describes their situation and attaches their files in one go, and Mira
// reads what she can, shows what she understood, and either gives the eligibility result or asks only for what is
// missing. Copy for those turns; the logic is in src/lib/intake.js.
//
// Mira cannot open or read the files in this prototype. She files them by type (a photo is the photograph, a PDF is
// the report) and says so; nothing here claims a document was checked.

export const intake = {
  card: {
    title: 'What I understood',
    detailsLabel: 'Your details',
    docsLabel: 'Your documents',
    missing: 'Still needed',
    notAttached: 'Not attached yet',
    changeLabel: 'Change',
    note: 'Your files stay on your device. Nothing is submitted.',
  },
  docLabels: { photo: 'Personal photograph', report: 'Medical or psychological report' },
  docNames: { photo: 'photograph', report: 'report' },
  received: 'Received',
  stillToAttach: 'Still to attach',

  leads: {
    read: 'Thank you, I have read your message.',
    readFiles: 'Thank you, I have read your message and received your files.',
    readFile: 'Thank you, I have read your message and received your file.',
    files: 'Thank you, your files have been received.',
    file: 'Thank you, your file has been received.',
  },
  primary: {
    complete: 'I have what I need, so here is the result of your eligibility check.',
    docsUpdated: 'Here are your documents so far.',
  },
  // While answers are still coming in one at a time, Mira only says what she has noted (no card until all four are in).
  notedLead: 'I have noted {list}.',
  noted: {
    who: { self: 'that you are applying for yourself', other: 'that you are applying on behalf of someone else' },
    status: {
      citizen: 'that you are an Emirati citizen',
      resident: 'that you are a legal UAE resident',
      neither: 'that you are neither an Emirati citizen nor a legal UAE resident',
      unsure: 'that you are not sure about your citizenship or residency',
    },
    report: { yes: 'that there is a medical or psychological report', no: 'that there is no report yet', unsure: 'that you are not sure about the report' },
    accredited: {
      yes: 'that the report was issued by an accredited official authority',
      no: 'that the report was not issued by an accredited official authority',
      unsure: 'that you are not sure whether the report was issued by an accredited official authority',
    },
  },
  secondary: {
    docsMissing: 'You can attach your {missing} here whenever you like, or when we reach the documents step.',
    docsDone: 'Both documents are in, so you will not need to upload them again when you apply.',
    resultAbove: 'Your result is above, and you can continue from there whenever you are ready.',
  },
  notes: {
    replaced: 'I replaced your earlier {kind} with {name}.',
    extra: 'I received more than one {kind}, so I kept the first and set {name} aside.',
  },
};
