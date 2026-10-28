// "My applications" page (the page the chat's "View my applications" button opens). A dummy page on the same website: a table of the
// applications made with the signed-in UAE PASS account. APPROX: made-up applications, and a fixed count. The first row is the new one:
// the application just submitted in the chat when there is one (remembered in this browser only, see src/lib/account.js), otherwise
// `newRow`. A row opens the application's own page (CasePage.jsx).

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
  // status: [label, tone]  (tone picks the colour of the pill: draft, review, pending, done, rejected). A submitted application is "Under review".
  statuses: {
    draft: ['Draft', 'draft'],
    review: ['Under review', 'review'],
    documents: ['Documents requested', 'pending'],
    approved: ['Approved', 'done'],
    rejected: ['Rejected', 'rejected'],
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
  // The application that is new: the one just submitted in the chat, when there is one; otherwise this sample (APPROX: made-up).
  newRow: { number: 'POD-1043', service: 'pod', applicant: 'Hamdan Al Ketbi', appliedFor: 'self', appliedOn: '28 October 2026', status: 'review' },
  // The earlier applications (APPROX: made-up; the POD card appears once, as the new application).
  rows: [
    { number: 'RPL-0987', service: 'replacement', applicant: 'Hamdan Al Ketbi', appliedFor: 'other', appliedOn: '14 October 2026', status: 'documents' },
    { number: 'MGA-0911', service: 'marriage', applicant: 'Hamdan Al Ketbi', appliedFor: 'self', appliedOn: '3 September 2026', status: 'draft' },
    { number: 'DTC-0764', service: 'typeChange', applicant: 'Hamdan Al Ketbi', appliedFor: 'other', appliedOn: '18 July 2026', status: 'approved' },
    { number: 'TWC-0688', service: 'certificate', applicant: 'Hamdan Al Ketbi', appliedFor: 'self', appliedOn: '2 June 2026', status: 'rejected' },
  ],
};
