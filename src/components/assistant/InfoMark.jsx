import animationData from '../../assets/noor/info-status.json';
import { LottieMark } from './LottieMark.jsx';

// The "a few things to confirm" / "not eligible yet" mark (LottieFiles "Info", in warm amber tones).
export function InfoMark({ className }) {
  return <LottieMark animationData={animationData} className={className} />;
}
