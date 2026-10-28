// The page of one application (opened from a row of "My applications", see CasePage.jsx): its progress, what was submitted, the
// documents and the discussion with the Ministry. From the Figma frame "Main Empty" (MoFam Al Ursa, node 992:64662).
// APPROX: the dates of the steps, the contact preferences, the documents of the sample applications and the discussion are made up;
// nothing is stored anywhere but this browser (see src/lib/account.js). The document cards do not open anything yet.

export const caseView = {
  title: 'Case #{number}',
  back: 'Back to Applications',
  backLabel: 'Back to My applications',
  header: { role: 'Applicant', userMenu: 'Account', languages: { en: 'English', ar: 'العربية', arHref: 'https://www.alusra.gov.ae/ar/' }, languageLabel: 'Language' },

  progress: {
    title: 'Application progress history',
    // the steps, by id; `note` is the line under a step that is not done yet (or the date of one that is). The steps keep their own look
    // (green when done, cream when in progress, a red mark for the applicant's turn), apart from the tags of the list and the discussion.
    steps: {
      draft: { title: 'Draft created' },
      drafting: { title: 'Draft created', current: 'Not submitted yet' },
      submitted: { title: 'Submitted successfully' },
      review: { title: 'Review in progress', current: 'Application under review' },
      // the reviewer asked for more: the review waits (amber), and the next step is the applicant's turn (red)
      paused: { title: 'Review paused', state: 'current', current: 'Resumes when the information is provided' },
      missing: { title: 'Requested missing info', state: 'alert', current: 'Please reply to the reviewer’s request' },
      reviewed: { title: 'Review completed' },
      approved: { title: 'Approved' },
      rejected: { title: 'Rejected' },
    },
    // which steps each status of the "My applications" table shows; the last one of an unfinished application is the current one (a step
    // can set its own `state`: current, or alert for the one that waits for the applicant)
    byStatus: {
      draft: ['drafting'],
      review: ['draft', 'submitted', 'review'],
      documents: ['draft', 'submitted', 'paused', 'missing'],
      approved: ['draft', 'submitted', 'reviewed', 'approved'],
      rejected: ['draft', 'submitted', 'reviewed', 'rejected'],
    },
    done: 'Done',
    current: 'In progress',
    alert: 'Action needed',
  },

  // The Submission column shows what the person gave when applying, in the groups of the application's own review (the labels and the
  // groups are those of `conv.review` in application.conv.en.js; the documents have their own column).
  submission: {
    title: 'Submission',
    // APPROX: what the sample applications "gave", by group of answers. `include` says which groups an application gave (by number); any
    // other one gave the required answers (and the cardholder's, when it is for someone else).
    //   POD-1043 (for myself): only the required answers: the bare minimum.
    //   POD-1042 (for someone else): everything, the optional details and the employment and education answers too.
    sample: {
      required: { emirate: 'Dubai', address: 'Villa 12, Street 5, Al Barsha 1', deliveryMobile: '+971 50 123 4567', disability: 'Autism' },
      cardholder: { cardholderEid: '784-2015-7654321-0', cardholderDob: '4 June 2015' },
      optional: { altMobile: '+971 55 987 6543', eidExpiry: '14 March 2028' },
      work: {
        employmentStatus: 'Employed',
        workSector: 'Government',
        employer: 'Dubai Municipality',
        jobTitle: 'Administrative officer',
        academicDegree: 'Bachelor’s degree',
        educationLevel: 'Higher education',
        institutionLocation: 'Dubai',
        specialSupport: 'No',
        shadowTeacher: 'No',
      },
      include: { 'POD-1043': ['required'], 'POD-1042': ['required', 'cardholder', 'optional', 'work'] },
    },
  },

  documents: {
    title: 'Submitted Documents',
    report: 'Medical report',
    photo: 'Personal photograph',
    // APPROX: the documents of the sample applications, and of an application whose files were not kept
    sample: { report: { name: 'medical-report.pdf', size: '686 KB' }, photo: { name: 'photograph.jpg', size: '183 KB' } },
  },

  discussion: {
    title: 'Case Discussion',
    none: 'No comments yet',
    // The comments of each status, latest first (descending). The statuses that are not here show "No comments yet".
    byStatus: {
      review: ['submitted'],
      documents: ['missingInfo', 'submitted'],
    },
    latest: '2h ago', // APPROX: the latest comment is always "2h ago"; an older one shows the date the application was made
    items: {
      submitted: { chip: 'Application Submitted', tone: 'success', role: 'Applicant' },
      missingInfo: {
        chip: 'Requested Missing Info',
        tone: 'warning',
        text: 'Please provide a clear, high-resolution personal photograph with a plain white background. This image is essential for accurate identification and must meet the specified criteria to ensure it is accepted without delay. Kindly ensure the photo is recent, shows your full face clearly, and is free from shadows or obstructions.',
        by: 'Review Officer',
        cta: 'Edit application', // APPROX: opens nothing yet; it will start the chat to change the application
      },
    },
  },

  notFound: { title: 'Application not found', text: 'This application is not in your list. It may have been made in another browser.', back: 'Back to My applications' },
};
