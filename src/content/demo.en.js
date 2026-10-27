// Testing scenarios (not part of the product). The "Scenario" switch decides what the message box is pre-filled with, so a tester
// can walk the whole journey just by pressing send, and see different kinds of person:
//   1  Free: nothing is pre-filled. The tester types (or says) whatever they like and attaches their own files.
//   2  Plain: answers the questions as the chatbot asks them, and gives everything that is asked.
//   3  Everything up front: before even pressing "Start POD application", sends all the details and both documents in one message.
//   4  Forgetful: like 3, one message with the details and both documents, but something is forgotten in it (the citizenship). Mira
//      asks for what is missing, then gives the eligibility result, then goes on with the application.
//   5  Returning: the person left an application half done and has come back. On "Apply for a POD card" Mira asks whether to
//      continue or start again; "continue" shows what was entered earlier and asks the next question (see `saved` below).
// The samples are made-up. The key is the question the chatbot is asking; each key lists the sample for the first time it is asked,
// then for each time it is asked again (a repeat happens when something was missing). `default` is used when a scenario has no
// list of its own. An entry is a text, or { text, files } where files are the sample documents to attach ('photo', 'report').
// Scenarios are identified by name here and in the code (free, plain, upfront, forgetful); the numbers are only labels.

export const demo = {
  label: 'Scenario',
  // [id, label on the switch, what it is (shown when the label is hovered)]
  options: [
    ['free', 'Free', 'Nothing is pre-filled. Speak or type whatever you wish, and attach your own files.'],
    ['plain', 'Pre-filled answers', 'Answers each question as it is asked. A complete sample answer is pre-filled for every question.'],
    ['upfront', 'Everything up front', 'Before pressing Apply for a POD card, all the details and both documents are already in the message box.'],
    ['forgetful', 'Forgetful', 'Like Everything up front, but something is forgotten in the first message (the citizenship). Mira asks for what is missing, gives the eligibility result, then takes you through the application.'],
    ['returning', 'Returning visitor', 'Someone who left an application half done and has come back: Mira asks whether to continue or start again, and on continue shows what was entered earlier.'],
  ],
  // The "returning" scenario only: the application that was left half done (made up; nothing is stored). It stopped at the documents step.
  saved: {
    stage: 'documents',
    who: 'self',
    eligibility: { who: 'self', status: 'citizen', report: 'yes', accredited: 'yes' },
    data: { emirate: 'Dubai', address: 'Villa 12, Street 5, Al Barsha 1', deliveryMobile: '+971 50 123 4567' },
  },
  // The "everything up front" and "forgetful" scenarios: what is in the box on the starting screen.
  landing: {
    upfront: {
      text: 'I am an Emirati citizen and I want to apply for the People of Determination card for myself. I have a medical report from a government hospital. My photo and the report are attached.',
      files: ['photo', 'report'],
    },
    // the same, but the citizenship is forgotten
    forgetful: {
      text: 'I want to apply for the People of Determination card for myself. I have a medical report from a government hospital. My photo and the report are attached.',
      files: ['photo', 'report'],
    },
  },
  samples: {
    // who the card is for (asked after UAE PASS), and the eligibility questions: two for yourself, three for someone else
    who: { default: ['Myself'], forgetful: ['Myself'] },
    // (the answers to the eligibility questions that are asked are written from the questions themselves: see sampleFor)
    cardholder: { default: ['784-1985-1234567-1, born 15 May 1985'] },
    delivery: {
      default: ['Dubai, Villa 12, Street 5, Al Barsha 1'],
      forgetful: ['Dubai', 'Villa 12, Street 5, Al Barsha 1'],
    },
    // Mira's reading of the report: "Is that correct?" (and, if changed, the type)
    detected: { default: ['Yes, that is correct'] },
    disability: { default: ['Autism'] },
    documents: {
      default: [{ files: ['photo', 'report'] }],
      forgetful: [{ files: ['photo'] }, { files: ['report'] }],
    },
    extras: { default: ['050 111 2222, expires 20 March 2030'] },
    employment: { default: ['Self-employed'] },
    workplace: { default: ['Private sector, Al Noor Trading, accountant'] },
    education: { default: ['Higher education, bachelor’s degree, in Dubai'] },
    support: { default: ['Support yes, shadow teacher no'] },
    confirm: { default: ['Yes, submit it'] },
  },
};
