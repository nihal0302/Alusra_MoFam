// "My applications" page (the page the chat's "View all applications" button opens). A dummy page on the same website: a table of the
// applications made with the signed-in UAE PASS account. APPROX: all of it is made up and static (five rows, a fixed count). The first row
// is the new one. The two POD card applications show how the page of an application looks: the first gave only the required answers,
// the second (for someone else) gave every answer, the optional ones too (see `submission` in case.en.js). A row opens the application's
// own page (CasePage.jsx).

export const account = {
  title: 'My applications',
  subtitle: 'Applications submitted to the Ministry of Family.',
  count: '5 applications', // fixed text: the number does not change when an application is added (APPROX)
  back: 'Back to home',
  tableLabel: 'Your applications',
  columns: { number: 'Application number', applicant: 'Applicant', appliedFor: 'Applied for', service: 'Service', appliedOn: 'Applied on', status: 'Status', open: 'Open' },
  open: 'View application {number}',
  empty: 'You have not made any application yet.',
  newLabel: 'New', // the mark on the new application's row
  // status: [label, tone]. The tone is the colour of the pill (see tones.css); the same words have the same tone on the application's
  // page (case.en.js). A submitted application is "Under review".
  statuses: {
    draft: ['Draft', 'neutral'],
    review: ['Under review', 'info'],
    documents: ['Requested missing info', 'warning'],
    completed: ['Completed', 'success'], // a finished application: the list does not say what was decided
  },
  applicant: 'Hamdan Al Ketbi',
  // The Ministry's services that a person applies for (the titles are those of the services on the home page). The POD card is the one
  // an application made in the chat is for.
  services: {
    pod: 'Issuance of the People of Determination Card',
    marriage: 'Marriage Grant Application',
    certificate: 'Issuance of a To Whom It May Concern Certificate',
    replacement: 'Request for Issuance of a Replacement for a Lost or Damaged People of Determination Card',
    typeChange: 'Disability Type Change',
  },
  forSelf: 'Myself',
  forOther: 'Someone else',
  // The first row is the new one. Both POD card applications are made up: see the note at the top of this file.
  newRow: { number: 'POD-1043', service: 'pod', applicant: 'Hamdan Al Ketbi', appliedFor: 'self', appliedOn: '28 October 2026', status: 'review' },
  rows: [
    { number: 'POD-1042', service: 'pod', applicant: 'Hamdan Al Ketbi', appliedFor: 'other', appliedOn: '14 October 2026', status: 'documents' },
    { number: 'MGA-0911', service: 'marriage', applicant: 'Hamdan Al Ketbi', appliedFor: 'self', appliedOn: '3 September 2026', status: 'draft' },
    { number: 'DTC-0764', service: 'typeChange', applicant: 'Hamdan Al Ketbi', appliedFor: 'other', appliedOn: '18 July 2026', status: 'completed' },
    { number: 'TWC-0688', service: 'certificate', applicant: 'Hamdan Al Ketbi', appliedFor: 'self', appliedOn: '2 June 2026', status: 'completed' },
  ],
};
