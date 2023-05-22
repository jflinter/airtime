import { ReactNode, useEffect, useState } from 'react';

type Props = {
  children: ReactNode;
  fallback: ReactNode;
};

export default function IPhoneOnly({ children, fallback }: Props) {
  const [isIphone, setIsIphone] = useState<boolean | null>(null);
  useEffect(() => {
    setIsIphone(!!window.navigator.userAgent.match(/iPhone/i));
  }, []);
  if (isIphone === null) {
    return <></>;
  } else if (isIphone) {
    return <>{children}</>;
  } else {
    return <>{fallback}</>;
  }
}
