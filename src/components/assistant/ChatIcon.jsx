import {
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
  Building03Icon,
  UserGroupIcon,
  UserIcon,
} from '@hugeicons/core-free-icons';

// Icons for the assistant: Hugeicons (stroke, rounded), the set used in the Majlis Figma library.
// Same names the assistant has always used, so content files keep working.
const ICONS = {
  check: Tick02Icon,
  checkCircle: CheckmarkCircle02Icon,
  xCircle: CancelCircleIcon,
  close: Cancel01Icon,
  question: HelpCircleIcon,
  info: InformationCircleIcon,
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
