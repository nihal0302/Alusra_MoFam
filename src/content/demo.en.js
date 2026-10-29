// Testing scenarios (not part of the product). The "Scenario" switch decides what the message box is pre-filled with, so a tester
// can walk the whole journey just by pressing send, and see different kinds of person:
//   1  Free: nothing is pre-filled. The tester types (or says) whatever they like and attaches their own files.
//   2  Plain: answers the questions as the chatbot asks them, and gives everything that is asked.
//   3  Everything up front: before even pressing "Start POD application", sends everything in one message: name, Emirates ID, mobile,
//      email, who it is for, the delivery address and both documents. There is no UAE PASS: Mira shows the details, reads the documents,
//      asks the optional questions, and shows the summary.
//   4  Forgetful: like 3, but something is forgotten in the message (the delivery address). Mira asks for what is missing, then goes on.
//   8  Not eligible: the message has everything, but the report is from a private clinic; the reading finds it is not from an accredited
//      authority and Mira says the person is not eligible. (Typing "I do not have the report" at the documents step does the same.)
//   6  Unrecognised question: the box holds a question that has nothing to do with the Ministry ("I want to order a pizza"); Mira says
//      what she can help with and offers the main things.
//   7  No answer found: the box holds a question about the Ministry that its published information does not answer; Mira says she
//      cannot find a reliable answer and points to the support team (email and phone).
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
    ['upfront', 'Everything up front', 'The first message has everything: name, Emirates ID, mobile, email, who it is for, the delivery address and both documents. UAE PASS comes first, to check them; then Mira shows the details, reads the documents, asks the optional questions and shows the summary.'],
    ['forgetful', 'Forgetful', 'Like Everything up front, but something is forgotten in the first message (the delivery address). Mira asks for what is missing, then goes on.'],
    ['returning', 'Returning visitor', 'Someone who left an application half done and has come back: Mira asks whether to continue or start again, and on continue shows what was entered earlier.'],
    ['offtopic', 'Unrecognised question', 'A question that has nothing to do with the Ministry (I want to order a pizza). Mira says what she can help with, and offers to start an application or check a status.'],
    ['noteligible', 'Not eligible', 'The first message has everything, but the report is from a private clinic. The scan finds it is not from an accredited authority, and Mira says the person is not eligible. Typing “I do not have the report” does the same.'],
    ['missinginfo', 'Requested missing info', 'Press Check application status and give any application number (POD-1042 is filled in): the status shows the review paused, the reviewer’s request for more documents, and a box to upload them.'],
    ['gap', 'No answer found', 'A question about the Ministry that its published information does not answer. Mira says she cannot find a reliable answer and points to support: info@alusra.gov.ae or 800 114.'],
  ],
  // The "returning" scenario only: the application that was left half done (made up; nothing is stored). It stopped at the documents step.
  saved: {
    stage: 'documents',
    who: 'self',
    data: { deliveryMobile: '+971 50 123 4567' },
  },
  // The "everything up front" and "forgetful" scenarios: what is in the box on the starting screen.
  landing: {
    upfront: {
      text: 'I want to apply for the People of Determination card for myself. My name is Mariam Al Ketbi, my Emirates ID is 784-1998-1234567-1, my mobile number is 050 123 4567 and my email is mariam@example.com. The card should be delivered to Dubai, Villa 12, Street 5, Al Barsha 1. My photo and the report are attached.',
      files: ['photo', 'report'],
    },
    // the same, but the report is from a private clinic
    noteligible: {
      text: 'I want to apply for the People of Determination card for myself. My name is Mariam Al Ketbi, my Emirates ID is 784-1998-1234567-1, my mobile number is 050 123 4567 and my email is mariam@example.com. The card should be delivered to Dubai, Villa 12, Street 5, Al Barsha 1. My photo and the report are attached.',
      files: ['photo', 'reportPrivate'],
    },
    // the two "cannot answer" scenarios: the question that is in the box on the starting screen
    offtopic: { text: 'I want to order a pizza' },
    gap: { text: 'Does the ministry offer scholarships for university students?' },
    // the same, but the delivery address is forgotten
    forgetful: {
      text: 'I want to apply for the People of Determination card for myself. My name is Mariam Al Ketbi, my Emirates ID is 784-1998-1234567-1, my mobile number is 050 123 4567 and my email is mariam@example.com. My photo and the report are attached.',
      files: ['photo', 'report'],
    },
  },
  samples: {
    // who the card is for (asked after UAE PASS)
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
