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
    read: 'Thank you, I’ve read your message.',
    readFiles: 'Thank you, I’ve read your message and received your files.',
    readFile: 'Thank you, I’ve read your message and received your file.',
    files: 'Thank you, your files have been received.',
    file: 'Thank you, your file has been received.',
  },
  primary: {
    complete: 'I have what I need, so here is the result of your eligibility check.',
    partial: 'Here is what I understood so far.',
    filesOnly: 'Here is what I have so far.',
    docsUpdated: 'Here are your documents so far.',
  },
  secondary: {
    partial: 'I need a few more details to finish the check, so I will ask only for those.',
    docsMissing: 'You can attach your {missing} here whenever you like, or when we reach the documents step.',
    docsDone: 'Both documents are in, so you will not need to upload them again when you apply.',
    resultAbove: 'Your result is above, and you can continue from there whenever you are ready.',
  },
  notes: {
    replaced: 'I replaced your earlier {kind} with {name}.',
    extra: 'I received more than one {kind}, so I kept the first and set {name} aside.',
  },
};
