import { DisguiseEntryPage } from "../disguise/DisguiseEntryPage";

interface MobileFortunePageProps {
  onLuckyNumberVerified: () => void;
}

export function MobileFortunePage({ onLuckyNumberVerified }: MobileFortunePageProps) {
  return (
    <div className="mobile-fortune-page">
      <DisguiseEntryPage
        onLuckyNumberVerified={onLuckyNumberVerified}
        initialView="fortune"
        compactMode
      />
    </div>
  );
}
