import { useEffect, useState } from 'react';

const QUERY = '(max-width: 639px)';

/** True on phone-width screens (below Tailwind's `sm`); follows rotation and window resizes. */
export default function useIsPhone() {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches;
  const [phone, setPhone] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return undefined;
    const onChange = () => setPhone(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return phone;
}
