// The page of one application (opened from a row of "My applications", see CasePage.jsx): its progress, what was submitted, the
// documents and the discussion with the Ministry. From the Figma frame "Main Empty" (MoFam Al Ursa, node 992:64662).
// APPROX: the dates of the steps, the contact preferences, the documents of the sample applications and the discussion are made up;
// nothing is stored anywhere but this browser (see src/lib/account.js). The "View document" buttons do not open anything yet.

export const caseView = {
  title: 'Case #{number}',
  back: 'Back to Applications',
  backLabel: 'Back to My applications',
  header: { role: 'Applicant', userMenu: 'Account', languages: { en: 'English', ar: 'العربية', arHref: 'https://www.alusra.gov.ae/ar/' }, languageLabel: 'Language' },

  progress: {
    title: 'Application progress history',
    // the steps, by id; `note` is the line under a step that is not done yet (or the date of one that is)
    steps: {
      draft: { title: 'Draft created' },
      drafting: { title: 'Draft created', current: 'Not submitted yet' },
      submitted: { title: 'Submitted successfully' },
      review: { title: 'Review in progress', current: 'Application under review' },
      documents: { title: 'Review in progress', current: 'Documents requested from the applicant' },
      reviewed: { title: 'Review completed' },
      approved: { title: 'Approved' },
      rejected: { title: 'Rejected' },
    },
    // which steps each status of the "My applications" table shows; the last one of an unfinished application is the current one
    byStatus: {
      draft: ['drafting'],
      review: ['draft', 'submitted', 'review'],
      documents: ['draft', 'submitted', 'documents'],
      approved: ['draft', 'submitted', 'reviewed', 'approved'],
      rejected: ['draft', 'submitted', 'reviewed', 'rejected'],
    },
    done: 'Done',
    current: 'In progress',
  },

  submission: {
    title: 'Submission',
    applicant: 'Applicant',
    contact: 'Contact',
    labels: {
      name: 'Full name',
      eid: 'Emirates ID',
      dob: 'Date of birth',
      gender: 'Gender',
      emirate: 'Emirate',
      appliedFor: 'Applying for',
      mobile: 'Mobile number',
      email: 'Email address',
      language: 'Preferred language',
      channel: 'Preferred contact channel',
    },
    // APPROX: the sample person's emirate when the application did not say (as the sample delivery address in the chat)
    sampleEmirate: 'Dubai',
    language: 'English',
    channel: 'SMS',
    appliedFor: { self: 'Myself', other: 'Someone else' },
  },

  documents: {
    title: 'Submitted Documents',
    report: 'Medical report',
    photo: 'Personal photograph',
    view: 'View document',
    // APPROX: the documents of the sample applications, and of an application whose files were not kept
    sample: { report: { name: 'medical-report.pdf', size: '686 KB' }, photo: { name: 'photograph.jpg', size: '183 KB' } },
  },

  discussion: {
    title: 'Case Discussion',
    none: 'No comments yet',
    // the statuses that have a discussion (the others show "No comments yet")
    statuses: ['review', 'documents'],
    resubmitted: { chip: 'Application Resubmitted', time: '2h ago', role: 'Applicant' },
    missingInfo: {
      chip: 'Requested Missing Info',
      time: '2h ago',
      text: 'Please provide a clear, high-resolution personal photograph with a plain white background. This image is essential for accurate identification and must meet the specified criteria to ensure it is accepted without delay. Kindly ensure the photo is recent, shows your full face clearly, and is free from shadows or obstructions.',
      by: 'Review Officer',
    },
  },

  notFound: { title: 'Application not found', text: 'This application is not in your list. It may have been made in another browser.', back: 'Back to My applications' },
};
