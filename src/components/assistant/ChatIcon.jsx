import {
  Alert02Icon,
  ArrowExpand01Icon,
  AttachmentIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowShrink01Icon,
  ArrowUpRight01Icon,
  Briefcase01Icon,
  BubbleChatIcon,
  Call02Icon,
  Camera01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  File01Icon,
  FileAddIcon,
  FileSearchIcon,
  FileViewIcon,
  LeftToRightListBulletIcon,
  Home03Icon,
  Hospital02Icon,
  MessageQuestionIcon,
  Upload01Icon,
  Flag01Icon,
  FavouriteIcon,
  HelpCircleIcon,
  Home01Icon,
  IdVerifiedIcon,
  InformationCircleIcon,
  Location01Icon,
  Mail01Icon,
  Mic01Icon,
  MinusSignIcon,
  RefreshIcon,
  Search01Icon,
  SecurityCheckIcon,
  StopIcon,
  Tick02Icon,
  Delete02Icon,
  Building03Icon,
  UserGroupIcon,
  UserIcon,
} from '@hugeicons/core-free-icons';

// Icons for the assistant: Hugeicons (stroke, rounded), the set used in the Majlis Figma library.
// Same names the assistant has always used, so content files keep working.
const ICONS = {
  check: Tick02Icon,
  trash: Delete02Icon,
  checkCircle: CheckmarkCircle02Icon,
  xCircle: CancelCircleIcon,
  close: Cancel01Icon,
  question: HelpCircleIcon,
  info: InformationCircleIcon,
  warning: Alert02Icon, // a warning triangle
  shield: SecurityCheckIcon,
  file: File01Icon,
  camera: Camera01Icon,
  building: Building03Icon,
  users: UserGroupIcon,
  user: UserIcon,
  refresh: RefreshIcon,
  flag: Flag01Icon,
  chat: BubbleChatIcon,
  expand: ArrowExpand01Icon,
  attach: AttachmentIcon,
  collapse: ArrowShrink01Icon,
  copy: Copy01Icon,
  upload: Upload01Icon,
  fileAdd: FileAddIcon,
  fileSearch: FileSearchIcon,
  fileView: FileViewIcon, // a document with an eye: view the details of an application
  list: LeftToRightListBulletIcon, // a list: all the applications
  messageQuestion: MessageQuestionIcon,
  homeDoor: Home03Icon,
  hospital: Hospital02Icon,
  stop: StopIcon,
  minus: MinusSignIcon,
  mic: Mic01Icon,
  arrowUpRight: ArrowUpRight01Icon,
  arrowRight: ArrowRight01Icon,
  arrowLeft: ArrowLeft01Icon,
  search: Search01Icon,
  home: Home01Icon,
  clock: Clock01Icon,
  card: IdVerifiedIcon,
  phone: Call02Icon,
  mail: Mail01Icon,
  pin: Location01Icon,
  briefcase: Briefcase01Icon,
  heart: FavouriteIcon,
};

// The earlier (Phosphor, 256 grid) person icons, kept for the "Myself" / "Someone else" options.
const S = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 16 };
const LEGACY = {
  phUser: (
    <>
      <circle cx="128" cy="96" r="40" {...S} />
      <path d="M32,216c0-48,43-72,96-72s96,24,96,72" {...S} />
    </>
  ),
  phUserPlus: (
    <>
      <circle cx="104" cy="88" r="40" {...S} />
      <path d="M24,216c0-48,40-72,80-72c18,0,34,4,48,12" {...S} />
      <path d="M200,144v64" {...S} />
      <path d="M168,176h64" {...S} />
    </>
  ),
  phUsers: (
    <>
      <circle cx="88" cy="104" r="32" {...S} />
      <path d="M24,200c0-36,28-56,64-56s64,20,64,56" {...S} />
      <circle cx="184" cy="112" r="24" {...S} />
      <path d="M176,148c32,0,56,16,56,48" {...S} />
    </>
  ),
};

// Plain outline thumbs (a cuff and a hand), drawn on a 24 grid like the rest. The thumb's outline is the same path whether
// the icon is empty or filled; the short line between the cuff and the hand is its own path so it can stay visible on a fill.
const THUMBS = {
  // The plain paperclip of the team's Mira POD Assistant prototype (Variation 2's attach button).
  clip: <path d="m21 11.5-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l8-8" />,
  thumbUp: (
    <>
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
      <path className="noor-icon-cuff" d="M7 10v12" />
    </>
  ),
  thumbDown: (
    <>
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
      <path className="noor-icon-cuff" d="M17 14V2" />
    </>
  ),
};

// Small icons get a heavier stroke so they stay readable (a 1.5 stroke on a 24 grid is ~0.7px at 11px).
const weightFor = (size) => (size <= 14 ? 2.6 : size <= 18 ? 1.9 : 1.6);

export function ChatIcon({ name, size = 18, weight, className }) {
  if (LEGACY[name]) {
    return (
      <svg className={className} viewBox="0 0 256 256" width={size} height={size} aria-hidden="true" focusable="false">
        {LEGACY[name]}
      </svg>
    );
  }
  if (THUMBS[name]) {
    return (
      <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={weight ?? 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {THUMBS[name]}
      </svg>
    );
  }
  const data = ICONS[name];
  if (!data) return null;
  const w = weight ?? weightFor(size);
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      {data.map(([Tag, { key, ...attrs }]) => (
        // pathLength 1 lets ticks draw themselves with a plain 0..1 dash offset.
        <Tag key={key} {...attrs} strokeWidth={w} pathLength="1" />
      ))}
    </svg>
  );
}
