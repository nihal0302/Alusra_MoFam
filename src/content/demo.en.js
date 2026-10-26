// Testing scenarios (not part of the product). The "Scenario" switch decides what the message box is pre-filled with, so a tester
// can walk the whole journey just by pressing send, and see different kinds of person:
//   1  Free: nothing is pre-filled. The tester types (or says) whatever they like and attaches their own files.
//   2  Plain: answers the questions as the chatbot asks them, and gives everything that is asked.
//   3  Everything up front: before even pressing "Start POD application", sends all the details and both documents in one message.
//   4  Forgetful: answers like scenario 2, but leaves some things out (so the chatbot has to ask again).
// The samples are made-up. The key is the question the chatbot is asking; each key lists the sample for the first time it is asked,
// then for each time it is asked again (a repeat happens when something was missing). `default` is used when a scenario has no
// list of its own. An entry is a text, or { text, files } where files are the sample documents to attach ('photo', 'report').
// Scenarios are identified by name here and in the code (free, plain, upfront, forgetful); the numbers are only labels.

export const demo = {
  label: 'Scenario',
  // [id, label on the switch, what it is (shown when the label is hovered)]
  options: [
    ['free', '1', 'Free: nothing is pre-filled. Type or say whatever you like, and attach your own files.'],
    ['plain', '2', 'Plain: answers each question as it is asked. A complete sample answer is pre-filled for every question.'],
    ['upfront', '3', 'Everything up front: before pressing Start POD application, all the details and both documents are already in the message box.'],
    ['forgetful', '4', 'Forgetful: like 2, but some things are missed (two eligibility answers, the delivery address, one document at a time), so the chatbot asks again.'],
  ],
  // The "everything up front" scenario only: what is in the box on the starting screen.
  landing: {
    text: 'I am an Emirati citizen and I want to apply for the People of Determination card for myself. I have a medical report from a government hospital. My photo and the report are attached.',
    files: ['photo', 'report'],
  },
  samples: {
    // the four eligibility questions
    batch: {
      default: ['It is for myself, I am an Emirati citizen, I have a medical report and it is from a government hospital.'],
      forgetful: ['1. Myself  2. Emirati citizen', '3. Yes  4. Yes, a government hospital'],
    },
    cardholder: { default: ['784-1985-1234567-1, born 15 May 1985'] },
    delivery: {
      default: ['Dubai, Villa 12, Street 5, Al Barsha 1'],
      forgetful: ['Dubai', 'Villa 12, Street 5, Al Barsha 1'],
    },
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
