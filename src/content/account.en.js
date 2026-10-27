// "My applications" page (the page the chat's "View my applications" button opens). A dummy page on the same website: a table of the
// applications made with the signed-in UAE PASS account. APPROX: made-up applications; the one just submitted in the chat is added at
// the top (it is remembered in this browser only, see saveSubmitted in src/lib/account.js). The arrow at the end of each row is
// where the application's own page will open; that page is not built.

export const account = {
  title: 'My applications',
  subtitle: 'Applications made with your UAE PASS account.',
  crumbs: { home: 'Home', here: 'My applications' },
  summary: '{count} applications',
  tableLabel: 'Your applications',
  columns: { number: 'Application number', applicant: 'Applicant', appliedFor: 'Applied for', service: 'Service', appliedOn: 'Applied on', status: 'Status', open: 'Open' },
  open: 'View application {number}',
  empty: 'You have not made any application yet.',
  newLabel: 'New', // for screen readers: the row of an application just submitted is tinted
  // status: [label, tone]  (tone picks the colour of the pill: pending, review, done)
  statuses: {
    received: ['Received', 'pending'],
    review: ['Under review', 'review'],
    documents: ['Documents requested', 'pending'],
    approved: ['Approved', 'done'],
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
  rows: [
    { number: 'POD-1042', service: 'pod', applicant: 'Hamdan Al Ketbi', appliedFor: 'self', appliedOn: '22 October 2026', status: 'review' },
    { number: 'RPL-0987', service: 'replacement', applicant: 'Hamdan Al Ketbi', appliedFor: 'other', appliedOn: '14 October 2026', status: 'documents' },
    { number: 'MGA-0911', service: 'marriage', applicant: 'Hamdan Al Ketbi', appliedFor: 'self', appliedOn: '3 September 2026', status: 'approved' },
    { number: 'DTC-0764', service: 'typeChange', applicant: 'Hamdan Al Ketbi', appliedFor: 'other', appliedOn: '18 July 2026', status: 'approved' },
    { number: 'TWC-0688', service: 'certificate', applicant: 'Hamdan Al Ketbi', appliedFor: 'self', appliedOn: '2 June 2026', status: 'approved' },
  ],
};
