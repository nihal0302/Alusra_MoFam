import animationData from '../../assets/noor/success-check.json';
import { LottieMark } from './LottieMark.jsx';

// The success tick (LottieFiles "Success Check", white background layer removed).
export function SuccessCheck({ className }) {
  return <LottieMark animationData={animationData} className={className} />;
}
